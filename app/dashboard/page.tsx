'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { Dashboard } from '@/components/dashboard';
import { DataUpload } from '@/components/data-upload';
import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import { Loader2, Database, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuthContext();
  const { dataContext, isLoading: analysisLoading, error, uploadData, clearData } = useDataAnalysis();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/60">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-muted-foreground/10 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400">
              <span className="font-bold text-white text-lg">DM</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              DataMind Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-muted-foreground/10">
              <UserCheck className="h-4 w-4 text-blue-400" />
              <span>{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
        {!dataContext ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto py-12">
            <div className="text-center mb-8">
              <Database className="h-16 w-16 text-blue-500/80 mx-auto mb-4" />
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
                Carga tus datos
              </h2>
              <p className="mt-3 text-lg text-muted-foreground text-center">
                Sube un archivo CSV o Excel para comenzar el análisis automático e interactuar con el chat de inteligencia artificial.
              </p>
            </div>
            <DataUpload
              onUpload={uploadData}
              isLoading={analysisLoading}
              error={error}
            />
          </div>
        ) : (
          <Dashboard
            dataContext={dataContext}
            onClear={clearData}
            isGuest={user?.isAnonymous || false}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-muted-foreground/10 bg-background/50 backdrop-blur-sm py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          <p>DataMind - Análisis de datos inteligente • Potenciado por OpenRouter y React</p>
        </div>
      </footer>
    </div>
  );
}
