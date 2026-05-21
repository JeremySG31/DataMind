'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import {
  createScatter3DData,
  formatScatter3DForPlotly,
  createCorrelationMatrix,
  formatHeatmap3DForPlotly,
  createSurfaceData,
  createBinnedSurfaceData,
  formatSurfaceForPlotly,
  formatLine3DForPlotly,
  formatMesh3DForPlotly,
  get3DLayout,
} from '@/lib/visualization-3d';

declare global {
  interface Window {
    Plotly?: any;
  }
}

interface Visualization3DProps {
  data: Record<string, (number | string)[]>;
  columns: string[];
}

export function Visualization3D({ data, columns }: Visualization3DProps) {
  // Classify columns as numeric vs categorical
  const numericColumns = useMemo(() => {
    return columns.filter(col =>
      data[col] && data[col].some(val => typeof val === 'number' && val !== 0)
    );
  }, [columns, data]);

  const [selectedX, setSelectedX] = useState(numericColumns[0] || columns[0] || '');
  const [selectedY, setSelectedY] = useState(numericColumns[1] || columns[1] || '');
  const [selectedZ, setSelectedZ] = useState(numericColumns[2] || columns[2] || '');
  const [selectedColorCol, setSelectedColorCol] = useState<string>('none');
  const [selectedSizeCol, setSelectedSizeCol] = useState<string>('none');
  
  const [visualizationType, setVisualizationType] = useState('scatter');
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);

  // Load Plotly from CDN
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

  // Compute color and size arrays dynamically based on user selection
  const colorAndSizeConfig = useMemo(() => {
    let colorsArray: string[] | number[] | undefined = undefined;
    let colorscale: string | undefined = undefined;
    let showscale = false;

    if (selectedColorCol && selectedColorCol !== 'none') {
      const colorVals = data[selectedColorCol];
      const isNumericColor = numericColumns.includes(selectedColorCol);
      if (isNumericColor) {
        colorsArray = colorVals.map(v => Number(v));
        colorscale = 'Viridis';
        showscale = true;
      } else {
        // Categorical coloring
        const uniqueCategories = [...new Set(colorVals.map(String))];
        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];
        const categoryColorMap: Record<string, string> = {};
        uniqueCategories.forEach((cat, idx) => {
          categoryColorMap[cat] = COLORS[idx % COLORS.length];
        });
        colorsArray = colorVals.map(v => categoryColorMap[String(v)]);
      }
    }

    let sizeArray: number[] | undefined = undefined;
    if (selectedSizeCol && selectedSizeCol !== 'none') {
      const sizeVals = data[selectedSizeCol].map(v => Number(v));
      const validSizes = sizeVals.filter(v => !isNaN(v));
      const minSizeVal = validSizes.length > 0 ? Math.min(...validSizes) : 0;
      const maxSizeVal = validSizes.length > 0 ? Math.max(...validSizes) : 1;
      const sizeRange = maxSizeVal - minSizeVal;
      
      sizeArray = sizeVals.map(v => {
        if (isNaN(v)) return 4;
        if (sizeRange === 0) return 8;
        // Scale sizes between 4 and 16
        return 4 + ((v - minSizeVal) / sizeRange) * 12;
      });
    }

    return { colorsArray, colorscale, showscale, sizeArray };
  }, [data, selectedColorCol, selectedSizeCol, numericColumns]);

  const renderScatter3D = () => {
    if (!selectedX || !selectedY || !selectedZ) {
      return <p className="text-foreground/60">Selecciona 3 variables para visualizar</p>;
    }

    setTimeout(() => {
      const points = createScatter3DData(
        data[selectedX] as number[],
        data[selectedY] as number[],
        data[selectedZ] as number[]
      );

      const scatterTrace = formatScatter3DForPlotly(points);
      
      // Override color/size mappings
      const { colorsArray, colorscale, showscale, sizeArray } = colorAndSizeConfig;
      if (colorsArray) {
        scatterTrace.marker.color = colorsArray as any;
        if (colorscale) {
          (scatterTrace.marker as any).colorscale = colorscale;
          (scatterTrace.marker as any).showscale = showscale;
        }
      }
      if (sizeArray) {
        scatterTrace.marker.size = sizeArray as any;
      }

      const layout = get3DLayout({
        title: `Scatter Plot 3D: ${selectedX} vs ${selectedY} vs ${selectedZ}`,
        xAxisLabel: selectedX,
        yAxisLabel: selectedY,
        zAxisLabel: selectedZ,
      });

      window.Plotly?.newPlot('scatter-3d-plot', [scatterTrace], layout, { responsive: true });
    }, 100);

    return <div id="scatter-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  const renderLine3D = () => {
    if (!selectedX || !selectedY || !selectedZ) {
      return <p className="text-foreground/60">Selecciona 3 variables para visualizar</p>;
    }

    setTimeout(() => {
      const points = createScatter3DData(
        data[selectedX] as number[],
        data[selectedY] as number[],
        data[selectedZ] as number[]
      );

      const lineTrace = formatLine3DForPlotly(points, '#06b6d4');
      
      const { colorsArray, sizeArray } = colorAndSizeConfig;
      if (colorsArray) {
        lineTrace.marker.color = colorsArray as any;
      }
      if (sizeArray) {
        lineTrace.marker.size = sizeArray as any;
      }

      const layout = get3DLayout({
        title: `Línea/Trayectoria 3D: ${selectedX} vs ${selectedY} vs ${selectedZ}`,
        xAxisLabel: selectedX,
        yAxisLabel: selectedY,
        zAxisLabel: selectedZ,
      });

      window.Plotly?.newPlot('line-3d-plot', [lineTrace], layout, { responsive: true });
    }, 100);

    return <div id="line-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  const renderMesh3D = () => {
    if (!selectedX || !selectedY || !selectedZ) {
      return <p className="text-foreground/60">Selecciona 3 variables para visualizar</p>;
    }

    setTimeout(() => {
      const points = createScatter3DData(
        data[selectedX] as number[],
        data[selectedY] as number[],
        data[selectedZ] as number[]
      );

      const meshTrace = formatMesh3DForPlotly(points, '#a855f7');
      const layout = get3DLayout({
        title: `Estructura de Malla 3D: ${selectedX} vs ${selectedY} vs ${selectedZ}`,
        xAxisLabel: selectedX,
        yAxisLabel: selectedY,
        zAxisLabel: selectedZ,
      });

      window.Plotly?.newPlot('mesh-3d-plot', [meshTrace], layout, { responsive: true });
    }, 100);

    return <div id="mesh-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  const renderCorrelationHeatmap = () => {
    setTimeout(() => {
      const numericData: Record<string, number[]> = {};
      numericColumns.forEach(col => {
        numericData[col] = data[col] as number[];
      });

      const correlationData = createCorrelationMatrix(numericData);
      const plotData = [formatHeatmap3DForPlotly(correlationData)];
      
      const layout = {
        title: 'Matriz de Correlación 3D',
        xaxis: { title: 'Variables', tickcolor: '#a3a3a3', gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { title: 'Variables', tickcolor: '#a3a3a3', gridcolor: 'rgba(255,255,255,0.05)' },
        height: 600,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
          color: '#a3a3a3',
          family: 'Inter, sans-serif',
        },
      };

      window.Plotly?.newPlot('heatmap-3d-plot', plotData, layout, { responsive: true });
    }, 100);

    return <div id="heatmap-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  const renderSurfacePlot = () => {
    if (!selectedX || !selectedY || !selectedZ) {
      return <p className="text-foreground/60">Selecciona 3 variables para generar la superficie</p>;
    }

    setTimeout(() => {
      const surfaceData = createBinnedSurfaceData(
        data[selectedX] as number[],
        data[selectedY] as number[],
        data[selectedZ] as number[],
        20
      );

      const plotData = [{
        x: surfaceData.x,
        y: surfaceData.y,
        z: surfaceData.z,
        type: 'surface',
        colorscale: 'Viridis',
      }];

      const layout = get3DLayout({
        title: `Superficie 3D Binned: ${selectedZ} en función de ${selectedX} y ${selectedY}`,
        xAxisLabel: selectedX,
        yAxisLabel: selectedY,
        zAxisLabel: selectedZ,
      });

      window.Plotly?.newPlot('surface-3d-plot', plotData, layout, { responsive: true });
    }, 100);

    return <div id="surface-3d-plot" style={{ width: '100%', height: '600px' }} />;
  };

  if (!plotlyLoaded) {
    return (
      <Card className="bg-background/50 border-muted-foreground/20">
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
      <Card className="bg-background/50 border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Box className="h-5 w-5 text-cyan-500" />
            Visualizaciones 3D Interactivas
          </CardTitle>
          <CardDescription>Explora tus datos en 3 dimensiones con trazados reales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Visualización</label>
              <Select value={visualizationType} onValueChange={setVisualizationType}>
                <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scatter">Scatter Plot 3D</SelectItem>
                  <SelectItem value="line3d">Línea / Trayectoria 3D</SelectItem>
                  <SelectItem value="surface">Superficie 3D Real (Binned)</SelectItem>
                  <SelectItem value="mesh3d">Malla 3D (Mesh)</SelectItem>
                  <SelectItem value="heatmap">Heatmap de Correlaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {visualizationType !== 'heatmap' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Eje X (Numérico)</label>
                  <Select value={selectedX} onValueChange={setSelectedX}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Eje Y (Numérico)</label>
                  <Select value={selectedY} onValueChange={setSelectedY}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Eje Z (Numérico)</label>
                  <Select value={selectedZ} onValueChange={setSelectedZ}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(visualizationType === 'scatter' || visualizationType === 'line3d') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-muted-foreground/10">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Color / Grupo (Opcional)</label>
                    <Select value={selectedColorCol} onValueChange={setSelectedColorCol}>
                      <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-8 text-xs">
                        <SelectValue placeholder="Sin mapeo de color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin mapeo de color (Estático)</SelectItem>
                        {columns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Tamaño del Punto (Opcional)</label>
                    <Select value={selectedSizeCol} onValueChange={setSelectedSizeCol}>
                      <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-8 text-xs">
                        <SelectValue placeholder="Tamaño fijo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tamaño estático</SelectItem>
                        {numericColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-muted-foreground/10 min-h-[600px] flex items-center justify-center">
            {visualizationType === 'scatter' && renderScatter3D()}
            {visualizationType === 'line3d' && renderLine3D()}
            {visualizationType === 'mesh3d' && renderMesh3D()}
            {visualizationType === 'surface' && renderSurfacePlot()}
            {visualizationType === 'heatmap' && renderCorrelationHeatmap()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
