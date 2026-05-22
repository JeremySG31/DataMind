'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CircleAlert, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error: authError } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      triggerShake();
      return;
    }

    try {
      await register(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      triggerShake();
    }
  };

  // Validaciones en tiempo real para password
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={shake ? { x: [-10, 10, -10, 10, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      transition={{ 
        x: { duration: 0.4, ease: "easeInOut" },
        default: { duration: 0.5 }
      }}
      className="w-full max-w-md p-8 rounded-2xl bg-background/50 border border-muted-foreground/10 backdrop-blur-md shadow-xl hover:border-blue-500/20 transition-all duration-300 relative overflow-hidden"
    >
      {/* Glow Effects inside card */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="mb-6 relative z-10">
        <h2 className="text-2xl font-bold text-foreground">Crear Cuenta</h2>
        <p className="text-sm text-muted-foreground mt-1">Únete a DataMind y comienza a analizar datos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {(error || authError) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20"
          >
            <CircleAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error || authError}</p>
          </motion.div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-muted-foreground/90">
            Correo Electrónico
          </label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="bg-background/50 border-muted-foreground/15 text-foreground placeholder-muted-foreground/40 focus:border-blue-500/50 focus-visible:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-muted-foreground/90">
            Contraseña
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-background/50 border-muted-foreground/15 text-foreground placeholder-muted-foreground/40 focus:border-blue-500/50 focus-visible:ring-blue-500/20 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password strength dynamic checklist */}
          {password && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1.5 pt-1.5 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>Mínimo 6 caracteres</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasNumber ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
                <span>Contiene al menos un número</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground/90">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="bg-background/50 border-muted-foreground/15 text-foreground placeholder-muted-foreground/40 focus:border-blue-500/50 focus-visible:ring-blue-500/20 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Confirm match checklist */}
          {confirmPassword && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-1.5 pt-1 text-xs"
            >
              {passwordsMatch ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500/90 font-medium">Las contraseñas coinciden</span>
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-500/90 font-medium">Las contraseñas no coinciden</span>
                </>
              )}
            </motion.div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Creando cuenta...
            </>
          ) : (
            'Crear Cuenta'
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground pt-2">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="text-blue-400 hover:text-blue-300 hover:underline font-semibold cursor-pointer transition-colors"
          >
            Inicia sesión aquí
          </button>
        </div>
      </form>
    </motion.div>
  );
}
