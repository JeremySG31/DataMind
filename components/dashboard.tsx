'use client';

import { useState, useEffect } from 'react';
import { DataContext, AnalysisResult } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisResults } from './analysis-results';
import { DataVisualizations } from './data-visualizations';
import { DataTable } from './data-table';
import { ChatInterface } from './chat-interface';
import { MLAnalysis } from './ml-analysis';
import { Visualization3D } from './visualization-3d';
import { ExportAnalysis } from './export-analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, Table, RotateCcw, Loader2, Brain, Box, Download } from 'lucide-react';

interface DashboardProps {
  dataContext: DataContext;
  onClear: () => void;
}

export function Dashboard({ dataContext, onClear }: DashboardProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(dataContext.analysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Solicitar análisis IA adicional si no existe
  useEffect(() => {
    if (!aiAnalysis && dataContext.data.length > 0) {
      performAIAnalysis();
    }
  }, [dataContext]);

  const performAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataContext.data.slice(0, 50),
          columns: dataContext.columns,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAiAnalysis({
          summary: result.summary || dataContext.analysis?.summary || 'Análisis completado',
          statistics: dataContext.analysis?.statistics || {},
          insights: result.insights || dataContext.analysis?.insights || [],
          recommendedCharts: result.recommendedCharts || dataContext.analysis?.recommendedCharts || [],
        });
      }
    } catch (error) {
      console.error('Error en análisis IA:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {dataContext.filename}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {dataContext.rowCount} filas × {dataContext.columnCount} columnas
          </p>
        </div>
        <Button
          onClick={onClear}
          variant="outline"
          className="border-muted-foreground/20 hover:bg-muted"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Cargar otro archivo
        </Button>
      </div>

      {/* Análisis */}
      {aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AnalysisResults analysis={aiAnalysis} />
        </motion.div>
      )}

      {isAnalyzing && (
        <Card className="p-6 flex items-center justify-center gap-3 bg-background/50 border-muted-foreground/20">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <p className="text-foreground">Analizando datos con IA...</p>
        </Card>
      )}

      {/* Tabs de exploración */}
      <Tabs defaultValue="visualizations" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto gap-8 flex-wrap">
          <TabsTrigger
            value="visualizations"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Visualizaciones
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            <Table className="mr-2 h-4 w-4" />
            Tabla
          </TabsTrigger>
          <TabsTrigger
            value="ml"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-purple-600 data-[state=active]:bg-transparent"
          >
            <Brain className="mr-2 h-4 w-4" />
            Machine Learning
          </TabsTrigger>
          <TabsTrigger
            value="3d"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent"
          >
            <Box className="mr-2 h-4 w-4" />
            Visualización 3D
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-green-600 data-[state=active]:bg-transparent"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TabsContent value="visualizations" className="mt-6">
            <DataVisualizations
              data={dataContext.data}
              columns={dataContext.columns}
            />
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            <DataTable
              data={dataContext.data}
              columns={dataContext.columns}
            />
          </TabsContent>

          <TabsContent value="ml" className="mt-6">
            <MLAnalysis 
              data={Object.fromEntries(
                dataContext.columns.map(col => [
                  col,
                  dataContext.data.map((row: any) => typeof row[col] === 'number' ? row[col] : 0)
                ])
              )}
              columns={dataContext.columns}
            />
          </TabsContent>

          <TabsContent value="3d" className="mt-6">
            <Visualization3D 
              data={Object.fromEntries(
                dataContext.columns.map(col => [
                  col,
                  dataContext.data.map((row: any) => typeof row[col] === 'number' ? row[col] : 0)
                ])
              )}
              columns={dataContext.columns}
            />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ExportAnalysis
              data={dataContext.data}
              datasetName={dataContext.filename || 'dataset'}
              analysisType="comprehensive"
              statistics={aiAnalysis?.statistics || {}}
              insights={aiAnalysis?.insights || []}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-6 h-[600px]">
            <ChatInterface
              data={dataContext.data}
              columns={dataContext.columns}
            />
          </TabsContent>
        </motion.div>
      </Tabs>
    </motion.div>
  );
}
