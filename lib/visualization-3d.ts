export interface Plot3DConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  zAxisLabel: string;
}

export interface Scatter3DPoint {
  x: number;
  y: number;
  z: number;
  label?: string;
  color?: string;
}

export interface HeatmapData {
  z: number[][];
  x: string[];
  y: string[];
}

export interface SurfaceData {
  z: number[][];
  x: number[];
  y: number[];
}

// Crear datos para scatter plot 3D
export function createScatter3DData(
  xData: number[],
  yData: number[],
  zData: number[],
  labels?: string[],
  colors?: string[]
): Scatter3DPoint[] {
  const minLength = Math.min(xData.length, yData.length, zData.length);
  
  return Array.from({ length: minLength }, (_, i) => ({
    x: xData[i],
    y: yData[i],
    z: zData[i],
    label: labels?.[i],
    color: colors?.[i],
  }));
}

// Crear datos para scatter 3D en formato Plotly
export function formatScatter3DForPlotly(points: Scatter3DPoint[]) {
  return {
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    z: points.map(p => p.z),
    mode: 'markers',
    marker: {
      size: 6,
      color: points.map(p => p.color || '#3b82f6'),
      opacity: 0.8,
    },
    text: points.map(p => p.label || ''),
    type: 'scatter3d',
  };
}

// Crear matriz de correlación para heatmap 3D
export function createCorrelationMatrix(
  data: Record<string, number[]>
): HeatmapData {
  const columns = Object.keys(data);
  const n = columns.length;
  
  const correlationMatrix: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1;
      } else {
        correlationMatrix[i][j] = calculateCorrelation(data[columns[i]], data[columns[j]]);
      }
    }
  }
  
  return {
    z: correlationMatrix,
    x: columns,
    y: columns,
  };
}

// Calcular correlación de Pearson
function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }
  
  const denominator = Math.sqrt(sumX2 * sumY2);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Crear datos para surface plot
export function createSurfaceData(
  xRange: [number, number],
  yRange: [number, number],
  resolution: number = 20,
  func?: (x: number, y: number) => number
): SurfaceData {
  const xStep = (xRange[1] - xRange[0]) / resolution;
  const yStep = (yRange[1] - yRange[0]) / resolution;
  
  const x: number[] = [];
  const y: number[] = [];
  const z: number[][] = [];
  
  for (let i = 0; i <= resolution; i++) {
    const yVal = yRange[0] + i * yStep;
    y.push(yVal);
    z[i] = [];
    
    for (let j = 0; j <= resolution; j++) {
      const xVal = xRange[0] + j * xStep;
      if (i === 0) x.push(xVal);
      
      if (func) {
        z[i][j] = func(xVal, yVal);
      } else {
        // Función de ejemplo: z = x² + y²
        z[i][j] = Math.pow(xVal, 2) + Math.pow(yVal, 2);
      }
    }
  }
  
  return { x, y, z };
}

// Crear datos para surface plot desde dataset
export function createSurfaceFromData(
  xData: number[],
  yData: number[],
  zData: number[]
): SurfaceData {
  // Crear grid a partir de los datos
  const uniqueX = [...new Set(xData)].sort((a, b) => a - b);
  const uniqueY = [...new Set(yData)].sort((a, b) => a - b);
  
  const z: number[][] = Array(uniqueY.length)
    .fill(null)
    .map(() => Array(uniqueX.length).fill(0));
  
  for (let i = 0; i < xData.length; i++) {
    const xIdx = uniqueX.indexOf(xData[i]);
    const yIdx = uniqueY.indexOf(yData[i]);
    if (xIdx >= 0 && yIdx >= 0) {
      z[yIdx][xIdx] = zData[i];
    }
  }
  
  return {
    x: uniqueX,
    y: uniqueY,
    z,
  };
}

// Formatear heatmap 3D para Plotly
export function formatHeatmap3DForPlotly(data: HeatmapData) {
  return {
    z: data.z,
    x: data.x,
    y: data.y,
    type: 'heatmap',
    colorscale: 'Viridis',
  };
}

// Formatear surface plot para Plotly
export function formatSurfaceForPlotly(data: SurfaceData) {
  return {
    x: data.x,
    y: data.y,
    z: data.z,
    type: 'surface',
    colorscale: 'Viridis',
  };
}

