'use client';

import { useState, useMemo, useEffect } from 'react';
import { DataRow } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';

interface DataVisualizationsProps {
  data: DataRow[];
  columns: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DataVisualizations({ data, columns }: DataVisualizationsProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter' | 'pie' | 'area' | 'radar' | 'composed'>('line');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns.slice(0, 2));

  // Obtener solo columnas numéricas para visualización
  const numericColumns = useMemo(() => {
    return columns.filter(col =>
      data.some(row => typeof row[col] === 'number')
    );
  }, [columns, data]);

  // Obtener columnas categóricas o de texto para agrupación
  const categoricalColumns = useMemo(() => {
    const cols = columns.filter(col =>
      data.some(row => {
        const val = row[col];
        return typeof val === 'string' && val.trim() !== '' && isNaN(Number(val));
      })
    );
    return cols.length > 0 ? cols : columns;
  }, [columns, data]);

  // Estados de agregación para Pastel y Radar
  const [pieCategoryCol, setPieCategoryCol] = useState<string>('');
  const [pieValueCol, setPieValueCol] = useState<string>('__count');
  const [pieLimit, setPieLimit] = useState<number>(10);

  // Inicializar y actualizar estados según las columnas del dataset cargado
  useEffect(() => {
    setSelectedColumns(columns.slice(0, 2));
    const defaultCat = categoricalColumns[0] || columns[0] || '';
    setPieCategoryCol(defaultCat);
    setPieValueCol('__count');
  }, [columns, categoricalColumns]);

  // Optimización de rendimiento: muestreo si excede 300 registros (para gráficos de puntos/líneas continuos)
  const isDownsampled = data.length > 300;
  const chartData = useMemo(() => {
    if (!isDownsampled) return data;
    const step = Math.ceil(data.length / 300);
    const sampled = [];
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }
    return sampled;
  }, [data, isDownsampled]);

  const visibleData = useMemo(() => {
    return chartData.map(row => {
      const result: DataRow = {};
      selectedColumns.forEach(col => {
        result[col] = row[col];
      });
      return result;
    });
  }, [chartData, selectedColumns]);

  // Agrupación automática para gráficos de pastel (Pie) y Radar
  const aggregatedData = useMemo(() => {
    if (!pieCategoryCol) return [];

    const groups: Record<string, number> = {};
    data.forEach(row => {
      let rawCat = row[pieCategoryCol];
      if (rawCat === undefined || rawCat === null) {
        rawCat = '(Vacío)';
      }
      const cat = String(rawCat).trim() || '(Vacío)';

      let val = 1;
      if (pieValueCol !== '__count') {
        const parsed = Number(row[pieValueCol]);
        val = isNaN(parsed) ? 0 : parsed;
      }

      groups[cat] = (groups[cat] || 0) + val;
    });

    const list = Object.entries(groups).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));

    // Ordenar de forma descendente por valor acumulado
    list.sort((a, b) => b.value - a.value);

    if (list.length <= pieLimit) {
      return list;
    }

    // Agrupar los sectores sobrantes en "Otros"
    const topItems = list.slice(0, pieLimit - 1);
    const otherItems = list.slice(pieLimit - 1);
    const otherSum = otherItems.reduce((sum, item) => sum + item.value, 0);

    topItems.push({
      name: `Otros (${otherItems.length} cat.)`,
      value: Number(otherSum.toFixed(2)),
    });

