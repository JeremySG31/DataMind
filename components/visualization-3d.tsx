'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Box, Loader2 } from 'lucide-react';
import {
  createScatter3DData,
  formatScatter3DForPlotly,
  createCorrelationMatrix,
  formatHeatmap3DForPlotly,
  createBinnedSurfaceData,
  formatLine3DForPlotly,
  formatMesh3DForPlotly,
  get3DLayout,
} from '@/lib/visualization-3d';

declare global {
  interface Window {
    Plotly?: any;
  }
}

// Max number of data points to send to Plotly — keeps renders fast
const MAX_3D_POINTS = 500;

interface Visualization3DProps {
  data: Record<string, (number | string)[]>;
  columns: string[];
}

export function Visualization3D({ data, columns }: Visualization3DProps) {
  // Classify columns as numeric vs categorical
  const numericColumns = useMemo(() => {
    return columns.filter(col =>
      data[col] && data[col].some(val => typeof val === 'number' && !isNaN(Number(val)))
    );
  }, [columns, data]);

  const [selectedX, setSelectedX] = useState(numericColumns[0] || columns[0] || '');
  const [selectedY, setSelectedY] = useState(numericColumns[1] || columns[1] || '');
  const [selectedZ, setSelectedZ] = useState(numericColumns[2] || columns[2] || '');
  const [selectedColorCol, setSelectedColorCol] = useState<string>('none');
  const [selectedSizeCol, setSelectedSizeCol] = useState<string>('none');
  const [visualizationType, setVisualizationType] = useState('scatter');
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Stable plot container refs
  const plotRef = useRef<HTMLDivElement>(null);
  const plotIdRef = useRef<string>('viz3d-main');

  // Update column selections when data changes
  useEffect(() => {
    setSelectedX(numericColumns[0] || columns[0] || '');
    setSelectedY(numericColumns[1] || columns[1] || '');
    setSelectedZ(numericColumns[2] || columns[2] || '');
    setSelectedColorCol('none');
    setSelectedSizeCol('none');
  }, [columns]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Plotly from CDN — only once
  useEffect(() => {
    if (window.Plotly) {
      setPlotlyLoaded(true);
      return;
    }
    const script = document.createElement('script');
    // Use the basic bundle (no geo/mapbox) which is ~2.5× smaller
    script.src = 'https://cdn.plot.ly/plotly-basic-2.27.0.min.js';
    script.async = true;
    script.onload = () => setPlotlyLoaded(true);
    script.onerror = () => console.error('Failed to load Plotly');
    document.head.appendChild(script);
  }, []);

  // ─── Downsampled data arrays ──────────────────────────────────────────────
  const downsampledData = useMemo(() => {
    const firstColLen = columns.length > 0 ? (data[columns[0]]?.length ?? 0) : 0;
    if (firstColLen <= MAX_3D_POINTS) return data; // no downsampling needed

    const step = Math.ceil(firstColLen / MAX_3D_POINTS);
    const result: Record<string, (number | string)[]> = {};
    for (const col of columns) {
      result[col] = data[col].filter((_, i) => i % step === 0);
    }
    return result;
  }, [data, columns]);

  const sampledLen = useMemo(() => {
    return columns.length > 0 ? (downsampledData[columns[0]]?.length ?? 0) : 0;
  }, [downsampledData, columns]);

  const fullLen = useMemo(() => {
    return columns.length > 0 ? (data[columns[0]]?.length ?? 0) : 0;
  }, [data, columns]);

  // ─── Color / size arrays from user selection ─────────────────────────────
  const colorAndSizeConfig = useMemo(() => {
    let colorsArray: string[] | number[] | undefined = undefined;
    let colorscale: string | undefined = undefined;
    let showscale = false;

    if (selectedColorCol && selectedColorCol !== 'none' && downsampledData[selectedColorCol]) {
      const colorVals = downsampledData[selectedColorCol];
      if (numericColumns.includes(selectedColorCol)) {
        colorsArray = colorVals.map(v => Number(v));
        colorscale = 'Viridis';
        showscale = true;
      } else {
        const uniqueCategories = [...new Set(colorVals.map(String))];
        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];
        const catMap: Record<string, string> = {};
        uniqueCategories.forEach((cat, idx) => { catMap[cat] = COLORS[idx % COLORS.length]; });
        colorsArray = colorVals.map(v => catMap[String(v)]);
      }
    }

    let sizeArray: number[] | undefined = undefined;
    if (selectedSizeCol && selectedSizeCol !== 'none' && downsampledData[selectedSizeCol]) {
      const sizeVals = downsampledData[selectedSizeCol].map(v => Number(v));
      const validSizes = sizeVals.filter(v => !isNaN(v));
      const minSz = validSizes.length > 0 ? Math.min(...validSizes) : 0;
      const maxSz = validSizes.length > 0 ? Math.max(...validSizes) : 1;
      const range = maxSz - minSz;
      sizeArray = sizeVals.map(v => isNaN(v) ? 4 : range === 0 ? 8 : 4 + ((v - minSz) / range) * 12);
    }

    return { colorsArray, colorscale, showscale, sizeArray };
  }, [downsampledData, selectedColorCol, selectedSizeCol, numericColumns]);

  // ─── Core render function using Plotly.react() for fast updates ───────────
  const renderPlot = useCallback(() => {
    if (!window.Plotly || !plotRef.current) return;
    setIsRendering(true);

    // Use requestAnimationFrame to avoid blocking the UI thread
    requestAnimationFrame(() => {
      try {
        const { colorsArray, colorscale, showscale, sizeArray } = colorAndSizeConfig;
        let traces: any[] = [];
        let layout: any = {};

        if (visualizationType === 'scatter' || visualizationType === 'line3d' || visualizationType === 'mesh3d') {
          if (!selectedX || !selectedY || !selectedZ) { setIsRendering(false); return; }

          const points = createScatter3DData(
            downsampledData[selectedX] as number[],
            downsampledData[selectedY] as number[],
            downsampledData[selectedZ] as number[]
          );

          if (visualizationType === 'scatter') {
            const trace = formatScatter3DForPlotly(points);
            if (colorsArray) {
              trace.marker.color = colorsArray as any;
              if (colorscale) { (trace.marker as any).colorscale = colorscale; (trace.marker as any).showscale = showscale; }
            }
            if (sizeArray) trace.marker.size = sizeArray as any;
            traces = [trace];
          } else if (visualizationType === 'line3d') {
            const trace = formatLine3DForPlotly(points, '#06b6d4');
            if (colorsArray) trace.marker.color = colorsArray as any;
            if (sizeArray) trace.marker.size = sizeArray as any;
            traces = [trace];
          } else {
            traces = [formatMesh3DForPlotly(points, '#a855f7')];
          }

          layout = get3DLayout({
            title: `${visualizationType === 'scatter' ? 'Scatter' : visualizationType === 'line3d' ? 'Línea' : 'Malla'} 3D: ${selectedX} × ${selectedY} × ${selectedZ}`,
            xAxisLabel: selectedX,
            yAxisLabel: selectedY,
            zAxisLabel: selectedZ,
          });

        } else if (visualizationType === 'heatmap') {
          const numericData: Record<string, number[]> = {};
          numericColumns.forEach(col => { numericData[col] = downsampledData[col] as number[]; });
          const correlationData = createCorrelationMatrix(numericData);
          traces = [formatHeatmap3DForPlotly(correlationData)];
          layout = {
            title: { text: 'Matriz de Correlación', font: { color: '#e5e5e5', family: 'Space Grotesk, sans-serif' } },
            xaxis: { tickcolor: '#a3a3a3', gridcolor: 'rgba(255,255,255,0.05)' },
            yaxis: { tickcolor: '#a3a3a3', gridcolor: 'rgba(255,255,255,0.05)' },
            height: 560,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#a3a3a3', family: 'Inter, sans-serif' },
            margin: { l: 100, r: 20, t: 50, b: 80 },
          };

        } else if (visualizationType === 'surface') {
          if (!selectedX || !selectedY || !selectedZ) { setIsRendering(false); return; }
          const surfaceData = createBinnedSurfaceData(
            downsampledData[selectedX] as number[],
            downsampledData[selectedY] as number[],
            downsampledData[selectedZ] as number[],
            15 // reduced bins for performance
          );
          traces = [{ x: surfaceData.x, y: surfaceData.y, z: surfaceData.z, type: 'surface', colorscale: 'Viridis' }];
          layout = get3DLayout({
            title: `Superficie 3D: ${selectedZ} en función de ${selectedX} y ${selectedY}`,
            xAxisLabel: selectedX, yAxisLabel: selectedY, zAxisLabel: selectedZ,
          });
        }

        if (traces.length === 0) { setIsRendering(false); return; }

        const config = {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['sendDataToCloud', 'editInChartStudio'],
          displaylogo: false,
        };

        // Plotly.react() reuses the existing DOM element — much faster than newPlot()
        window.Plotly!.react(plotRef.current, traces, layout, config);
      } catch (e) {
        console.error('Error rendering 3D plot:', e);
      } finally {
        setIsRendering(false);
      }
    });
  }, [visualizationType, selectedX, selectedY, selectedZ, colorAndSizeConfig, downsampledData, numericColumns]);

  // Trigger re-render whenever any setting changes
  useEffect(() => {
    if (plotlyLoaded) renderPlot();
  }, [plotlyLoaded, renderPlot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.Plotly && plotRef.current) {
        try { window.Plotly.purge(plotRef.current); } catch { /* ignore */ }
      }
    };
  }, []);

  if (!plotlyLoaded) {
    return (
      <Card className="bg-background/50 border-muted-foreground/20">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-muted-foreground">Cargando motor de visualización 3D...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="bg-background/50 border-muted-foreground/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Box className="h-5 w-5 text-cyan-500" />
            Visualizaciones 3D Interactivas
            {fullLen > MAX_3D_POINTS && (
              <span className="ml-auto text-[10px] font-normal text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Mostrando {sampledLen.toLocaleString()} de {fullLen.toLocaleString()} puntos
              </span>
            )}
          </CardTitle>
          <CardDescription>Explora tus datos en 3 dimensiones con trazados reales e interactivos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tipo de Visualización</label>
              <Select value={visualizationType} onValueChange={setVisualizationType}>
                <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scatter">Scatter Plot 3D</SelectItem>
                  <SelectItem value="line3d">Línea / Trayectoria 3D</SelectItem>
                  <SelectItem value="surface">Superficie 3D (Binned)</SelectItem>
                  <SelectItem value="mesh3d">Malla 3D (Mesh)</SelectItem>
                  <SelectItem value="heatmap">Heatmap de Correlaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visualizationType !== 'heatmap' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Eje X</label>
                  <Select value={selectedX} onValueChange={setSelectedX}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
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
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Eje Y</label>
                  <Select value={selectedY} onValueChange={setSelectedY}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
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
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Eje Z</label>
                  <Select value={selectedZ} onValueChange={setSelectedZ}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(visualizationType === 'scatter' || visualizationType === 'line3d') && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Color / Grupo</label>
                      <Select value={selectedColorCol} onValueChange={setSelectedColorCol}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                          <SelectValue placeholder="Sin color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin mapeo de color</SelectItem>
                          {columns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tamaño del Punto</label>
                      <Select value={selectedSizeCol} onValueChange={setSelectedSizeCol}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
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
                  </>
                )}
              </>
            )}
          </div>

          {/* Plot area — single stable DOM node, Plotly.react() updates it in place */}
          <div className="relative pt-2 border-t border-muted-foreground/10">
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/40 backdrop-blur-sm rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  Renderizando...
                </div>
              </div>
            )}
            <div
              ref={plotRef}
              id={plotIdRef.current}
              style={{ width: '100%', height: '560px' }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
