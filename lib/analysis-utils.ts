import { DataRow, AnalysisResult } from './types';
import * as ss from 'simple-statistics';

export function analyzeData(data: DataRow[], columns: string[]): Partial<AnalysisResult> {
  const statistics: { [key: string]: any } = {};
  const insights: string[] = [];
  const recommendedCharts: string[] = [];

  // Analizar cada columna numérica
  const numericColumns = columns.filter(col => {
    return data.some(row => typeof row[col] === 'number');
  });

  numericColumns.forEach(col => {
    const values = data
      .map(row => row[col])
      .filter((val): val is number => typeof val === 'number');

    if (values.length > 0) {
      statistics[col] = {
        mean: ss.mean(values),
        median: ss.median(values),
        min: Math.min(...values),
        max: Math.max(...values),
        stdDev: ss.standardDeviation(values),
      };
    }
  });

  // Generar insights basados en los datos
  if (numericColumns.length > 0) {
    insights.push(`Se encontraron ${numericColumns.length} columnas numéricas en tu dataset`);
    insights.push(`Total de filas: ${data.length}`);
    insights.push(`Total de columnas: ${columns.length}`);
  }

  // Recomendar gráficos basados en estructura de datos
  if (numericColumns.length === 1) {
    recommendedCharts.push('histogram', 'bar');
  } else if (numericColumns.length === 2) {
    recommendedCharts.push('scatter', 'line');
  } else if (numericColumns.length > 2) {
    recommendedCharts.push('line', 'bar', 'scatter');
  }

  // Detectar patrones
  if (numericColumns.length > 0) {
    const firstNumCol = numericColumns[0];
    const vals = data
      .map(row => row[firstNumCol])
      .filter((val): val is number => typeof val === 'number');
    
    if (vals.length > 0) {
      const avgValue = ss.mean(vals);
      insights.push(`Valor promedio de ${firstNumCol}: ${avgValue.toFixed(2)}`);
    }
  }

  return {
    statistics,
    insights,
    recommendedCharts,
  };
}

export function formatNumber(num: number | undefined): string {
  if (num === undefined) return 'N/A';
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}
