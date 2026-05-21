'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataContext, DataRow } from '@/lib/types';
import { analyzeData } from '@/lib/analysis-utils';

export interface WorkspaceDataset extends DataContext {
  id: string;
  fileSize: string;
  originalData?: DataRow[];
  originalColumns?: string[];
  appliedCleanOptions?: CleanOptions;
  aiPrepExplanation?: string;
}

function checkIsDatasetCleanAndSorted(data: any[], columns: string[]) {
  if (data.length <= 1) {
    return { isCleanAndSorted: true, sortedBy: null, sortedOrder: 'asc' as const };
  }

  // 1. Check duplicates (using up to 200 rows)
  const sampleForDuplicates = data.slice(0, 200);
  const stringifiedRows = sampleForDuplicates.map(row => columns.map(c => String(row[c] ?? '')).join('|||'));
  const hasDuplicates = stringifiedRows.length - new Set(stringifiedRows).size > 0;
  if (hasDuplicates) return { isCleanAndSorted: false };

  // 2. Check nulls (up to 200 rows)
  let hasNulls = false;
  const sampleForNulls = data.slice(0, 200);
  for (const row of sampleForNulls) {
    for (const col of columns) {
      const val = row[col];
      if (val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val))) {
        hasNulls = true;
        break;
      }
    }
    if (hasNulls) break;
  }
  if (hasNulls) return { isCleanAndSorted: false };

  // 3. Check if sorted (up to 100 rows)
  let sortedBy: string | null = null;
  let sortedOrder: 'asc' | 'desc' = 'asc';
  const sampleForSort = data.slice(0, 100);
  for (const col of columns) {
    let isAsc = true;
    let isDesc = true;
    for (let i = 0; i < sampleForSort.length - 1; i++) {
      const valA = sampleForSort[i][col];
      const valB = sampleForSort[i + 1][col];
      if (valA === undefined || valA === null || valB === undefined || valB === null) {
        isAsc = false;
        isDesc = false;
        break;
      }
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA > numB) isAsc = false;
        if (numA < numB) isDesc = false;
      } else {
        const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        if (comp > 0) isAsc = false;
        if (comp < 0) isDesc = false;
      }
      if (!isAsc && !isDesc) break;
    }
    if (isAsc) {
      sortedBy = col;
      sortedOrder = 'asc';
      break;
    } else if (isDesc) {
      sortedBy = col;
      sortedOrder = 'desc';
      break;
    }
  }

  return {
    isCleanAndSorted: sortedBy !== null,
    sortedBy,
    sortedOrder
  };
}

export interface CleanOptions {
  removeDuplicates: boolean;
  nullAction: 'fill_mean_na' | 'drop_rows' | 'keep';
  sortByColumn: string | null;
  sortOrder: 'asc' | 'desc';
  selectedColumns: string[];
  trimStrings: boolean;
  standardizeText: boolean;
}