    return topItems;
  }, [data, pieCategoryCol, pieValueCol, pieLimit]);

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col)
        ? prev.filter(c => c !== col)
        : [...prev.slice(0, 1), col]
    );
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-4 bg-background/50 border-muted-foreground/20">
          <div className="space-y-4">
            {/* Tipo de gráfico */}
            <div>
              <p className="text-sm font-semibold mb-2">Tipo de Gráfico</p>
              <div className="flex gap-2 flex-wrap">
                {(['line', 'bar', 'scatter', 'pie', 'area', 'radar', 'composed'] as const).map(type => (
                  <Button
                    key={type}
                    onClick={() => setChartType(type)}
                    variant={chartType === type ? 'default' : 'outline'}
                    size="sm"
                    className={chartType === type ? 'bg-blue-600 text-white' : ''}
                  >
                    {type === 'line' && 'Línea'}
                    {type === 'bar' && 'Barra'}
                    {type === 'scatter' && 'Dispersión'}
                    {type === 'pie' && 'Pastel'}
                    {type === 'area' && 'Área'}
                    {type === 'radar' && 'Radar'}
                    {type === 'composed' && 'Mixto'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selección de columnas para gráficos 2D estándar */}
            {chartType !== 'pie' && chartType !== 'radar' && (
              <div>
                <p className="text-sm font-semibold mb-2">Columnas a visualizar</p>
                <div className="flex gap-2 flex-wrap">
                  {numericColumns.map(col => (
                    <Button
                      key={col}
                      onClick={() => toggleColumn(col)}
                      variant={selectedColumns.includes(col) ? 'default' : 'outline'}
                      size="sm"
                      className={selectedColumns.includes(col) ? 'bg-blue-600 text-white' : ''}
                    >
                      {col}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Controles avanzados de agregación para Pastel y Radar */}
            {(chartType === 'pie' || chartType === 'radar') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-muted-foreground/10">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Columna de Categoría
                  </label>
                  <Select value={pieCategoryCol} onValueChange={setPieCategoryCol}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 w-full">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Columna de Valor
                  </label>
                  <Select value={pieValueCol} onValueChange={setPieValueCol}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 w-full">
                      <SelectValue placeholder="Seleccionar valor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__count">
                        Cantidad de Registros (Frecuencia)
                      </SelectItem>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Límite de Sectores
                  </label>
                  <Select value={String(pieLimit)} onValueChange={(val) => setPieLimit(Number(val))}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Top 5 categorías</SelectItem>
                      <SelectItem value="10">Top 10 categorías</SelectItem>
                      <SelectItem value="15">Top 15 categorías</SelectItem>
                      <SelectItem value="20">Top 20 categorías</SelectItem>
                      <SelectItem value="30">Top 30 categorías</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Gráfico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 bg-background/50 border-muted-foreground/20 space-y-4">
          {isDownsampled && chartType !== 'pie' && chartType !== 'radar' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-medium">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span>Optimización Activa: Graficando una muestra representativa de 300 de {data.length} filas para evitar latencia visual.</span>
            </div>
          )}
          <div className="w-full h-112.5">
            {chartType === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {selectedColumns.map((col, idx) => (
                    <Line
                      key={col}
                      type="monotone"
                      dataKey={col}
                      stroke={COLORS[idx % COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartType === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visibleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {selectedColumns.map((col, idx) => (
                    <Bar
                      key={col}
                      dataKey={col}
                      fill={COLORS[idx % COLORS.length]}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === 'scatter' && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    type="number"
                    dataKey={selectedColumns[0]}
                    stroke="rgba(255,255,255,0.5)"
                  />
                  <YAxis
                    type="number"
                    dataKey={selectedColumns[1]}
                    stroke="rgba(255,255,255,0.5)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Scatter
                    dataKey={selectedColumns[1]}
                    data={visibleData}
                    fill={COLORS[0]}
                    isAnimationActive={true}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}

            {chartType === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visibleData}>
                  <defs>
                    {selectedColumns.map((col, idx) => (
                      <linearGradient key={col} id={`color-${col}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {selectedColumns.map((col, idx) => (
                    <Area
                      key={col}
                      type="monotone"
                      dataKey={col}
                      stroke={COLORS[idx % COLORS.length]}
                      fillOpacity={1}
                      fill={`url(#color-${col})`}
                      isAnimationActive={true}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartType === 'radar' && aggregatedData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={aggregatedData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.6)"
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <Radar
                    name={pieValueCol === '__count' ? 'Cantidad de Registros' : pieValueCol}
                    dataKey="value"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.35}
                    isAnimationActive={true}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}

            {chartType === 'composed' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={visibleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {selectedColumns.length > 0 && (
                    <Bar
                      dataKey={selectedColumns[0]}
                      fill={COLORS[0]}
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                      isAnimationActive={true}
                    />
                  )}
                  {selectedColumns.length > 1 && (
                    <Line
                      type="monotone"
                      dataKey={selectedColumns[1]}
                      stroke={COLORS[1]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS[1] }}
                      isAnimationActive={true}
                    />
                  )}
                  {selectedColumns.length > 2 && (
                    <Area
                      type="monotone"
                      dataKey={selectedColumns[2]}
                      fill={COLORS[2]}
                      stroke={COLORS[2]}
                      fillOpacity={0.15}
                      isAnimationActive={true}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartType === 'pie' && aggregatedData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aggregatedData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={120}
                    paddingAngle={2}
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name.length > 15 ? name.substring(0, 15) + '...' : name}: ${(percent * 100).toFixed(0)}%`
                    }
                    isAnimationActive={true}
                  >
                    {aggregatedData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

