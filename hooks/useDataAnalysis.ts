'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { DataContext, DataRow } from '@/lib/types';
import { analyzeData } from '@/lib/analysis-utils';

export function useDataAnalysis() {
  const [dataContext, setDataContext] = useState<DataContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadData = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as DataRow[];
          if (data.length === 0) {
            setError('El archivo está vacío');
            setIsLoading(false);
            return;
          }

          const columns = Object.keys(data[0] || {});
          
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
        },
        error: (error) => {
          setError(`Error al parsear CSV: ${error.message}`);
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
