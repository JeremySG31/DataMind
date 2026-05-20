'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import {
  createScatter3DData,
  formatScatter3DForPlotly,
  createCorrelationMatrix,
  formatHeatmap3DForPlotly,
  createSurfaceData,
  formatSurfaceForPlotly,
  get3DLayout,
} from '@/lib/visualization-3d';

declare global {
  interface Window {
    Plotly?: any;
  }
}

interface Visualization3DProps {
  data: Record<string, number[]>;
  columns: string[];
}

export function Visualization3D({ data, columns }: Visualization3DProps) {
  const [selectedX, setSelectedX] = useState(columns[0] || '');
  const [selectedY, setSelectedY] = useState(columns[1] || '');
  const [selectedZ, setSelectedZ] = useState(columns[2] || '');
  const [visualizationType, setVisualizationType] = useState('scatter');
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);

  // Cargar Plotly desde CDN
  useEffect(() => {
    if (!window.Plotly) {
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
      script.async = true;
      script.onload = () => setPlotlyLoaded(true);
      document.body.appendChild(script);
    } else {
      setPlotlyLoaded(true);
    }
  }, []);

  const renderScatter3D = () => {
    if (!selectedX || !selectedY || !selectedZ) {
      return <p className="text-foreground/60">Selecciona 3 variables para visualizar</p>;
    }

    setTimeout(() => {
      const points = createScatter3DData(
        data[selectedX],
        data[selectedY],
        data[selectedZ]
      );

      const plotData = [formatScatter3DForPlotly(points)];
      const layout = get3DLayout({
        title: `Scatter Plot 3D: ${selectedX} vs ${selectedY} vs ${selectedZ}`,
        xAxisLabel: selectedX,
        yAxisLabel: selectedY,
        zAxisLabel: selectedZ,
      });

      window.Plotly?.newPlot('scatter-3d-plot', plotData, layout, { responsive: true });
    }, 100);

    return <div id="scatter-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  const renderCorrelationHeatmap = () => {
    setTimeout(() => {
      const correlationData = createCorrelationMatrix(data);
      const plotData = [formatHeatmap3DForPlotly(correlationData)];
      const layout = {
        title: 'Matriz de Correlación 3D',
        xaxis: { title: 'Variables' },
        yaxis: { title: 'Variables' },
        height: 600,
      };

      window.Plotly?.newPlot('heatmap-3d-plot', plotData, layout, { responsive: true });
    }, 100);

    return <div id="heatmap-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  const renderSurfacePlot = () => {
    setTimeout(() => {
      const surfaceData = createSurfaceData(
        [0, 10],
        [0, 10],
        15,
        (x, y) => Math.sin(x * 0.5) * Math.cos(y * 0.5)
      );

      const plotData = [formatSurfaceForPlotly(surfaceData)];
      const layout = get3DLayout({
        title: 'Surface Plot 3D',
        xAxisLabel: 'X',
        yAxisLabel: 'Y',
        zAxisLabel: 'Z',
      });

      window.Plotly?.newPlot('surface-3d-plot', plotData, layout, { responsive: true });
    }, 100);

    return <div id="surface-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  if (!plotlyLoaded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-foreground/60">Cargando visualizaciones 3D...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5 text-cyan-500" />
            Visualizaciones 3D Interactivas
          </CardTitle>
          <CardDescription>Explora tus datos en 3 dimensiones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Visualización</label>
            <Select value={visualizationType} onValueChange={setVisualizationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scatter">Scatter Plot 3D</SelectItem>
                <SelectItem value="heatmap">Heatmap 3D de Correlaciones</SelectItem>
                <SelectItem value="surface">Surface Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visualizationType === 'scatter' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Eje X</label>
                  <Select value={selectedX} onValueChange={setSelectedX}>
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
                  <label className="text-sm font-medium">Eje Y</label>
                  <Select value={selectedY} onValueChange={setSelectedY}>
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
                  <label className="text-sm font-medium">Eje Z</label>
                  <Select value={selectedZ} onValueChange={setSelectedZ}>
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
              </div>
              {renderScatter3D()}
            </div>
          )}

          {visualizationType === 'heatmap' && (
            <div>
              <p className="text-sm text-foreground/60 mb-4">Matriz de correlación entre todas las variables</p>
              {renderCorrelationHeatmap()}
            </div>
          )}

          {visualizationType === 'surface' && (
            <div>
              <p className="text-sm text-foreground/60 mb-4">Superficie matemática 3D interactiva</p>
              {renderSurfacePlot()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
