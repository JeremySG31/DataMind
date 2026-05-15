'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Zap } from 'lucide-react';
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

  const handleLinearRegression = () => {
    if (!selectedXColumn || !selectedYColumn) return;
    
    const x = data[selectedXColumn];
    const y = data[selectedYColumn];
    
    if (regressionType === 'linear') {
      const result = performLinearRegression(x, y);
      setRegressionResult(result);
    } else {
      const result = performPolynomialRegression(x, y, 2);
      setRegressionResult(result);
    }
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
    
    const dataPoints = Array.from({ length: data[numericColumns[0]].length }, (_, i) => 
      numericColumns.map(col => data[col][i])
    );
    
    const result = performKMeans(dataPoints, k);
    setClusterResult(result);
  };

  const handleAnomalyDetection = () => {
    if (!selectedYColumn) return;
    
    const result = detectAnomalies(data[selectedYColumn], 3);
    setAnomalyResult(result);
  };

  const chartData = selectedXColumn && selectedYColumn && regressionResult
    ? data[selectedXColumn].map((x, i) => ({
        x,
        actual: data[selectedYColumn][i],
        predicted: regressionResult.predictions[i],
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
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
            <Button onClick={handleLinearRegression} className="w-full bg-blue-600 hover:bg-blue-700">
              Ejecutar Regresión
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
            <Button onClick={handleKMeans} className="w-full bg-purple-600 hover:bg-purple-700">
              Ejecutar K-Means
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
            <Button onClick={handleAnomalyDetection} className="w-full bg-orange-600 hover:bg-orange-700">
              Detectar Anomalías
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
