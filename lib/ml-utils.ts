import * as ml from 'ml';
import * as tf from '@tensorflow/tfjs';

// Tipos de modelos ML
export interface RegressionResult {
  predictions: number[];
  coefficients: number[];
  r2: number;
  rmse: number;
}

export interface ClusterResult {
  centroids: number[][];
  clusters: number[];
  inertia: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean[];
  scores: number[];
  threshold: number;
}

export interface NeuralNetworkConfig {
  inputShape: number;
  hiddenLayers: number[];
  outputShape: number;
  learningRate: number;
  epochs: number;
  batchSize: number;
}

// Regresión Lineal
export function performLinearRegression(
  x: number[],
  y: number[]
): RegressionResult {
  try {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions = x.map(xi => slope * xi + intercept);
    
    // Calcular R²
    const meanY = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
    const r2 = 1 - ssRes / ssTotal;
    
    // Calcular RMSE
    const rmse = Math.sqrt(ssRes / n);
    
    return {
      predictions,
      coefficients: [intercept, slope],
      r2,
      rmse,
    };
  } catch (error) {
    console.error('Error en regresión lineal:', error);
    return {
      predictions: [],
      coefficients: [0, 0],
      r2: 0,
      rmse: 0,
    };
  }
}

// Regresión Polinomial
export function performPolynomialRegression(
  x: number[],
  y: number[],
  degree: number = 2
): RegressionResult {
  try {
    // Crear matriz de características polinomiales
    const features: number[][] = x.map(xi => {
      const row: number[] = [];
      for (let d = 0; d <= degree; d++) {
        row.push(Math.pow(xi, d));
      }
      return row;
    });
    
    // Usar ml-matrix para resolver los coeficientes vía ecuación normal: β = (X^T X)^{-1} X^T y
    const X = new ml.Matrix(features);
    const yRow = new ml.Matrix([y]);
    const Xt = X.transpose();
    const A = Xt.mmul(X);  // (d+1) × (d+1)
    const B = Xt.mmul(yRow.transpose());  // (d+1) × 1
    const coefficients = ml.MatrixLib.solve(A, B).to1DArray();
    
    const predictions = x.map(xi => {
      let pred = 0;
      for (let d = 0; d <= degree; d++) {
        pred += coefficients[d] * Math.pow(xi, d);
      }
      return pred;
    });
    
    // Calcular R²
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
    const r2 = 1 - ssRes / ssTotal;
    
    const rmse = Math.sqrt(ssRes / y.length);
    
    return {
      predictions,
      coefficients,
      r2,
      rmse,
    };
  } catch (error) {
    console.error('Error en regresión polinomial:', error);
    return {
      predictions: [],
      coefficients: [],
      r2: 0,
      rmse: 0,
    };
  }
}

// K-Means Clustering
export function performKMeans(
  data: number[][],
  k: number = 3,
  maxIterations: number = 100
): ClusterResult {
  try {
    const n = data.length;
    const d = data[0].length;
    
    // Inicializar centroides aleatoriamente
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * n);
      centroids.push([...data[randomIndex]]);
    }
    
    let clusters = new Array(n).fill(0);
    let inertia = 0;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Asignar puntos a centroides más cercanos
      let newClusters = new Array(n).fill(0);
      let distances = new Array(n).fill(Infinity);
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < k; j++) {
          let dist = 0;
          for (let l = 0; l < d; l++) {
            dist += Math.pow(data[i][l] - centroids[j][l], 2);
          }
          dist = Math.sqrt(dist);
          
          if (dist < distances[i]) {
            distances[i] = dist;
            newClusters[i] = j;
          }
        }
      }
      
      // Actualizar centroides
      const newCentroids: number[][] = Array(k).fill(null).map(() => Array(d).fill(0));
      const counts = new Array(k).fill(0);
      
      for (let i = 0; i < n; i++) {
        const cluster = newClusters[i];
        counts[cluster]++;
        for (let l = 0; l < d; l++) {
          newCentroids[cluster][l] += data[i][l];
        }
      }
      
      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          for (let l = 0; l < d; l++) {
            newCentroids[j][l] /= counts[j];
          }
        }
      }
      
      clusters = newClusters;
      centroids = newCentroids;
      
      // Calcular inercia
      inertia = distances.reduce((a, b) => a + b, 0);
    }
    
    return {
      centroids,
      clusters,
      inertia,
    };
  } catch (error) {
    console.error('Error en K-Means:', error);
    return {
      centroids: [],
      clusters: [],
      inertia: 0,
    };
  }
}

// Detección de Anomalías (Z-Score)
export function detectAnomalies(
  data: number[],
  threshold: number = 3
): AnomalyDetectionResult {
  try {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    const scores = data.map(x => Math.abs((x - mean) / (stdDev || 1)));
    const isAnomaly = scores.map(score => score > threshold);
    
    return {
      isAnomaly,
      scores,
      threshold,
    };
  } catch (error) {
    console.error('Error en detección de anomalías:', error);
    return {
      isAnomaly: [],
      scores: [],
      threshold,
    };
  }
}

// Crear Red Neuronal con TensorFlow
export async function createNeuralNetwork(config: NeuralNetworkConfig) {
  try {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [config.inputShape],
          units: config.hiddenLayers[0] || 64,
          activation: 'relu',
        }),
        ...config.hiddenLayers.slice(1).map(units =>
          tf.layers.dense({
            units,
            activation: 'relu',
          })
        ),
        tf.layers.dense({
          units: config.outputShape,
          activation: config.outputShape === 1 ? 'sigmoid' : 'softmax',
        }),
      ],
    });
    
    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: config.outputShape === 1 ? 'binaryCrossentropy' : 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
    
    return model;
  } catch (error) {
    console.error('Error creando red neuronal:', error);
    return null;
  }
}

// Entrenar modelo
export async function trainModel(
  model: tf.Sequential | null,
  xData: tf.Tensor,
  yData: tf.Tensor,
  epochs: number,
  batchSize: number,
  onEpochEnd?: (epoch: number, loss: number, accuracy: number) => void
) {
  if (!model) return { loss: 0, accuracy: 0 };
  
  try {
    const history = await model.fit(xData, yData, {
      epochs,
      batchSize,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          onEpochEnd?.(epoch, logs?.loss || 0, logs?.acc || 0);
        },
      },
    });
    
    return {
      loss: history.history.loss?.[history.history.loss.length - 1] || 0,
      accuracy: history.history.acc?.[history.history.acc.length - 1] || 0,
    };
  } catch (error) {
    console.error('Error entrenando modelo:', error);
    return { loss: 0, accuracy: 0 };
  }
}

// Realizar predicciones
export async function predict(
  model: tf.Sequential | null,
  xData: tf.Tensor
) {
  if (!model) return null;
  
  try {
    const predictions = model.predict(xData) as tf.Tensor;
    const data = await predictions.data();
    predictions.dispose();
    return Array.from(data);
  } catch (error) {
    console.error('Error en predicciones:', error);
    return null;
  }
}
