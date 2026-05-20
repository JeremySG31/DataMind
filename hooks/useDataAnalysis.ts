'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataContext, DataRow } from '@/lib/types';
import { analyzeData } from '@/lib/analysis-utils';

export interface WorkspaceDataset extends DataContext {
  id: string;
  fileSize: string;
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

      const newDataset: WorkspaceDataset = {
        id: datasetId,
        fileSize: fileSizeKB,
        filename: file.name,
        rowCount: processedData.length,
        columnCount: columns.length,
        columns,
        data: processedData,
        analysis: {
          summary: `Archivo cargado: ${file.name} con ${processedData.length} filas`,
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

  const cleanDataset = useCallback((id: string) => {
    setDatasets(prev => {
      return prev.map(dataset => {
        if (dataset.id !== id) return dataset;

        const { columns, data } = dataset;
        
        // 1. Eliminar filas duplicadas (duplicados de fila completa)
        const stringifiedRows = data.map(row => JSON.stringify(row));
        const uniqueIndices = new Set<number>();
        const seen = new Set<string>();
        for (let i = 0; i < stringifiedRows.length; i++) {
          if (!seen.has(stringifiedRows[i])) {
            seen.add(stringifiedRows[i]);
            uniqueIndices.add(i);
          }
        }
        let cleanedData = data.filter((_, idx) => uniqueIndices.has(idx));

        // 2. Limpiar espacios en blanco (trim) en strings y normalizar valores nulos
        cleanedData = cleanedData.map(row => {
          const newRow: DataRow = {};
          for (const col of columns) {
            let val = row[col];
            if (typeof val === 'string') {
              val = val.trim();
              if (val === '') val = null;
            }
            newRow[col] = val;
          }
          return newRow;
        });

        // 3. Eliminar filas que estén completamente vacías
        cleanedData = cleanedData.filter(row => {
          return columns.some(col => {
            const val = row[col];
            return val !== undefined && val !== null && val !== '';
          });
        });

        // 4. Autorellenar celdas vacías (imputación simple)
        // Para numéricos, rellenar con la media. Para strings, rellenar con "N/A"
        const columnMeans: Record<string, number> = {};
        for (const col of columns) {
          const numVals = cleanedData
            .map(row => row[col])
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));
          if (numVals.length > 0) {
            columnMeans[col] = numVals.reduce((a, b) => a + b, 0) / numVals.length;
          }
        }

        cleanedData = cleanedData.map(row => {
          const newRow: DataRow = {};
          for (const col of columns) {
            let val = row[col];
            if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) {
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

        // Convertir strings numéricos y volver a analizar
        const { processedData, analysis } = processData(columns, cleanedData);

        return {
          ...dataset,
          rowCount: processedData.length,
          data: processedData,
          analysis: {
            summary: `Dataset depurado automáticamente. Se removieron duplicados y se imputaron valores nulos.`,
            statistics: analysis.statistics || {},
            insights: [
              ...(analysis.insights || []),
              'Limpieza automática realizada: datos completos al 100%.'
            ],
            recommendedCharts: analysis.recommendedCharts || [],
          }
        };
      });
    });
  }, []);

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
  };
}
