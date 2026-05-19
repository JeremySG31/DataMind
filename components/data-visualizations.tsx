'use client';

import { useState } from 'react';
import { DataRow } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'recharts';
import { motion } from 'framer-motion';

interface DataVisualizationsProps {
  data: DataRow[];
  columns: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DataVisualizations({ data, columns }: DataVisualizationsProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter' | 'pie'>('line');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns.slice(0, 2));

  // Obtener solo columnas numéricas para visualización
  const numericColumns = columns.filter(col =>
    data.some(row => typeof row[col] === 'number')
  );

  const visibleData = data.map(row => {
    const result: DataRow = {};
    selectedColumns.forEach(col => {
      result[col] = row[col];
    });
    return result;
  });

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
                {(['line', 'bar', 'scatter', 'pie'] as const).map(type => (
                  <Button
                    key={type}
                    onClick={() => setChartType(type)}
                    variant={chartType === type ? 'default' : 'outline'}
                    size="sm"
                    className={chartType === type ? 'bg-blue-600' : ''}
                  >
                    {type === 'line' && 'Línea'}
                    {type === 'bar' && 'Barra'}
                    {type === 'scatter' && 'Dispersión'}
                    {type === 'pie' && 'Pastel'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selección de columnas */}
            {chartType !== 'pie' && (
              <div>
                <p className="text-sm font-semibold mb-2">Columnas a visualizar</p>
                <div className="flex gap-2 flex-wrap">
                  {numericColumns.map(col => (
                    <Button
                      key={col}
                      onClick={() => toggleColumn(col)}
                      variant={selectedColumns.includes(col) ? 'default' : 'outline'}
                      size="sm"
                      className={selectedColumns.includes(col) ? 'bg-blue-600' : ''}
                    >
                      {col}
                    </Button>
                  ))}
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
        <Card className="p-6 bg-background/50 border-muted-foreground/20">
          <div className="w-full h-[400px]">
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

            {chartType === 'pie' && numericColumns.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visibleData}
                    dataKey={numericColumns[0]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    isAnimationActive={true}
                  >
                    {visibleData.map((_, index) => (
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
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
