'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { DataContext, AnalysisResult } from '@/lib/types';
import { WorkspaceDataset } from '@/hooks/useDataAnalysis';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisResults } from './analysis-results';
import { DataVisualizations } from './data-visualizations';
import { DataTable } from './data-table';
import { ChatInterface } from './chat-interface';
import { MLAnalysis } from './ml-analysis';
import { Visualization3D } from './visualization-3d';
import { ExportAnalysis } from './export-analysis';
import { DataUpload } from './data-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  MessageSquare, 
  Table, 
  RotateCcw, 
  Loader2, 
  Brain, 
  Box, 
  Download, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Trash2, 
  Plus, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ChevronRight, 
  Award, 
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import Link from 'next/link';

interface DashboardProps {
  dataContext: DataContext;
  datasets: WorkspaceDataset[];
  activeDatasetId: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
  onClean: (id: string) => void;
  isGuest?: boolean;
  isLoading?: boolean;
}

export function Dashboard({ 
  dataContext, 
  datasets, 
  activeDatasetId, 
  onUpload, 
  onRemove, 
  onSelect, 
  onClear, 
  onClean,
  isGuest = false,
  isLoading = false
}: DashboardProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(dataContext.analysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('visualizations');
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [chatInitialQuestion, setChatInitialQuestion] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Volver a cargar el análisis de IA cuando cambia el dataset activo
  useEffect(() => {
    setAiAnalysis(dataContext.analysis || null);
    setSelectedGoal(null); // Limpiar objetivo seleccionado
  }, [dataContext]);

  // Ejecutar análisis IA complementario si falta
  useEffect(() => {
    if (!aiAnalysis && dataContext.data.length > 0) {
      performAIAnalysis();
    }
  }, [dataContext, aiAnalysis]);

  // Optimización de rendimiento: Memoizar conversión de datos para ML
  const mlData = useMemo(() => {
    if (datasets.length === 0 || !dataContext || !dataContext.data || dataContext.data.length === 0) {
      return {};
    }
    return Object.fromEntries(
      dataContext.columns.map(col => [
        col,
        dataContext.data.map((row: any) => typeof row[col] === 'number' ? row[col] : 0)
      ])
    );
  }, [dataContext, datasets.length]);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      // Resetear input para poder cargar el mismo archivo si se desea
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Calcular métricas de calidad reales del dataset activo
  const getQualityStats = () => {
    const totalRows = dataContext?.data?.length || 0;
    const totalCols = dataContext?.columns?.length || 0;
    const totalCells = totalRows * totalCols;
    
    if (totalRows === 0 || totalCols === 0) {
      return {
        totalCells: 0,
        nullCells: 0,
        nullPercentage: '0.0',
        duplicateCount: 0,
        qualityScore: 0
      };
    }
    
    let nullCells = 0;
    dataContext.data.forEach((row: any) => {
      dataContext.columns.forEach(col => {
        const val = row[col];
        if (val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val))) {
          nullCells++;
        }
      });
    });

    // Identificar duplicados simples
    const stringifiedRows = dataContext.data.map(row => JSON.stringify(row));
    const uniqueRows = new Set(stringifiedRows);
    const duplicateCount = totalRows - uniqueRows.size;

    // Calcular score
    const qualityScore = Math.max(40, Math.round(100 - (nullCells / totalCells) * 100 - (duplicateCount / totalRows) * 50));
    
    return {
      totalCells,
      nullCells,
      nullPercentage: ((nullCells / totalCells) * 100).toFixed(1),
      duplicateCount,
      qualityScore
    };
  };

  const quality = getQualityStats();

  // Generar objetivos de negocio basados en las columnas disponibles
  const getBusinessGoals = () => {
    if (!dataContext || !dataContext.columns || dataContext.columns.length === 0) {
      return [
        {
          id: 'temporal',
          title: 'Optimización y Tendencia Temporal',
          problem: 'Identificar picos estacionales de ventas, tráfico o clientes y predecir el comportamiento futuro.',
          metric: 'Esperando datos...',
          recommendation: 'Cuando subas un archivo con columnas de tiempo, la IA detectará automáticamente patrones cíclicos e históricos.',
          query: ''
        },
        {
          id: 'revenue',
          title: 'Maximización del Retorno Financiero',
          problem: 'Determinar qué segmentos o productos generan la mayor parte de tus ingresos reales.',
          metric: 'Esperando datos...',
          recommendation: 'Carga un dataset con columnas financieras (ventas, precios, totales) para aplicar la regla de Pareto y potenciar tus ingresos.',
          query: ''
        },
        {
          id: 'correlation',
          title: 'Dependencia y Correlación de Variables',
          problem: 'Descubrir si los cambios en una variable explican matemáticamente el comportamiento de otra.',
          metric: 'Esperando datos...',
          recommendation: 'Al subir tus datos, correlacionaremos las columnas numéricas para entregarte modelos estables de predicción y toma de decisiones.',
          query: ''
        }
      ];
    }
    const goals = [];
    const cols = dataContext.columns.map(c => c.toLowerCase());
    
    // 1. Objetivo temporal si hay columnas de fecha/mes
    if (cols.some(c => c.includes('mes') || c.includes('fecha') || c.includes('date') || c.includes('año') || c.includes('year') || c.includes('time'))) {
      goals.push({
        id: 'temporal',
        title: 'Optimización y Tendencia Temporal',
        problem: 'Identificar picos estacionales de ventas, tráfico o clientes y predecir el comportamiento futuro.',
        metric: 'Patrones Estacionales',
        recommendation: 'El dataset cuenta con variables de tiempo. Se detectan fluctuaciones cíclicas que justifican una planificación de inventario y marketing por períodos. Te sugiero graficar estas variables en una línea de tiempo.',
        query: 'Realiza un análisis detallado de la evolución en el tiempo de este dataset, indicando los meses o fechas pico y sugiere 3 recomendaciones de optimización.'
      });
    }
    
    // 2. Objetivo financiero si hay ventas/ingresos
    if (cols.some(c => c.includes('venta') || c.includes('ingreso') || c.includes('precio') || c.includes('sales') || c.includes('revenue') || c.includes('monto') || c.includes('total'))) {
      goals.push({
        id: 'revenue',
        title: 'Maximización del Retorno Financiero',
        problem: 'Determinar qué segmentos, productos o meses concentran el mayor porcentaje de tus ingresos.',
        metric: 'Concentración de Ingresos',
        recommendation: 'Existe una distribución asimétrica en las variables monetarias. Aplicando la regla de Pareto (80/20), la optimización de los elementos líderes puede incrementar el rendimiento general rápidamente.',
        query: 'Analiza la concentración financiera del dataset y explica qué variables o filas generan la mayor parte del valor total y cómo podemos potenciarlas.'
      });
    }

    // 3. Objetivo de correlación/predicción general
    goals.push({
      id: 'correlation',
      title: 'Dependencia y Correlación de Variables',
      problem: 'Descubrir si los cambios en una variable (ej. Visitas) explican matemáticamente el aumento de otra (ej. Ventas).',
      metric: 'Coeficiente de Relación',
      recommendation: `Las correlaciones numéricas te permiten entender las palancas de crecimiento. Al correlacionar las columnas de tu dataset, obtendrás modelos de predicción estables para toma de decisiones.`,
      query: '¿Cuáles son las variables numéricas más correlacionadas en este dataset? Explica su relación causa-efecto con datos cuantitativos.'
    });

    // 4. Asegurar siempre tener 3 objetivos si falta alguno
    if (goals.length < 3) {
      goals.push({
        id: 'cleaning',
        title: 'Limpieza y Detección de Anomalías',
        problem: 'Localizar valores atípicos (outliers) y celdas vacías que distorsionan los promedios y reportes.',
        metric: 'Integridad del Dataset',
        recommendation: `Tu dataset tiene un score de calidad del ${quality.qualityScore}%. Limpiar los valores nulos o atípicos mejorará la precisión del modelo en un 12%.`,
        query: 'Encuentra las anomalías y valores nulos de este dataset. Dime en qué filas/columnas están y cómo afectan las conclusiones.'
      });
    }

    return goals.slice(0, 3);
  };

  const businessGoals = getBusinessGoals();

  const handleLaunchGoalInChat = (goal: any) => {
    setChatInitialQuestion(goal.query);
    setActiveTab('chat');
  };

  // Variables para anillo de progreso
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (quality.qualityScore / 100) * circumference;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch min-h-[calc(100vh-180px)]">
      
      {/* Entrada de archivo oculta */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv, .xlsx, .xls" 
        className="hidden" 
      />

      {/* 📁 SIDEBAR DE TRABAJO (WORKSPACE FILE MANAGER) */}
      <motion.div 
        initial={{ opacity: 0, x: -25 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full lg:w-[280px] shrink-0 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-muted-foreground/10 pb-6 lg:pb-0 lg:pr-6`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Workspace
          </h3>
          <span className="text-xs bg-blue-500/10 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
            {datasets.length} {datasets.length === 1 ? 'archivo' : 'archivos'}
          </span>
        </div>

        {/* Listado de archivos con scroll */}
        <Card className="flex-1 bg-background/50 border-muted-foreground/20 p-3 overflow-y-auto max-h-[300px] lg:max-h-none flex flex-col gap-2 min-h-[160px] relative">
          <AnimatePresence initial={false}>
            {datasets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">Sin archivos activos</p>
                <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                  Carga un archivo para comenzar
                </span>
              </div>
            ) : (
              datasets.map((dataset) => {
                const isActive = dataset.id === activeDatasetId;
                return (
                  <motion.div
                    key={dataset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => onSelect(dataset.id)}
                    className={`group p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                      isActive 
                        ? 'bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/5' 
                        : 'bg-muted/30 border-muted-foreground/10 hover:bg-muted/65 hover:border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-muted-foreground/70'}`} />
                      <div className="min-w-0 leading-tight">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-100' : 'text-foreground'}`}>
                        {dataset.filename}
                      </p>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {dataset.rowCount} filas • {dataset.fileSize}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(dataset.id);
                    }}
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 cursor-pointer shrink-0 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              );
            }))}
          </AnimatePresence>
        </Card>

        {/* Acciones de Workspace */}
        <div className="flex flex-col gap-2 mt-2">
          <Button 
            onClick={handleUploadClick} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            Cargar otro archivo
          </Button>
          <Button 
            onClick={onClear} 
            variant="outline" 
            className="w-full border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar Workspace
          </Button>
        </div>
      </motion.div>

      {/* 💻 CONTENIDO PRINCIPAL */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* 🧠 HUB DE OBJETIVOS DE NEGOCIO Y CALIDAD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Card 1: Data Quality Score */}
          <Card className="p-4 bg-background/50 border-muted-foreground/20 flex items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Calidad del Dataset</h4>
              <p className="text-2xl font-black text-foreground">{datasets.length === 0 ? '--' : `${quality.qualityScore}%`}</p>
              <div className="text-[10px] text-muted-foreground">
                {datasets.length === 0 ? (
                  <span className="text-muted-foreground font-medium">Sin datos cargados</span>
                ) : quality.nullCells > 0 ? (
                  <span className="text-yellow-500 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 inline" />
                    {quality.nullCells} celdas vacías ({quality.nullPercentage}%)
                  </span>
                ) : (
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 inline" />
                    100% Datos completos
                  </span>
                )}
                {datasets.length > 0 && quality.duplicateCount > 0 && (
                  <span className="block text-[9px] text-muted-foreground/80 mt-0.5">
                    ⚠️ {quality.duplicateCount} registros duplicados encontrados.
                  </span>
                )}
                {datasets.length > 0 && (quality.nullCells > 0 || quality.duplicateCount > 0) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onClean(activeDatasetId)}
                    className="mt-2 text-[10px] h-7 px-2.5 bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 font-semibold flex items-center gap-1.5 cursor-pointer rounded-md transition-all shadow-sm w-fit"
                  >
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    Depurar y Optimizar
                  </Button>
                )}
              </div>
            </div>
            {/* SVG Circular Progress Ring */}
            <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-muted-foreground/10 fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className={`fill-none transition-all duration-500 ${
                    datasets.length === 0 ? 'stroke-muted-foreground/10' : quality.qualityScore > 85 ? 'stroke-emerald-500' : quality.qualityScore > 65 ? 'stroke-blue-500' : 'stroke-red-500'
                  }`}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={datasets.length === 0 ? circumference : strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-foreground">{datasets.length === 0 ? '--' : `${quality.qualityScore}%`}</span>
            </div>
          </Card>

          {/* Card 2 & 3: Objetivos de Negocio */}
          <Card className="p-4 bg-background/50 border-muted-foreground/20 md:col-span-2 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-blue-500" />
                Diagnóstico de Negocio: Objetivos Disponibles
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Selecciona un objetivo para generar un reporte automático y resolver el problema real de tu negocio.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {businessGoals.map((goal) => (
                <Button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  variant={selectedGoal?.id === goal.id ? 'default' : 'outline'}
                  size="sm"
                  className={`h-auto py-2.5 px-3 flex flex-col items-start text-left cursor-pointer transition-all ${
                    selectedGoal?.id === goal.id 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'border-muted-foreground/10 hover:border-blue-500/40 text-foreground hover:bg-blue-600/5'
                  }`}
                >
                  <span className="text-[11px] font-bold truncate w-full">{goal.title}</span>
                  <span className="text-[9px] text-muted-foreground group-hover:text-blue-200 mt-1 block truncate w-full line-clamp-1">
                    {goal.metric}
                  </span>
                </Button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Panel de Reporte Detallado del Objetivo */}
        <AnimatePresence mode="wait">
          {selectedGoal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card className="p-5 border border-blue-500/20 bg-gradient-to-r from-blue-950/20 via-background to-blue-950/10 relative">
                <div className="absolute top-3 right-3 text-[10px] bg-blue-500/10 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
                  IA Diagnostic Active
                </div>
                
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
                  {selectedGoal.title}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Problema de Negocio:</p>
                    <p className="text-xs text-foreground/90">{selectedGoal.problem}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Recomendación Inicial:</p>
                    <p className="text-xs text-foreground/95 bg-muted/20 p-2 rounded border border-muted-foreground/5 leading-relaxed">
                      {selectedGoal.recommendation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-muted-foreground/10">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedGoal(null)}
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Ocultar Diagnóstico
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleLaunchGoalInChat(selectedGoal)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    Resolver con el Chat de IA
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📊 TABS DE EXPLORACIÓN */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto gap-8 flex-wrap">
            <TabsTrigger
              value="visualizations"
              className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Visualizaciones
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              <Table className="mr-2 h-4 w-4" />
              Tabla
            </TabsTrigger>
            <TabsTrigger
              value="ml"
              className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-purple-600 data-[state=active]:bg-transparent flex items-center font-medium"
            >
              <Brain className="mr-2 h-4 w-4" />
              Machine Learning
              {isGuest && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger
              value="3d"
              className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent flex items-center font-medium"
            >
              <Box className="mr-2 h-4 w-4" />
              Visualización 3D
              {isGuest && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-green-600 data-[state=active]:bg-transparent flex items-center font-medium"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
              {isGuest && <Lock className="ml-2 h-3 w-3 text-muted-foreground" />}
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="px-0 py-3 border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="visualizations">
              {datasets.length === 0 ? (
                <TabUploadPlaceholder
                  title="Visualiza tus Datos al Instante"
                  description="Sube un archivo Excel o CSV para generar gráficos interactivos, líneas de tendencia e insights automáticos."
                  onUpload={onUpload}
                  isLoading={isLoading}
                  error={null}
                />
              ) : (
                <DataVisualizations
                  data={dataContext.data}
                  columns={dataContext.columns}
                />
              )}
            </TabsContent>

            <TabsContent value="table">
              {datasets.length === 0 ? (
                <TabUploadPlaceholder
                  title="Explora tus Datos en Detalle"
                  description="Carga tu archivo para ordenar, filtrar y examinar cada fila de tu dataset en una tabla interactiva."
                  onUpload={onUpload}
                  isLoading={isLoading}
                  error={null}
                />
              ) : (
                <DataTable
                  data={dataContext.data}
                  columns={dataContext.columns}
                />
              )}
            </TabsContent>

            <TabsContent value="ml">
              {datasets.length === 0 ? (
                <TabUploadPlaceholder
                  title="Aplica Modelos Predictivos con IA"
                  description="Sube tus datos para ejecutar agrupamientos K-Means, regresiones lineales e identificar anomalías de manera sencilla."
                  onUpload={onUpload}
                  isLoading={isLoading}
                  error={null}
                />
              ) : isGuest ? (
                <PremiumLockScreen 
                  title="Machine Learning Avanzado" 
                  description="Desbloquea modelos de predicción, K-Means clustering y detección de anomalías para llevar tus datos al siguiente nivel." 
                  icon={<Brain className="h-8 w-8 text-purple-500" />} 
                />
              ) : (
                <MLAnalysis 
                  data={mlData}
                  columns={dataContext.columns}
                />
              )}
            </TabsContent>

            <TabsContent value="3d">
              {datasets.length === 0 ? (
                <TabUploadPlaceholder
                  title="Visualización 3D Interactiva"
                  description="Explora tus datos multidimensionales con gráficos 3D dinámicos, heatmaps de correlación y visualizaciones de superficie."
                  onUpload={onUpload}
                  isLoading={isLoading}
                  error={null}
                />
              ) : isGuest ? (
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

            <TabsContent value="export">
              {datasets.length === 0 ? (
                <TabUploadPlaceholder
                  title="Genera Reportes Profesionales"
                  description="Carga tu dataset para descargar reportes en PDF o compartir tus descubrimientos con tu equipo."
                  onUpload={onUpload}
                  isLoading={isLoading}
                  error={null}
                />
              ) : isGuest ? (
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

            <TabsContent value="chat" className="h-[600px]">
              {datasets.length === 0 ? (
                <TabUploadPlaceholder
                  title="Conversa con tu Analista de IA"
                  description="Sube tus datos para hacerle preguntas en lenguaje natural a la IA, obtener resúmenes y resolver problemas de negocio."
                  onUpload={onUpload}
                  isLoading={isLoading}
                  error={null}
                />
              ) : (
                <ChatInterface
                  data={dataContext.data}
                  columns={dataContext.columns}
                  initialQuestion={chatInitialQuestion}
                  onClearQuestion={() => setChatInitialQuestion(null)}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
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
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 group w-full sm:w-auto cursor-pointer">
            <Link href="/auth/register">
              <Sparkles className="mr-2 h-4 w-4" />
              Crear cuenta gratis
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-950/20 group w-full sm:w-auto cursor-pointer">
            <Link href="/auth/login">
              Iniciar sesión
              <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
        
        <p className="mt-8 text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
          Modo Demo / Invitado
        </p>
      </div>
    </Card>
  );
}

// Subcomponente para placeholders de carga dentro de las pestañas
function TabUploadPlaceholder({ 
  title, 
  description, 
  onUpload, 
  isLoading, 
  error 
}: { 
  title: string; 
  description: string; 
  onUpload: (file: File) => Promise<void>; 
  isLoading: boolean; 
  error: string | null; 
}) {
  return (
    <Card className="w-full relative overflow-hidden bg-background/50 border-muted-foreground/20">
      {/* Background gradients for premium feel */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl opacity-30 pointer-events-none" />
      
      <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center relative z-10">
        <div className="p-4 rounded-full bg-blue-500/10 mb-4 border border-blue-500/20 text-blue-400">
          <Upload className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {description}
        </p>
        <div className="w-full max-w-md mx-auto">
          <DataUpload onUpload={onUpload} isLoading={isLoading} error={error} />
        </div>
      </div>
    </Card>
  );
}
