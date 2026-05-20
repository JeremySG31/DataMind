import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';
import { Brain } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - DataMind',
  description: 'Accede a tu cuenta en DataMind',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        <div className="text-center flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 w-fit mb-4 shadow-lg shadow-blue-500/20">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent tracking-tight mb-2">
            DataMind
          </h1>
          <p className="text-muted-foreground text-base">Analista de Datos Inteligente con IA</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
