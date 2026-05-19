import { RegisterForm } from '@/components/auth/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta - DataMind',
  description: 'Regístrate en DataMind',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-2">DataMind</h1>
          <p className="text-slate-400 text-lg">Analista de Datos Inteligente con IA</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
