'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Brain, Zap, MessageSquare, Upload, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/app/providers';

export function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  const features = [
    {
      icon: Upload,
      title: 'Carga Fácil',
      description: 'Arrastra y suelta tus archivos CSV para empezar al instante',
    },
    {
      icon: Brain,
      title: 'Análisis IA',
      description: 'Obtén insights automáticos impulsados por inteligencia artificial',
    },
    {
      icon: BarChart3,
      title: 'Visualizaciones',
      description: 'Gráficos interactivos que se adaptan a tus datos automáticamente',
    },
    {
      icon: MessageSquare,
      title: 'Chat Inteligente',
      description: 'Haz preguntas en lenguaje natural y obtén respuestas instantáneas',
    },
    {
      icon: FileJson,
      title: 'Formatos Flexibles',
      description: 'Soporta CSV y otros formatos de datos comunes',
    },
    {
      icon: Zap,
      title: 'Súper Rápido',
      description: 'Análisis en tiempo real sin necesidad de esperar',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-muted-foreground/10 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              DataMind
            </h1>
          </div>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ir al Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/auth/login')}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
            Tu Analista de Datos
            <span className="block bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Impulsado por IA
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Carga datos, haz preguntas en lenguaje natural y obtén insights valiosos al instante.
            Sin configuraciones complicadas, sin curva de aprendizaje.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block"
          >
            <div className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold cursor-default">
              Comienza cargando un archivo CSV
            </div>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="group p-6 rounded-xl border border-muted-foreground/10 bg-background/50 hover:bg-background/80 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="p-3 rounded-lg bg-blue-600/10 w-fit mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-block p-8 rounded-2xl border border-muted-foreground/20 bg-gradient-to-br from-blue-600/10 to-blue-400/5 backdrop-blur-sm">
            <p className="text-foreground mb-4">
              🚀 Completamente gratis. Potenciado por IA abierta.
            </p>
            <p className="text-sm text-muted-foreground">
              Usa OpenRouter para acceso a múltiples modelos de IA sin costo
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="border-t border-muted-foreground/10 mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-muted-foreground">
          <p>Construido con React, Next.js y OpenRouter</p>
        </div>
      </motion.footer>
    </motion.div>
  );
}
