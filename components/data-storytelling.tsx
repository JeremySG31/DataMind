'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Compass, 
  TrendingUp, 
  Target, 
  Database, 
  Sparkles, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { DataContext, AnalysisResult } from '@/lib/types';

interface DataStorytellingProps {
  dataContext: DataContext;
  aiAnalysis: AnalysisResult | null;
  quality: {
    totalCells: number;
    nullCells: number;
    nullPercentage: string;
    duplicateCount: number;
    qualityScore: number;
  };
  businessGoals: any[];
  onLaunchGoalInChat: (goal: any) => void;
  onNavigateToTab: (tab: string) => void;
  isAnalyzing?: boolean;
}

export function DataStorytelling({
  dataContext,
  aiAnalysis,
  quality,
  businessGoals,
  onLaunchGoalInChat,
  onNavigateToTab,
  isAnalyzing = false,
}: DataStorytellingProps) {
  
  const numericCount = dataContext.columns.filter(col =>
    dataContext.data.some(row => typeof row[col] === 'number')
  ).length;

  const categoricalCount = Math.max(0, dataContext.columns.length - numericCount);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-8"
    >
      {/* Encabezado Storytelling */}
      <motion.div variants={itemVariants} className="text-left space-y-2">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase font-display">
          <BookOpen className="h-4 w-4" />
          Narrativa de Datos
        </div>
        <h2 className="text-2xl font-bold font-display bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600 bg-clip-text text-transparent">
          El Viaje de tu Dataset: Una Historia en Tres Actos
        </h2>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          Traducimos tus columnas y números en un hilo conductor estructurado. Descubre el origen de tus datos, las tendencias del trayecto y las resoluciones de negocio recomendadas.
        </p>
      </motion.div>

      {/* Flujo Cronológico de Historia (Camino del Storytelling) */}
      <div className="relative border-l border-dashed border-blue-500/20 pl-6 sm:pl-8 ml-3 space-y-12">
        
        {/* ================= ACTO I: EL ORIGEN ================= */}
        <motion.div variants={itemVariants} className="relative">
          {/* Nodo Indicador */}
          <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 p-1.5 rounded-full bg-background border-2 border-blue-500 text-blue-400 shadow-md shadow-blue-500/20 shrink-0 z-10">
            <Database className="h-4 w-4" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
                Acto I
              </span>
              <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase font-display">
                El Origen: Estado e Integridad del Dataset
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Contexto Principal */}
              <Card className="md:col-span-2 p-5 bg-background/50 border-muted-foreground/20 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider font-display">
                    Punto de Partida
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed font-sans">
                    El archivo cargado, <strong className="text-blue-300 font-medium">{dataContext.filename || 'Dataset cargado'}</strong>, contiene un total de <strong className="text-foreground">{dataContext.rowCount}</strong> registros distribuidos en <strong className="text-foreground">{dataContext.columnCount}</strong> variables analíticas clave.
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-normal">
                    🔢 <strong className="text-foreground">{numericCount}</strong> columnas numéricas para tendencias y cálculos, 🔤 <strong className="text-foreground">{categoricalCount}</strong> columnas categóricas o de texto para segmentaciones y agrupaciones.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {dataContext.columns.map((col, idx) => (
                    <span 
                      key={idx} 
                      className="bg-muted/40 border border-muted-foreground/10 px-2 py-1 rounded text-muted-foreground font-mono text-[10px]"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Card Salud del Dataset */}
              <Card className="p-5 bg-background/50 border-muted-foreground/20 flex flex-col justify-between space-y-4 relative overflow-hidden">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider font-display">
                    Salud del Archivo
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-display text-foreground">{quality.qualityScore}%</span>
                    <span className="text-xs text-muted-foreground">de integridad</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {quality.nullCells > 0 ? (
                    <div className="flex items-center gap-1.5 text-yellow-500 font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{quality.nullCells} Celdas vacías</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Datos 100% completos</span>
                    </div>
                  )}

                  {quality.duplicateCount > 0 ? (
                    <p className="text-[10px] text-muted-foreground">
                      ⚠️ Se identificaron {quality.duplicateCount} registros duplicados que podrían sesgar promedios.
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      ✓ Sin registros duplicados detectados.
                    </p>
                  )}
                </div>

                <Button 
                  onClick={() => onNavigateToTab('table')}
                  size="sm" 
                  variant="outline" 
                  className="w-full text-[10px] h-7 border-muted-foreground/20 hover:bg-muted/50 cursor-pointer font-semibold"
                >
                  Inspeccionar Tabla
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* ================= ACTO II: EL NUDO ================= */}
        <motion.div variants={itemVariants} className="relative">
          {/* Nodo Indicador */}
          <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 p-1.5 rounded-full bg-background border-2 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/20 shrink-0 z-10">
            <Compass className="h-4 w-4 animate-spin-slow" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
                Acto II
              </span>
              <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase font-display">
                El Nudo: Descubrimientos e Insights de la IA
              </h3>
            </div>

            {isAnalyzing ? (
              <Card className="p-6 bg-background/50 border-muted-foreground/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="text-xs text-muted-foreground">La IA está formulando la narrativa de insights...</p>
              </Card>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                {/* Resumen Principal de Storytelling */}
                <Card className="p-5 bg-gradient-to-r from-indigo-950/15 via-background to-blue-950/10 border-indigo-500/20">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider font-display">
                        El Hilo Conductor
                      </p>
                      <p className="text-sm text-foreground/90 leading-relaxed font-sans">
                        {aiAnalysis.summary}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Lista de Acontecimientos Clave (Insights) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiAnalysis.insights.slice(0, 4).map((insight, idx) => (
                    <Card 
                      key={idx} 
                      className="p-4 bg-background/50 border-muted-foreground/15 hover:border-indigo-500/30 transition-all duration-300 flex gap-3 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-tr from-indigo-500/0 to-indigo-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
                      <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 font-display">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-muted-foreground group-hover:text-foreground/90 leading-relaxed transition-colors">
                        {insight}
                      </p>
                    </Card>
                  ))}
                </div>

                {aiAnalysis.recommendedCharts && aiAnalysis.recommendedCharts.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-display flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                      Visualizaciones Sugeridas por la IA
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aiAnalysis.recommendedCharts.map((chartText, idx) => {
                        let Icon = TrendingUp;
                        const lower = chartText.toLowerCase();
                        if (lower.includes('barras') || lower.includes('barra') || lower.includes('bar')) {
                          Icon = BarChart3;
                        } else if (lower.includes('torta') || lower.includes('pastel') || lower.includes('pie') || lower.includes('gráfico circular')) {
                          Icon = PieChart;
                        } else if (lower.includes('dispersión') || lower.includes('scatter') || lower.includes('puntos')) {
                          Icon = Compass;
                        }

                        return (
                          <div
                            key={idx}
                            onClick={() => onNavigateToTab('visualizations')}
                            className="p-3 rounded-lg bg-indigo-950/10 border border-indigo-500/10 hover:border-indigo-500/30 hover:bg-indigo-950/20 transition-all cursor-pointer flex items-center gap-3 group"
                          >
                            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium transition-colors">
                              {chartText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={() => onNavigateToTab('visualizations')}
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
                  >
                    Ver Gráficos Interactivos
                    <TrendingUp className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-6 bg-background/50 border-muted-foreground/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                <p className="text-xs text-muted-foreground">No hay análisis de IA disponible para este dataset.</p>
              </Card>
            )}
          </div>
        </motion.div>

        {/* ================= ACTO III: EL DESENLACE ================= */}
        <motion.div variants={itemVariants} className="relative">
          {/* Nodo Indicador */}
          <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 p-1.5 rounded-full bg-background border-2 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20 shrink-0 z-10">
            <Target className="h-4 w-4" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Acto III
              </span>
              <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase font-display">
                El Desenlace: Objetivos de Negocio y ML
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Resolución de Negocio */}
              <Card className="md:col-span-2 p-5 bg-background/50 border-muted-foreground/20 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider font-display">
                    Objetivos de Negocio Sugeridos
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed leading-relaxed font-sans">
                    Para resolver los desafíos reales detectados en los datos, te recomendamos abordar estos planes de acción específicos:
                  </p>
                </div>

                <div className="space-y-3">
                  {businessGoals.map((goal, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {goal.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground block line-clamp-1">
                          {goal.problem}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onLaunchGoalInChat(goal)}
                        className="text-[10px] h-7 bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white cursor-pointer shrink-0"
                      >
                        Resolver
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Predicción Machine Learning */}
              <Card className="p-5 bg-background/50 border-muted-foreground/20 flex flex-col justify-between space-y-4 relative overflow-hidden group">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider font-display">
                    Predicción Analítica
                  </p>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 font-display">
                    <Cpu className="h-4.5 w-4.5 text-purple-400" />
                    Machine Learning
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Aplica modelos avanzados de regresión para estimar ventas, o K-Means para segmentar clientes en grupos homogéneos de forma visual.
                  </p>
                </div>

                <Button 
                  onClick={() => onNavigateToTab('ml')}
                  size="sm" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  Entrenar Modelo ML
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Card>

              {/* Flujo de Valor de Datos (Storytelling Pipeline) */}
              <Card className="md:col-span-3 p-5 bg-background/50 border-muted-foreground/20 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-display flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Ciclo de Vida y Flujo de Valor de tus Datos
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Cómo viaja la información desde la ingesta hasta el impacto estratégico en tu negocio.
                  </p>
                </div>
                
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-muted/10 border border-muted-foreground/5 overflow-x-auto">
                  {/* Nodo 1: Ingesta */}
                  <div className="flex flex-col items-center text-center space-y-1.5 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 min-w-[150px] w-full lg:w-auto">
                    <Database className="h-6 w-6 text-blue-400" />
                    <span className="text-xs font-bold text-foreground">1. Ingesta</span>
                    <span className="text-[9px] text-muted-foreground max-w-[130px]">
                      {dataContext.filename || 'Archivo'} cargado con {dataContext.rowCount} registros.
                    </span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 hidden lg:block" />

                  {/* Nodo 2: Limpieza */}
                  <div className="flex flex-col items-center text-center space-y-1.5 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 min-w-[150px] w-full lg:w-auto">
                    <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">2. Limpieza</span>
                    <span className="text-[9px] text-muted-foreground max-w-[130px]">
                      Puntuación de {quality.qualityScore}% de integridad.
                    </span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 hidden lg:block" />

                  {/* Nodo 3: Modelado ML */}
                  <div className="flex flex-col items-center text-center space-y-1.5 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 min-w-[150px] w-full lg:w-auto">
                    <Cpu className="h-6 w-6 text-purple-400" />
                    <span className="text-xs font-bold text-foreground">3. Modelado</span>
                    <span className="text-[9px] text-muted-foreground max-w-[130px]">
                      Algoritmos de ML listos para segmentación/regresión.
                    </span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 hidden lg:block" />

                  {/* Nodo 4: Resolución */}
                  <div className="flex flex-col items-center text-center space-y-1.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 min-w-[150px] w-full lg:w-auto">
                    <Target className="h-6 w-6 text-emerald-400" />
                    <span className="text-xs font-bold text-foreground">4. Resolución</span>
                    <span className="text-[9px] text-muted-foreground max-w-[130px]">
                      {businessGoals.length} planes estratégicos ejecutables.
                    </span>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
