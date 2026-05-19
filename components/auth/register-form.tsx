'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error: authError } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await register(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-950/70 border border-zinc-800/40 backdrop-blur-sm shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Crear Cuenta</h2>
        <p className="text-sm text-zinc-400 mt-1">Únete a DataMind y comienza a analizar datos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || authError) && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error || authError}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-300">
            Correo Electrónico
          </label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="bg-zinc-900/50 border-zinc-850 text-white placeholder-zinc-500 focus:border-zinc-700"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-300">
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="bg-zinc-900/50 border-zinc-850 text-white placeholder-zinc-500 focus:border-zinc-700"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-medium text-zinc-300">
            Confirmar Contraseña
          </label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="bg-zinc-900/50 border-zinc-850 text-white placeholder-zinc-500 focus:border-zinc-700"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2 rounded-lg transition-colors cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
              Creando cuenta...
            </>
          ) : (
            'Crear Cuenta'
          )}
        </Button>

        <div className="text-center text-sm text-zinc-400 pt-2">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="text-white hover:underline font-medium cursor-pointer"
          >
            Inicia sesión aquí
          </button>
        </div>
      </form>
    </div>
  );
}
