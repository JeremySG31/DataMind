'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatMessage, DataRow } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
  data: DataRow[];
  columns: string[];
}

export function ChatInterface({ data, columns }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
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
          message: input,
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
        content: 'Lo siento, hubo un error procesando tu pregunta. Por favor verifica que hayas configurado OPENROUTER_API_KEY.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Área de mensajes */}
      <Card className="flex-1 overflow-hidden mb-4 bg-background/50 border-muted-foreground/20">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <p className="text-muted-foreground mb-2">Hazme preguntas sobre tus datos</p>
                  <p className="text-xs text-muted-foreground/60">
                    Puedo analizar tendencias, comparar valores, encontrar patrones y más
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-muted text-foreground rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <span className={`text-xs mt-1 block ${
                        msg.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                      }`}>
                        {msg.timestamp.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input de chat */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-muted-foreground/10">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre tus datos..."
                disabled={isLoading}
                className="flex-1 bg-muted border-muted-foreground/20"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 px-4"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
