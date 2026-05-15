'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataContext, DataRow } from '@/lib/types';
import { analyzeData } from '@/lib/analysis-utils';

export function useDataAnalysis() {
  const [dataContext, setDataContext] = useState<DataContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        error: (error) => {
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

      setDataContext({
        filename: file.name,
        rowCount: processedData.length,
        columnCount: columns.length,
        columns,
        data: processedData,
        analysis: {
          summary: `Archivo cargado: ${file.name} con ${processedData.length} filas`,
          ...analysis,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setDataContext(null);
    setError(null);
  }, []);

  return {
    dataContext,
    isLoading,
    error,
    uploadData,
    clearData,
  };
}
