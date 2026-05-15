import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface AnalysisReport {
  title: string;
  description: string;
  generatedAt: Date;
  datasetName: string;
  summary: {
    rowCount: number;
    columnCount: number;
    columns: string[];
  };
  statistics: Record<string, any>;
  insights: string[];
  visualizations: {
    name: string;
    dataUrl: string;
  }[];
}

// Exportar análisis a PDF
export async function exportAnalysisToPDF(
  report: AnalysisReport,
  fileName: string = 'analisis-datos.pdf'
) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Encabezado
    doc.setFontSize(20);
    doc.text(report.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Información general
    doc.setFontSize(10);
    doc.text(`Generado: ${report.generatedAt.toLocaleString()}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Dataset: ${report.datasetName}`, 20, yPosition);
    yPosition += 10;
    
    // Resumen del dataset
    doc.setFontSize(14);
    doc.text('Resumen del Dataset', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.text(`Filas: ${report.summary.rowCount}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Columnas: ${report.summary.columnCount}`, 20, yPosition);
    yPosition += 10;
    
    // Estadísticas
    if (Object.keys(report.statistics).length > 0) {
      doc.setFontSize(14);
      doc.text('Estadísticas', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(9);
      for (const [key, value] of Object.entries(report.statistics)) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        const displayValue = typeof value === 'number' 
          ? value.toFixed(2) 
          : JSON.stringify(value);
        doc.text(`${key}: ${displayValue}`, 20, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
    }
    
    // Insights
    if (report.insights.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Insights Generados', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      report.insights.forEach(insight => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        const lines = doc.splitTextToSize(`• ${insight}`, pageWidth - 40);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 2;
      });
    }
    
    // Visualizaciones
    report.visualizations.forEach((viz, index) => {
      doc.addPage();
      doc.setFontSize(14);
      doc.text(viz.name, 20, 20);
      
      try {
        doc.addImage(viz.dataUrl, 'PNG', 20, 40, pageWidth - 40, 150);
      } catch (e) {
        console.error('Error añadiendo imagen:', e);
      }
    });
    
    doc.save(fileName);
    return { success: true };
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    return { success: false, error };
  }
}

// Capturar elemento HTML como imagen
export async function captureElementAsImage(elementId: string): Promise<string> {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Elemento con ID ${elementId} no encontrado`);
    
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturando elemento:', error);
    return '';
  }
}

// Exportar análisis como JSON
export function exportAnalysisAsJSON(report: AnalysisReport, fileName: string = 'analisis.json') {
  try {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error exportando JSON:', error);
    return { success: false, error };
  }
}

// Exportar análisis como CSV
export function exportAnalysisAsCSV(
  data: Record<string, any>[],
  fileName: string = 'datos.csv'
) {
  try {
    if (data.length === 0) return { success: false, error: 'Sin datos para exportar' };
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error exportando CSV:', error);
    return { success: false, error };
  }
}

// Crear resumen de análisis para mostrar en UI
export function createAnalysisSummary(
  data: Record<string, number[]>,
  columnName: string
): string[] {
  const column = data[columnName];
  if (!column || column.length === 0) return [];
  
  const insights: string[] = [];
  const sorted = [...column].sort((a, b) => a - b);
  const mean = column.reduce((a, b) => a + b, 0) / column.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;
  const variance = column.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / column.length;
  const stdDev = Math.sqrt(variance);
  
  insights.push(`El valor promedio de ${columnName} es ${mean.toFixed(2)}`);
  insights.push(`El rango está entre ${min.toFixed(2)} y ${max.toFixed(2)}`);
  insights.push(`La desviación estándar es ${stdDev.toFixed(2)}, indicando ${stdDev < mean * 0.2 ? 'baja' : 'alta'} variabilidad`);
  
  // Análisis de distribución
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const outliers = column.filter(x => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr);
  if (outliers.length > 0) {
    insights.push(`Se detectaron ${outliers.length} valores atípicos (${(outliers.length / column.length * 100).toFixed(1)}% del total)`);
  }
  
  // Análisis de tendencia
  const firstHalf = column.slice(0, Math.floor(column.length / 2));
  const secondHalf = column.slice(Math.floor(column.length / 2));
  const meanFirstHalf = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const meanSecondHalf = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  if (meanSecondHalf > meanFirstHalf) {
    insights.push(`Tendencia alcista: el promedio aumentó ${(meanSecondHalf - meanFirstHalf).toFixed(2)} en la segunda mitad`);
  } else if (meanSecondHalf < meanFirstHalf) {
    insights.push(`Tendencia bajista: el promedio disminuyó ${(meanFirstHalf - meanSecondHalf).toFixed(2)} en la segunda mitad`);
  }
  
  return insights;
}
