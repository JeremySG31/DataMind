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
import { BarChart3, MessageSquare, Table, RotateCcw, Loader2, Brain, Box, Download, Lock, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardProps {
  dataContext: DataContext;
  onClear: () => void;
  isGuest?: boolean;
}

export function Dashboard({ dataContext, onClear, isGuest = false }: DashboardProps) {
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
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-purple-600 data-[state=active]:bg-transparent flex items-center"
          >
            <Brain className="mr-2 h-4 w-4" />
            Machine Learning
            {isGuest && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger
            value="3d"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent flex items-center"
          >
            <Box className="mr-2 h-4 w-4" />
            Visualización 3D
            {isGuest && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-green-600 data-[state=active]:bg-transparent flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
            {isGuest && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
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
            {isGuest ? (
              <PremiumLockScreen 
                title="Machine Learning Avanzado" 
                description="Desbloquea modelos de predicción, K-Means clustering y detección de anomalías para llevar tus datos al siguiente nivel." 
                icon={<Brain className="h-8 w-8 text-purple-500" />} 
              />
            ) : (
              <MLAnalysis 
                data={Object.fromEntries(
                  dataContext.columns.map(col => [
                    col,
                    dataContext.data.map((row: any) => typeof row[col] === 'number' ? row[col] : 0)
                  ])
                )}
                columns={dataContext.columns}
              />
            )}
          </TabsContent>

          <TabsContent value="3d" className="mt-6">
            {isGuest ? (
              <PremiumLockScreen 
                title="Visualización 3D Interactiva" 
                description="Explora tus datos multidimensionales con gráficos 3D dinámicos, heatmaps de correlación y visualizaciones de superficie." 
                icon={<Box className="h-8 w-8 text-cyan-500" />} 
              />
            ) : (
              <Visualization3D 
                data={Object.fromEntries(
                  dataContext.columns.map(col => [
                    col,
                    dataContext.data.map((row: any) => typeof row[col] === 'number' ? row[col] : 0)
                  ])
                )}
                columns={dataContext.columns}
              />
            )}
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            {isGuest ? (
              <PremiumLockScreen 
                title="Exportación y Gestión de Reportes" 
                description="Guarda tus análisis en la nube, expórtalos en PDF profesionales o comparte tus descubrimientos con tu equipo." 
                icon={<Download className="h-8 w-8 text-green-500" />} 
              />
            ) : (
              <ExportAnalysis
                data={dataContext.data}
                datasetName={dataContext.filename || 'dataset'}
                analysisType="comprehensive"
                statistics={aiAnalysis?.statistics || {}}
                insights={aiAnalysis?.insights || []}
              />
            )}
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

// Subcomponente para pantalla de bloqueo premium
function PremiumLockScreen({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <Card className="w-full relative overflow-hidden bg-background/50 border-muted-foreground/20">
      {/* Background gradients for premium feel */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl opacity-50 pointer-events-none" />
      
      <div className="p-12 md:p-16 flex flex-col items-center justify-center text-center relative z-10">
        <div className="p-4 rounded-2xl bg-muted/50 mb-6 shadow-inner ring-1 ring-white/5 relative">
          {icon}
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-lg shadow-blue-500/40">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
          {title}
        </h3>
        
        <p className="text-muted-foreground max-w-lg mb-8 text-base md:text-lg leading-relaxed">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/auth/register" passHref legacyBehavior>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 group w-full sm:w-auto cursor-pointer">
              <Sparkles className="mr-2 h-4 w-4" />
              Crear cuenta gratis
            </Button>
          </Link>
          <Link href="/auth/login" passHref legacyBehavior>
            <Button size="lg" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-950/20 group w-full sm:w-auto cursor-pointer">
              Iniciar sesión
              <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        
        <p className="mt-8 text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
          Modo Demo / Invitado
        </p>
      </div>
    </Card>
  );
}