// Crear superficie binned a partir de datos reales de X, Y, Z
export function createBinnedSurfaceData(
  xData: number[],
  yData: number[],
  zData: number[],
  gridSize: number = 20
): SurfaceData {
  const cleanX = xData.filter((v) => typeof v === 'number' && !isNaN(v));
  const cleanY = yData.filter((v) => typeof v === 'number' && !isNaN(v));
  const cleanZ = zData.filter((v) => typeof v === 'number' && !isNaN(v));
  
  if (cleanX.length === 0 || cleanY.length === 0 || cleanZ.length === 0) {
    return { x: [], y: [], z: [] };
  }

  const minX = Math.min(...cleanX);
  const maxX = Math.max(...cleanX);
  const minY = Math.min(...cleanY);
  const maxY = Math.max(...cleanY);

  // Si no hay rango, devolver cuadrícula básica
  if (minX === maxX || minY === maxY) {
    return { x: [minX], y: [minY], z: [[cleanZ[0] || 0]] };
  }

  const xCoords: number[] = [];
  const yCoords: number[] = [];
  const xStep = (maxX - minX) / (gridSize - 1);
  const yStep = (maxY - minY) / (gridSize - 1);

  for (let j = 0; j < gridSize; j++) {
    xCoords.push(minX + j * xStep);
  }
  for (let i = 0; i < gridSize; i++) {
    yCoords.push(minY + i * yStep);
  }

  // Inicializar acumuladores y contadores
  const zSum: number[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));
  const zCount: number[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));

  const len = Math.min(cleanX.length, cleanY.length, cleanZ.length);
  for (let idx = 0; idx < len; idx++) {
    const xVal = cleanX[idx];
    const yVal = cleanY[idx];
    const zVal = cleanZ[idx];

    let xBin = Math.floor((xVal - minX) / xStep);
    let yBin = Math.floor((yVal - minY) / yStep);

    xBin = Math.max(0, Math.min(gridSize - 1, xBin));
    yBin = Math.max(0, Math.min(gridSize - 1, yBin));

    zSum[yBin][xBin] += zVal;
    zCount[yBin][xBin] += 1;
  }

  const z: number[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (zCount[i][j] > 0) {
        z[i][j] = zSum[i][j] / zCount[i][j];
      } else {
        z[i][j] = null as any;
      }
    }
  }

  // Interpolación de vecinos para rellenar vacíos
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (z[i][j] === null) {
        let sum = 0;
        let count = 0;
        const neighbors = [
          [i - 1, j],
          [i + 1, j],
          [i, j - 1],
          [i, j + 1],
          [i - 1, j - 1],
          [i - 1, j + 1],
          [i + 1, j - 1],
          [i + 1, j + 1],
        ];

        neighbors.forEach(([ni, nj]) => {
          if (
            ni >= 0 &&
            ni < gridSize &&
            nj >= 0 &&
            nj < gridSize &&
            z[ni][nj] !== null
          ) {
            sum += z[ni][nj];
            count++;
          }
        });

        if (count > 0) {
          z[i][j] = sum / count;
        } else {
          z[i][j] = 0;
        }
      }
    }
  }

  return {
    x: xCoords,
    y: yCoords,
    z,
  };
}

// Formatear gráfico de líneas 3D para Plotly
export function formatLine3DForPlotly(points: Scatter3DPoint[], color: string = '#3b82f6') {
  return {
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    z: points.map(p => p.z),
    mode: 'lines+markers',
    line: {
      width: 4,
      color: color,
    },
    marker: {
      size: 4,
      color: color,
    },
    text: points.map(p => p.label || ''),
    type: 'scatter3d',
  };
}

// Formatear gráfico de malla 3D para Plotly
export function formatMesh3DForPlotly(points: Scatter3DPoint[], color: string = '#3b82f6') {
  return {
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    z: points.map(p => p.z),
    type: 'mesh3d',
    opacity: 0.5,
    color: color,
  };
}

// Layout estándar para gráficos 3D
export function get3DLayout(config: Plot3DConfig) {
  return {
    title: config.title,
    scene: {
      xaxis: { title: config.xAxisLabel },
      yaxis: { title: config.yAxisLabel },
      zaxis: { title: config.zAxisLabel },
    },
    height: 600,
    margin: { l: 0, r: 0, b: 0, t: 40 },
    hovermode: 'closest',
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      color: '#a3a3a3',
      family: 'Inter, sans-serif',
    },
  };
}
