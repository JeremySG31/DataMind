'use client';

import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import { DataUpload } from './data-upload';
import { Dashboard } from './dashboard';
import { LandingPage } from './landing-page';
import { motion, AnimatePresence } from 'framer-motion';

export function AppContainer() {
  const { dataContext, isLoading, error, uploadData, clearData } = useDataAnalysis();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barra superior */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b border-muted-foreground/10 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400">
                <span className="font-bold text-white text-lg">DM</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                DataMind
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Análisis de datos inteligente
            </p>
          </div>
        </div>
      </motion.header>

      {/* Contenido principal */}
      <div className="min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {!dataContext ? (
            <motion.main
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="min-h-[calc(100vh-80px)]"
            >
              <LandingPage />

              {/* Upload Section */}
              <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold mb-8 text-center">
                    Comienza aquí
                  </h2>
                  <DataUpload
                    onUpload={uploadData}
                    isLoading={isLoading}
                    error={error}
                  />
                </motion.div>
              </section>
            </motion.main>
          ) : (
            <motion.main
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
              <Dashboard
                dataContext={dataContext}
                onClear={clearData}
              />
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="border-t border-muted-foreground/10 bg-background/50 backdrop-blur-sm mt-auto"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <p>DataMind - Análisis de datos impulsado por IA</p>
            <p className="mt-2 sm:mt-0">
              Potenciado por OpenRouter y React
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
