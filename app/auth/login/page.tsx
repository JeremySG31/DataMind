import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - DataMind',
  description: 'Accede a tu cuenta en DataMind',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">DataMind</h1>
          <p className="text-slate-400">Analista de Datos Inteligente con IA</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
