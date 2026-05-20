'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatMessage, DataRow } from '@/lib/types';
import { 
  Loader2, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  HelpCircle, 
  BrainCircuit, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface ChatInterfaceProps {
  data: DataRow[];
  columns: string[];
  initialQuestion?: string | null;
  onClearQuestion?: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ParsedMessage {
  text: string;
  chart: {
    chartType: 'bar' | 'line' | 'scatter' | 'pie';
    x: string;
    y: string;
    title: string;
  } | null;
}

export function ChatInterface({ data, columns, initialQuestion, onClearQuestion }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const steps = [
    '🔍 Analizando columnas del dataset...',
    '📊 Evaluando correlaciones y tendencias...',
    '🤖 Estructurando insights financieros...',
    '📈 Creando representación visual...'
  ];

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Manejo de carga animada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Manejo de pregunta inicial desde el hub
  useEffect(() => {
    if (initialQuestion) {
      setInput(initialQuestion);
      submitQuestion(initialQuestion);
      if (onClearQuestion) {
        onClearQuestion();
      }
    }
  }, [initialQuestion]);

  const submitQuestion = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: questionText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: questionText,
          data,
          columns,
          history: messages,
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta');

      const result = await response.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error procesando tu pregunta. Por favor verifica tu conexión y que el token de OpenRouter esté configurado.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(input);
  };

  const parseMessageContent = (content: string): ParsedMessage => {
    const regex = /```json\s*(\{[\s\S]*?\})\s*```/g;
    const match = regex.exec(content);
    
    if (match) {
      try {
        const jsonStr = match[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === 'chart') {
          const textWithoutJson = content.replace(regex, '').trim();
          return {
            text: textWithoutJson,
            chart: {
              chartType: parsed.chartType,
              x: parsed.x,
              y: parsed.y,
              title: parsed.title,
            }
          };
        }
      } catch (e) {
        console.error('Error al parsear el JSON del gráfico:', e);
      }
    }
    
    return {
      text: content,
      chart: null
    };
  };

  const getChartData = (xKey: string, yKey: string) => {
    // Tomar una muestra representativa (máx 15 registros) para no saturar el gráfico del chat
    return data.slice(0, 15).map(row => ({
      name: String(row[xKey] || ''),
      value: typeof row[yKey] === 'number' ? row[yKey] : parseFloat(String(row[yKey])) || 0
    }));
  };

  const getSuggestions = () => {
    const cols = columns.map(c => c.toLowerCase());
    const list = ['Genera un resumen analítico de este dataset.'];
    
    if (cols.some(c => c.includes('venta') || c.includes('ingreso') || c.includes('monto'))) {
      list.push('¿Cuáles son los productos o filas que aportan más ingresos?');
    } else {
      list.push('Encuentra las 3 correlaciones más importantes de los datos.');
    }

    list.push('Identifica anomalías o variabilidades inusuales.');
    return list;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Área de mensajes */}
      <Card className="flex-1 overflow-hidden bg-background/50 border-muted-foreground/20 flex flex-col relative h-[500px]">
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
              <div className="p-3.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-pulse">
                <BrainCircuit className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Asistente Analítico Inteligente</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Haz preguntas libres sobre tu dataset. Puedo calcular promedios, correlaciones, tendencias e incluso renderizar gráficos interactivos directamente en nuestra conversación.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const { text, chart } = isUser ? { text: msg.content, chart: null } : parseMessageContent(msg.content);
                const chartData = chart ? getChartData(chart.x, chart.y) : [];

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar */}
                    {!isUser && (
                      <div className="h-8 w-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                        <Bot className="h-4.5 w-4.5" />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[85%] sm:max-w-[70%]">
                      {/* Bubble */}
                      <div
                        className={`px-4 py-3 rounded-2xl leading-relaxed text-sm ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/5'
                            : 'bg-muted/80 text-foreground rounded-tl-none border border-muted-foreground/10 backdrop-blur-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line break-words">{text}</p>

                        {/* Inline Interactive Chart Rendering */}
                        {chart && chartData.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="mt-4 p-3 bg-background/80 border border-muted-foreground/15 rounded-xl space-y-2 overflow-hidden shadow-inner"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-foreground/90 flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                                {chart.title}
                              </span>
                              <span className="text-[9px] text-muted-foreground">Recharts Inline</span>
                            </div>
                            <div className="h-[180px] w-full mt-2">
                              {chart.chartType === 'line' && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <ChartTooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.85)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                      }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              )}
                              {chart.chartType === 'bar' && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <ChartTooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.85)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                      }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              )}
                              {chart.chartType === 'pie' && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={chartData}
                                      dataKey="value"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={60}
                                      label={({ name }) => name.slice(0, 8)}
                                    >
                                      {chartData.map((_, idx) => (
                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <ChartTooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.85)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className={`text-[10px] text-muted-foreground mt-1 block px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {isUser && (
                      <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
                        <User className="h-4.5 w-4.5" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* 🔍 HACKER THINKING TERMINAL LOGS */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start items-center gap-2.5 p-3 bg-muted/40 border border-muted-foreground/15 rounded-xl max-w-xs text-xs text-blue-400 font-mono shadow-sm"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-blue-400" />
              <span className="animate-pulse">{steps[loadingStep]}</span>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Sugerencias en Chips */}
        {messages.length === 0 && !isLoading && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2 justify-center">
              {getSuggestions().map((sug, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => submitQuestion(sug)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-[11px] font-medium bg-muted border border-muted-foreground/10 hover:border-blue-500/30 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 shadow-sm"
                >
                  {sug}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Formulario input */}
        <form onSubmit={handleFormSubmit} className="p-4 border-t border-muted-foreground/10 bg-background/30 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre tendencias, nulos o correlaciones..."
              disabled={isLoading}
              className="flex-1 bg-muted/50 border-muted-foreground/15 focus-visible:ring-blue-500 text-sm"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-4 shadow-lg shadow-blue-500/10"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