export function getCleanedData(data: DataRow[], columns: string[], options: CleanOptions): DataRow[] {
  const colsToKeep = options.selectedColumns.length > 0 ? options.selectedColumns : columns;
  
  // 1. Trim strings & convert empty strings to null, copy values
  let cleaned = data.map(row => {
    const newRow: DataRow = {};
    for (const col of colsToKeep) {
      let val = row[col];
      if (typeof val === 'string') {
        if (options.trimStrings) {
          val = val.trim();
        }
        if (options.standardizeText) {
          val = val.replace(/\s+/g, ' ');
        }
        if (val === '') {
          val = null;
        }
      }
      newRow[col] = val;
    }
    return newRow;
  });

  // 2. Remove rows that are completely empty
  cleaned = cleaned.filter(row => {
    return colsToKeep.some(col => {
      const val = row[col];
      return val !== undefined && val !== null && val !== '';
    });
  });

  // 3. Remove duplicates
  if (options.removeDuplicates) {
    const seen = new Set<string>();
    cleaned = cleaned.filter(row => {
      const key = colsToKeep.map(col => String(row[col] ?? '')).join('|||');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 4. Handle null/missing values
  if (options.nullAction === 'drop_rows') {
    cleaned = cleaned.filter(row => {
      return colsToKeep.every(col => {
        const val = row[col];
        return val !== undefined && val !== null && val !== '' && !(typeof val === 'number' && isNaN(val));
      });
    });
  } else if (options.nullAction === 'fill_mean_na') {
    const columnMeans: Record<string, number> = {};
    for (const col of colsToKeep) {
      const numVals = cleaned
        .map(row => row[col])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (numVals.length > 0) {
        columnMeans[col] = numVals.reduce((a, b) => a + b, 0) / numVals.length;
      }
    }

    cleaned = cleaned.map(row => {
      const newRow: DataRow = {};
      for (const col of colsToKeep) {
        let val = row[col];
        if (val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val))) {
          if (col in columnMeans) {
            newRow[col] = Math.round(columnMeans[col] * 100) / 100;
          } else {
            newRow[col] = 'N/A';
          }
        } else {
          newRow[col] = val;
        }
      }
      return newRow;
    });
  }

  // 5. Sort data if requested
  if (options.sortByColumn && colsToKeep.includes(options.sortByColumn)) {
    const col = options.sortByColumn;
    const orderMultiplier = options.sortOrder === 'asc' ? 1 : -1;
    cleaned.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];

      if (valA === undefined || valA === null || valA === 'N/A') return 1 * orderMultiplier;
      if (valB === undefined || valB === null || valB === 'N/A') return -1 * orderMultiplier;

      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return (numA - numB) * orderMultiplier;
      }

      const isDateA = typeof valA === 'string' && isNaN(Number(valA)) && !isNaN(Date.parse(valA));
      const isDateB = typeof valB === 'string' && isNaN(Number(valB)) && !isNaN(Date.parse(valB));
      if (isDateA && isDateB) {
        return (Date.parse(valA) - Date.parse(valB)) * orderMultiplier;
      }

      return String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * orderMultiplier;
    });
  }

  return cleaned;
}

