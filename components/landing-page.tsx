'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChartColumn, Brain, Zap, MessageSquare, Upload, FileJson, LogOut, LayoutDashboard, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/app/providers';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, loginAsGuest, logout, user } = useAuthContext();
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsRegisteredUser(localStorage.getItem('datamind_registered_user') === 'true');
    }
  }, []);

  const handleGuestAccess = async () => {
    try {
      if (!isAuthenticated) {
        await loginAsGuest();
      }
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

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
      icon: ChartColumn,
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
      className="min-h-screen bg-linear-to-br from-background via-background to-blue-950/20"
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
            <div className="p-2 rounded-lg bg-linear-to-br from-blue-600 to-blue-400">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              DataMind
            </h1>
          </div>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-muted/30 px-3 py-1.5 rounded-full border border-muted-foreground/10">
                  <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                  {user?.isAnonymous ? 'Invitado' : user?.email}
                </span>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 font-semibold"
                >
                  Ir al Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
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
          {isAuthenticated ? (
            <>
              <h2 className="text-5xl sm:text-6xl font-bold font-display text-foreground mb-6 leading-tight">
                ¡Hola de nuevo,{' '}
                <span className="bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Usuario')}!
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Tu workspace inteligente está listo. Sigue depurando, ordenando y explorando tus datasets con el poder de la IA.
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-6 h-auto rounded-lg bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 text-base sm:text-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Ir al Dashboard
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="px-8 py-6 h-auto rounded-lg border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 text-base sm:text-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </Button>
              </motion.div>
            </>
          ) : isRegisteredUser ? (
            <>
              <h2 className="text-5xl sm:text-6xl font-bold font-display text-foreground mb-6 leading-tight">
                ¡Bienvenido de vuelta a{' '}
                <span className="bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  DataMind!
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Inicia sesión para volver a acceder a tu historial de datasets y tus conversaciones personalizadas con la IA.
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="px-8 py-6 h-auto rounded-lg bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 text-base sm:text-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  Iniciar Sesión
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleGuestAccess}
                  variant="outline"
                  className="px-8 py-6 h-auto rounded-lg border-blue-500/30 text-blue-400 hover:bg-blue-950/20 text-base sm:text-lg transition-all cursor-pointer"
                >
                  Probar como Invitado
                </Button>
              </motion.div>
            </>
          ) : (
            <>
              <h2 className="text-5xl sm:text-6xl font-bold font-display text-foreground mb-6 leading-tight">
                Tu Analista de Datos
                <span className="block bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
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
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  onClick={handleGuestAccess}
                  className="px-8 py-6 h-auto rounded-lg bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 text-base sm:text-lg transition-all cursor-pointer"
                >
                  Comenzar Gratis (Invitado)
                </Button>
                <Button
                  onClick={() => router.push('/auth/register')}
                  variant="outline"
                  className="px-8 py-6 h-auto rounded-lg border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 text-base sm:text-lg transition-all cursor-pointer"
                >
                  Registrarse
                </Button>
              </motion.div>
            </>
          )}
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
          <div className="inline-block p-8 rounded-2xl border border-muted-foreground/20 bg-linear-to-br from-blue-600/10 to-blue-400/5 backdrop-blur-sm">
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
