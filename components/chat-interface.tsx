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
  CircleCheckBig 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const findActualKey = (suggestedKey: string, availableColumns: string[]): string => {
  if (!suggestedKey) return '';
  // 1. Coincidencia exacta
  if (availableColumns.includes(suggestedKey)) return suggestedKey;
  
  // 2. Coincidencia sin distinguir mayúsculas/minúsculas
  const lowerSuggested = suggestedKey.toLowerCase();
  const caseInsensitiveMatch = availableColumns.find(c => c.toLowerCase() === lowerSuggested);
  if (caseInsensitiveMatch) return caseInsensitiveMatch;
  
  // 3. Coincidencia parcial o de subcadena
  const substringMatch = availableColumns.find(
    c => c.toLowerCase().includes(lowerSuggested) || lowerSuggested.includes(c.toLowerCase())
  );
  if (substringMatch) return substringMatch;
  
  // 4. Fallback a la sugerida
  return suggestedKey;
};

function parseMarkdownToJSX(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const parseInlineStyles = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    
    const regex = /(\*\*|`|\*)(.*?)\1/g;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > currentIdx) {
        parts.push(str.substring(currentIdx, matchIndex));
      }
      
      const type = match[1];
      const content = match[2];
      
      if (type === '**') {
        parts.push(<strong key={matchIndex} className="font-bold text-foreground">{content}</strong>);
      } else if (type === '*') {
        parts.push(<em key={matchIndex} className="italic text-foreground/90">{content}</em>);
      } else if (type === '`') {
        parts.push(
          <code key={matchIndex} className="px-1.5 py-0.5 rounded bg-muted-foreground/10 text-blue-400 font-mono text-xs">
            {content}
          </code>
        );
      }
      
      currentIdx = regex.lastIndex;
    }
    
    if (currentIdx < str.length) {
      parts.push(str.substring(currentIdx));
    }
    
    return parts.length > 0 ? parts : [str];
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 mb-3 space-y-1 text-muted-foreground">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(
        <h4 key={index} className="text-sm font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5 font-display">
          <span className="w-1 h-3 rounded bg-blue-500 inline-block" />
          {parseInlineStyles(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(
        <h3 key={index} className="text-base font-extrabold text-foreground mt-4 mb-2 font-display">
          {parseInlineStyles(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList(index);
      elements.push(
        <h2 key={index} className="text-lg font-black text-foreground mt-4 mb-2 font-display">
          {parseInlineStyles(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(
        <li key={index} className="text-sm leading-relaxed text-foreground/80">
          {parseInlineStyles(trimmed.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList(index);
      const content = trimmed.replace(/^\d+\.\s/, '');
      const num = trimmed.match(/^\d+/)?.[0] || '1';
      elements.push(
        <div key={index} className="flex gap-2 text-sm leading-relaxed text-foreground/85 mb-2 pl-1">
          <span className="font-bold text-blue-400 shrink-0">{num}.</span>
          <div>{parseInlineStyles(content)}</div>
        </div>
      );
    } else if (trimmed === '') {
      flushList(index);
    } else {
      flushList(index);
      elements.push(
        <p key={index} className="text-sm leading-relaxed text-foreground/85 mb-2.5">
          {parseInlineStyles(line)}
        </p>
      );
    }
  });

  flushList(lines.length);
  return <div className="space-y-1">{elements}</div>;
}

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

    // Limit message length client-side (matches server Zod schema)
    if (questionText.length > 2000) {
      const truncationMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Tu mensaje es demasiado largo (máximo 2000 caracteres). Por favor, resúmelo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, truncationMsg]);
      return;
    }

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
      // ────────────────────────────────────────────────────────
      // Compact data summary: avoid sending the full dataset.
      // We send a 50-row sample + per-column statistics so the
      // API always gets a payload well under 50 KB, regardless
      // of how big the actual dataset is.
      // ────────────────────────────────────────────────────────
      const MAX_SAMPLE = 50;
      const sample = data.length > MAX_SAMPLE
        ? data.filter((_, i) => i % Math.ceil(data.length / MAX_SAMPLE) === 0).slice(0, MAX_SAMPLE)
        : data;

      // Build compact per-column stats for the AI context
      const colStats: Record<string, any> = {};
      for (const col of columns) {
        const vals = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
        const numVals = vals.filter(v => typeof v === 'number') as number[];
        if (numVals.length > 0) {
          const sorted = [...numVals].sort((a, b) => a - b);
          colStats[col] = {
            type: 'numeric',
            count: numVals.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: Math.round((numVals.reduce((a, b) => a + b, 0) / numVals.length) * 100) / 100,
            nulls: data.length - vals.length,
          };
        } else {
          const unique = new Set(vals.map(String));
          const freq: Record<string, number> = {};
          vals.forEach(v => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
          const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, c]) => `${v}(${c})`);
          colStats[col] = {
            type: 'categorical',
            count: vals.length,
            unique: unique.size,
            top,
            nulls: data.length - vals.length,
          };
        }
      }

      const payload = {
        message: questionText,
        data: sample,
        columns,
        totalRows: data.length,
        columnStats: colStats,
        history: messages.slice(-6), // last 6 messages for context
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText = 'Error al procesar tu pregunta. Por favor intenta de nuevo.';
        try {
          const errorData = await response.json();
          if (response.status === 429) {
            errorText = '⏳ Has enviado demasiados mensajes. Por favor espera un momento antes de continuar.';
          } else if (errorData.error) {
            errorText = `❌ ${errorData.error}`;
          }
        } catch {
          // If response is not JSON, use the default message
        }
        throw new Error(errorText);
      }

      const result = await response.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'Lo siento, hubo un error procesando tu pregunta. Por favor verifica tu conexión y que el token de OpenRouter esté configurado.',
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
    const resolvedX = findActualKey(xKey, columns);
    const resolvedY = findActualKey(yKey, columns);
    
    // Tomar una muestra representativa (máx 15 registros) para no saturar el gráfico del chat
    return data.slice(0, 15).map(row => ({
      name: String(row[resolvedX] !== undefined ? row[resolvedX] : ''),
      value: typeof row[resolvedY] === 'number' ? row[resolvedY] : parseFloat(String(row[resolvedY])) || 0
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
      <Card className="flex-1 overflow-hidden bg-background/50 border-muted-foreground/20 flex flex-col relative h-125">
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
                        <div className="wrap-break-word space-y-1">
                          {parseMarkdownToJSX(text)}
                        </div>

                        {/* Inline Interactive Chart Rendering */}
                        {chart && chartData.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="mt-4 p-3 bg-slate-950/40 border border-blue-500/20 backdrop-blur-md rounded-xl space-y-2 overflow-hidden shadow-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-foreground/90 flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                                {chart.title}
                              </span>
                              <span className="text-[9px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                Visualización IA
                              </span>
                            </div>
                            <div className="h-45 w-full mt-2">
                              {chart.chartType === 'line' && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <defs>
                                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <ChartTooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(15,23,42,0.95)',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                      }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#areaGradient)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )}
                              {chart.chartType === 'bar' && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <defs>
                                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.2}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
                                    <ChartTooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(15,23,42,0.95)',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                      }}
                                    />
                                    <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
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
                                        backgroundColor: 'rgba(15,23,42,0.95)',
                                        border: '1px solid rgba(59,130,246,0.2)',
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