export function useDataAnalysis() {
  const [datasets, setDatasets] = useState<WorkspaceDataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataContext = datasets.find(d => d.id === activeDatasetId) || null;

  const parseExcelFile = async (file: File, buffer: ArrayBuffer): Promise<{ columns: string[]; data: DataRow[] } | null> => {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        setError('El archivo Excel no tiene hojas válidas');
        return null;
      }
      
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet) as DataRow[];
      
      if (data.length === 0) {
        setError('El archivo Excel está vacío');
        return null;
      }
      
      const columns = Object.keys(data[0] || {});
      return { columns, data };
    } catch (err) {
      setError(`Error al parsear Excel: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      return null;
    }
  };

  const parseCSVFile = (file: File, text: string): Promise<{ columns: string[]; data: DataRow[] } | null> => {
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as DataRow[];
          if (data.length === 0) {
            setError('El archivo está vacío');
            resolve(null);
            return;
          }
          const columns = Object.keys(data[0] || {});
          resolve({ columns, data });
        },
        error: (error: any) => {
          setError(`Error al parsear CSV: ${error.message}`);
          resolve(null);
        },
      });
    });
  };

  const processData = (columns: string[], data: DataRow[]) => {
    // Convertir strings numéricos a números
    const processedData = data.map(row => {
      const newRow: DataRow = {};
      for (const col of columns) {
        const val = row[col];
        const numVal = parseFloat(String(val));
        newRow[col] = isNaN(numVal) ? val : numVal;
      }
      return newRow;
    });

    // Ejecutar análisis
    const analysis = analyzeData(processedData, columns);

    return { processedData, analysis };
  };

  const uploadData = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      
      let parseResult: { columns: string[]; data: DataRow[] } | null = null;
      
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        parseResult = await parseExcelFile(file, buffer);
      } else {
        const text = await file.text();
        parseResult = await parseCSVFile(file, text);
      }
      
      if (!parseResult) {
        setIsLoading(false);
        return;
      }

      const { columns, data } = parseResult;
      const { processedData, analysis } = processData(columns, data);

      const datasetId = Date.now().toString();
      const fileSizeKB = (file.size / 1024).toFixed(1) + ' KB';

      // Verificar si requiere limpieza automática
      const check = checkIsDatasetCleanAndSorted(processedData, columns);
      let appliedCleanOptions: CleanOptions | undefined = undefined;
      let aiPrepExplanation: string | undefined = undefined;
      let finalData = processedData;
      let finalColumns = columns;

      if (!check.isCleanAndSorted) {
        try {
          // Consultar sugerencias de limpieza a la API
          const suggestResponse = await fetch('/api/prep-suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: processedData.slice(0, 15),
              columns: columns
            })
          });
          if (suggestResponse.ok) {
            const suggestion = await suggestResponse.json();
            if (suggestion) {
              const opts: CleanOptions = {
                removeDuplicates: true,
                nullAction: suggestion.nullAction || 'fill_mean_na',
                sortByColumn: suggestion.sortByColumn || null,
                sortOrder: suggestion.sortOrder || 'asc',
                selectedColumns: suggestion.selectedColumns || columns,
                trimStrings: true,
                standardizeText: true,
              };
              appliedCleanOptions = opts;
              aiPrepExplanation = suggestion.explanation;

              // Aplicar limpieza inmediatamente
              const cleaned = getCleanedData(processedData, columns, opts);
              const colsToKeep = opts.selectedColumns.length > 0 ? opts.selectedColumns : columns;
              const reProcessed = processData(colsToKeep, cleaned);
              finalData = reProcessed.processedData;
              finalColumns = colsToKeep;
            }
          }
        } catch (e) {
          console.error('Error en autolimpieza al cargar archivo:', e);
        }
      }

      const newDataset: WorkspaceDataset = {
        id: datasetId,
        fileSize: fileSizeKB,
        filename: file.name,
        rowCount: finalData.length,
        columnCount: finalColumns.length,
        columns: finalColumns,
        data: finalData,
        originalData: processedData,
        originalColumns: columns,
        appliedCleanOptions,
        aiPrepExplanation,
        analysis: {
          summary: aiPrepExplanation 
            ? `Optimizado automáticamente con IA: ${aiPrepExplanation}`
            : `Archivo cargado: ${file.name} con ${finalData.length} filas`,
          statistics: analysis.statistics || {},
          insights: analysis.insights || [],
          recommendedCharts: analysis.recommendedCharts || [],
        },
      };

      setDatasets(prev => [...prev, newDataset]);
      setActiveDatasetId(datasetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);



  const cleanDataset = useCallback((id: string, options?: CleanOptions) => {
    const opts = options || {
      removeDuplicates: true,
      nullAction: 'fill_mean_na',
      sortByColumn: null,
      sortOrder: 'asc',
      selectedColumns: [],
      trimStrings: true,
      standardizeText: true,
    };

    setDatasets(prev => {
      return prev.map(dataset => {
        if (dataset.id !== id) return dataset;

        const sourceData = dataset.originalData || dataset.data;
        const sourceColumns = dataset.originalColumns || dataset.columns;
        const colsToKeep = opts.selectedColumns.length > 0 ? opts.selectedColumns : sourceColumns;
        const cleanedData = getCleanedData(sourceData, sourceColumns, opts);
        const { processedData, analysis } = processData(colsToKeep, cleanedData);

        return {
          ...dataset,
          rowCount: processedData.length,
          columnCount: colsToKeep.length,
          columns: colsToKeep,
          data: processedData,
          appliedCleanOptions: opts,
          analysis: {
            summary: `Dataset depurado e indexado. Se aplicaron filtros personalizados.`,
            statistics: analysis.statistics || {},
            insights: [
              ...(analysis.insights || []),
              `Limpieza personalizada aplicada. Total filas final: ${processedData.length}.`
            ],
            recommendedCharts: analysis.recommendedCharts || [],
          }
        };
      });
    });
  }, []);

  const previewCleanDataset = useCallback((id: string, options: CleanOptions): DataRow[] => {
    const dataset = datasets.find(d => d.id === id);
    if (!dataset) return [];
    const sourceData = dataset.originalData || dataset.data;
    const sourceColumns = dataset.originalColumns || dataset.columns;
    return getCleanedData(sourceData, sourceColumns, options);
  }, [datasets]);

  const removeDataset = useCallback((id: string) => {
    setDatasets(prev => {
      const next = prev.filter(d => d.id !== id);
      if (activeDatasetId === id) {
        if (next.length > 0) {
          setActiveDatasetId(next[next.length - 1].id);
        } else {
          setActiveDatasetId(null);
        }
      }
      return next;
    });
  }, [activeDatasetId]);

  const selectDataset = useCallback((id: string) => {
    setActiveDatasetId(id);
  }, []);

  const clearData = useCallback(() => {
    setDatasets([]);
    setActiveDatasetId(null);
    setError(null);
  }, []);

  return {
    datasets,
    activeDatasetId,
    dataContext,
    isLoading,
    error,
    uploadData,
    removeDataset,
    selectDataset,
    clearData,
    cleanDataset,
    previewCleanDataset,
  };
}
