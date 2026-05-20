'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Zap, Loader2 } from 'lucide-react';
import {
  performLinearRegression,
  performPolynomialRegression,
  performKMeans,
  detectAnomalies,
  ClusterResult,
  RegressionResult,
  AnomalyDetectionResult,
} from '@/lib/ml-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface MLAnalysisProps {
  data: Record<string, number[]>;
  columns: string[];
}

export function MLAnalysis({ data, columns }: MLAnalysisProps) {
  const [selectedXColumn, setSelectedXColumn] = useState(columns[0] || '');
  const [selectedYColumn, setSelectedYColumn] = useState(columns[1] || '');
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyDetectionResult | null>(null);
  const [regressionType, setRegressionType] = useState('linear');
  const [clusterCount, setClusterCount] = useState('3');

  // Estados de carga para evitar que la UI parezca bloqueada
  const [isRegressing, setIsRegressing] = useState(false);
  const [isClustering, setIsClustering] = useState(false);
  const [isAnomalyDetecting, setIsAnomalyDetecting] = useState(false);

  // Optimización de rendimiento: Muestrear datos para el cálculo si excede las 1000 filas
  const isDownsampled = useMemo(() => {
    const firstCol = columns[0];
    return firstCol && data[firstCol] && data[firstCol].length > 1000;
  }, [data, columns]);

  const mlCalculationData = useMemo(() => {
    const firstCol = columns[0];
    if (!firstCol || !data[firstCol]) return { sampled: {}, length: 0 };
    
    const originalLength = data[firstCol].length;
    if (originalLength <= 1000) {
      return { sampled: data, length: originalLength };
    }
    
    const step = Math.ceil(originalLength / 1000);
    const sampled: Record<string, number[]> = {};
    
    for (const col of columns) {
      if (!data[col]) continue;
      const colData = data[col];
      const sampledCol: number[] = [];
      for (let i = 0; i < originalLength; i += step) {
        sampledCol.push(colData[i]);
      }
      sampled[col] = sampledCol;
    }
    
    return { sampled, length: sampled[firstCol]?.length || 0 };
  }, [data, columns]);

  const handleLinearRegression = () => {
    if (!selectedXColumn || !selectedYColumn) return;
    
    setIsRegressing(true);
    // Ejecutar en setTimeout para permitir que React pinte el spinner de carga antes de bloquear el hilo principal
    setTimeout(() => {
      const calcData = mlCalculationData.sampled;
      const x = calcData[selectedXColumn] || [];
      const y = calcData[selectedYColumn] || [];
      
      if (regressionType === 'linear') {
        const result = performLinearRegression(x, y);
        setRegressionResult(result);
      } else {
        const result = performPolynomialRegression(x, y, 2);
        setRegressionResult(result);
      }
      setIsRegressing(false);
    }, 50);
  };

  const handleKMeans = () => {
    const k = parseInt(clusterCount);
    
    // Preparar datos para clustering
    const numericColumns = columns.filter(col => {
      const values = data[col];
      return values && values.every(v => typeof v === 'number');
    });
    
    if (numericColumns.length < 2) {
      alert('Se necesitan al menos 2 columnas numéricas');
      return;
    }
    
    setIsClustering(true);
    setTimeout(() => {
      const calcData = mlCalculationData.sampled;
      const dataPoints = Array.from({ length: calcData[numericColumns[0]].length }, (_, i) => 
        numericColumns.map(col => calcData[col][i])
      );
      
      const result = performKMeans(dataPoints, k);
      setClusterResult(result);
      setIsClustering(false);
    }, 50);
  };

  const handleAnomalyDetection = () => {
    if (!selectedYColumn) return;
    
    setIsAnomalyDetecting(true);
    setTimeout(() => {
      const result = detectAnomalies(data[selectedYColumn], 3);
      setAnomalyResult(result);
      setIsAnomalyDetecting(false);
    }, 50);
  };

  // Muestreo sistemático de 300 puntos para gráficos Recharts snappy
  const chartData = useMemo(() => {
    if (!selectedXColumn || !selectedYColumn || !regressionResult) return [];
    
    const calcData = mlCalculationData.sampled;
    const xArr = calcData[selectedXColumn] || [];
    const yArr = calcData[selectedYColumn] || [];
    const predArr = regressionResult.predictions || [];
    const len = xArr.length;
    
    const step = len > 300 ? Math.ceil(len / 300) : 1;
    const result = [];
    
    for (let i = 0; i < len; i += step) {
      result.push({
        x: xArr[i],
        actual: yArr[i],
        predicted: predArr[i],
      });
    }
    return result;
  }, [selectedXColumn, selectedYColumn, regressionResult, mlCalculationData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {isDownsampled && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-medium">
          <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
          <span>Optimizador de IA Activo: Muestreando 1,000 registros representativos para ejecutar el entrenamiento instantáneamente a alta velocidad.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Regresión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Variable X</label>
              <Select value={selectedXColumn} onValueChange={setSelectedXColumn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Variable Y</label>
              <Select value={selectedYColumn} onValueChange={setSelectedYColumn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={regressionType} onValueChange={setRegressionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Lineal</SelectItem>
                  <SelectItem value="polynomial">Polinomial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleLinearRegression} 
              disabled={isRegressing}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRegressing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando Regresión...
                </>
              ) : (
                'Ejecutar Regresión'
              )}
            </Button>
            {regressionResult && (
              <div className="mt-4 p-3 bg-blue-500/10 rounded">
                <p className="text-sm"><strong>R²:</strong> {regressionResult.r2.toFixed(3)}</p>
                <p className="text-sm"><strong>RMSE:</strong> {regressionResult.rmse.toFixed(3)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Clustering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Número de Clusters</label>
              <Select value={clusterCount} onValueChange={setClusterCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleKMeans} 
              disabled={isClustering}
              className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isClustering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ejecutando K-Means...
                </>
              ) : (
                'Ejecutar K-Means'
              )}
            </Button>
            {clusterResult && (
              <div className="mt-4 p-3 bg-purple-500/10 rounded">
                <p className="text-sm"><strong>Inercia:</strong> {clusterResult.inertia.toFixed(2)}</p>
                <p className="text-sm"><strong>Clusters encontrados:</strong> {clusterResult.centroids.length}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Anomalías
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Variable a analizar</label>
              <Select value={selectedYColumn} onValueChange={setSelectedYColumn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAnomalyDetection} 
              disabled={isAnomalyDetecting}
              className="w-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnomalyDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando Anomalías...
                </>
              ) : (
                'Detectar Anomalías'
              )}
            </Button>
            {anomalyResult && (
              <div className="mt-4 p-3 bg-orange-500/10 rounded">
                <p className="text-sm">
                  <strong>Anomalías encontradas:</strong> {anomalyResult.isAnomaly.filter(a => a).length}
                </p>
                <p className="text-sm">
                  <strong>Porcentaje:</strong> {(anomalyResult.isAnomaly.filter(a => a).length / anomalyResult.isAnomaly.length * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {regressionResult && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Regresión</CardTitle>
            <CardDescription>Comparación entre valores reales y predichos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="x" name={selectedXColumn} />
                <YAxis name={selectedYColumn} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Real" data={chartData} dataKey="actual" fill="#3b82f6" />
                <Scatter name="Predicho" data={chartData} dataKey="predicted" fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
