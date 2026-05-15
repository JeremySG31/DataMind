'use client';

import { AnalysisResult } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { formatNumber } from '@/lib/analysis-utils';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, BarChart3 } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="space-y-4">
      {/* Resumen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-600/10 to-blue-400/5 border-blue-500/20">
          <p className="text-lg text-foreground leading-relaxed">{analysis.summary}</p>
        </Card>
      </motion.div>

      {/* Estadísticas por columna */}
      {Object.entries(analysis.statistics).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 border-muted-foreground/20">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Estadísticas
            </h3>
            <div className="space-y-4">
              {Object.entries(analysis.statistics).map(([col, stats], idx) => (
                <motion.div
                  key={col}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="p-3 bg-muted rounded-lg"
                >
                  <p className="font-medium text-sm mb-2 text-blue-400">{col}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {stats.min !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Mín</p>
                        <p className="font-semibold">{formatNumber(stats.min)}</p>
                      </div>
                    )}
                    {stats.max !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Máx</p>
                        <p className="font-semibold">{formatNumber(stats.max)}</p>
                      </div>
                    )}
                    {stats.mean !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Promedio</p>
                        <p className="font-semibold">{formatNumber(stats.mean)}</p>
                      </div>
                    )}
                    {stats.median !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Mediana</p>
                        <p className="font-semibold">{formatNumber(stats.median)}</p>
                      </div>
                    )}
                    {stats.stdDev !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Desv. Est.</p>
                        <p className="font-semibold">{formatNumber(stats.stdDev)}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 border-muted-foreground/20">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Insights Principales
            </h3>
            <ul className="space-y-2">
              {analysis.insights.map((insight, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                  className="flex gap-2 text-sm text-foreground/90"
                >
                  <span className="text-amber-500 font-bold flex-shrink-0">•</span>
                  <span>{insight}</span>
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}

      {/* Gráficos recomendados */}
      {analysis.recommendedCharts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6 border-muted-foreground/20">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Visualizaciones Recomendadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.recommendedCharts.map((chart, idx) => (
                <motion.div
                  key={chart}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                  className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-medium text-green-400"
                >
                  {chart}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
