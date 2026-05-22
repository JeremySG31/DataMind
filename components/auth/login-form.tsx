'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CircleAlert, Loader2, Eye, EyeOff, ArrowLeft, CircleCheckBig } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoginForm() {
  const router = useRouter();
  const { 
    login, 
    loginAsGuest, 
    loginWithGoogle, 
    sendPasswordReset,
    isLoading, 
    error: authError 
  } = useAuthContext();
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password States
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      triggerShake();
      return;
    }

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      triggerShake();
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetEmail) {
      setError('Por favor ingresa tu correo electrónico');
      triggerShake();
      return;
    }

    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message);
      triggerShake();
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      triggerShake();
    }
  };



  const handleGuestLogin = async () => {
    setError(null);
    try {
      await loginAsGuest();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      triggerShake();
    }
  };

  // Mapear errores de Firebase a mensajes más amigables
  const getFriendlyError = (err: string | null) => {
    if (!err) return null;
    const errStr = String(err);
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'datamind-app-31';
    if (errStr.includes('auth/unauthorized-domain')) {
      return (
        <div className="space-y-1 text-left">
          <p className="font-semibold">Dominio no autorizado en Firebase</p>
          <p className="text-xs opacity-90 leading-relaxed">
            Este dominio donde corre tu app no está autorizado en tu consola de Firebase para inicios de sesión.
          </p>
          <div className="text-xs pl-1 pt-1 space-y-1 opacity-90">
            <p><strong>Cómo solucionarlo:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Abre la <a href={`https://console.firebase.google.com/project/${projectId}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">Consola de Firebase</a>.</li>
              <li>Ve a <strong>Authentication &gt; Configuración &gt; Dominios autorizados</strong>.</li>
              <li>Añade tu dominio actual (ej: <code>localhost</code>, o el dominio donde esté publicada la web).</li>
            </ol>
          </div>
        </div>
      );
    }
    if (errStr.includes('auth/operation-not-allowed')) {
      return (
        <div className="space-y-1 text-left">
          <p className="font-semibold">Proveedor no habilitado en Firebase</p>
          <p className="text-xs opacity-90 leading-relaxed">
            El inicio de sesión con este proveedor (Google o GitHub) está deshabilitado en tu consola de Firebase.
          </p>
          <div className="text-xs pl-1 pt-1 space-y-1 opacity-90">
            <p><strong>Cómo solucionarlo:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Abre la <a href={`https://console.firebase.google.com/project/${projectId}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">Consola de Firebase (Sign-in method)</a>.</li>
              <li>Haz clic en <strong>Agregar nuevo proveedor</strong> (si no lo has añadido).</li>
              <li>Selecciona <strong>Google</strong> (o GitHub), actívalo (con tu correo de soporte) y haz clic en <strong>Guardar</strong>.</li>
            </ol>
          </div>
        </div>
      );
    }
    if (errStr.includes('auth/invalid-credential') || errStr.includes('auth/user-not-found') || errStr.includes('auth/wrong-password')) {
      return 'Correo o contraseña incorrectos';
    }
    if (errStr.includes('auth/popup-closed-by-user')) {
      return 'Inicio de sesión cancelado';
    }
    if (errStr.includes('auth/popup-blocked')) {
      return (
        <div className="space-y-1 text-left">
          <p className="font-semibold">Ventana emergente bloqueada</p>
          <p className="text-xs opacity-90 leading-relaxed">
            Tu navegador ha bloqueado la ventana emergente de Google.
          </p>
          <div className="text-xs pl-1 pt-1 space-y-1 opacity-90">
            <p><strong>Cómo solucionarlo:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Busca el icono de "Ventanas emergentes bloqueadas" en la barra de direcciones (arriba a la derecha).</li>
              <li>Haz clic y selecciona <strong>"Permitir siempre ventanas emergentes"</strong> para este sitio.</li>
              <li>Vuelve a intentar iniciar sesión.</li>
            </ol>
          </div>
        </div>
      );
    }
    return errStr;
  };

  const activeError = error || authError;

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

      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div
            key="login-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-foreground">Iniciar Sesión</h2>
              <p className="text-sm text-muted-foreground mt-1">Accede a tu cuenta en DataMind</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {activeError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20"
                >
                  <CircleAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex-1">{getFriendlyError(activeError)}</div>
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
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-muted-foreground/90">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError(null);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
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
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>

              <div className="flex items-center gap-4 my-2">
                <div className="h-[1px] flex-1 bg-muted-foreground/10" />
                <span className="text-[10px] uppercase text-muted-foreground/60 font-bold tracking-wider">o</span>
                <div className="h-[1px] flex-1 bg-muted-foreground/10" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-background/30 hover:bg-muted-foreground/5 border-muted-foreground/10 text-foreground cursor-pointer flex items-center justify-center gap-2 hover:border-blue-500/30 transition-all duration-300 py-2.5 rounded-lg font-medium"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Iniciar sesión con Google
              </Button>

              <Button
                type="button"
                className="w-full bg-transparent hover:bg-blue-950/20 border border-blue-500/30 text-blue-400 font-medium py-2.5 rounded-lg transition-all cursor-pointer mt-2"
                onClick={handleGuestLogin}
                disabled={isLoading}
              >
                Entrar como Invitado (Modo Demo)
              </Button>

              <div className="text-center text-sm text-muted-foreground pt-2">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth/register')}
                  className="text-blue-400 hover:text-blue-300 hover:underline font-semibold cursor-pointer transition-colors"
                >
                  Regístrate aquí
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="forgot-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError(null);
                  setResetSent(false);
                }}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer mb-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver a Iniciar Sesión
              </button>
              <h2 className="text-2xl font-bold text-foreground">Recuperar Contraseña</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Te enviaremos un correo para que puedas restablecerla.
              </p>
            </div>

            {resetSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center py-4 relative z-10"
              >
                <div className="inline-flex items-center justify-center p-3 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 mb-2">
                  <CircleCheckBig className="h-8 w-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">¡Correo enviado con éxito!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Hemos enviado las instrucciones de recuperación a: <br />
                  <strong className="text-blue-400">{resetEmail}</strong>. <br />
                  Revisa tu bandeja de entrada y la carpeta de spam.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                    setResetSent(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg cursor-pointer"
                >
                  Volver al Login
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4 relative z-10">
                {activeError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20"
                  >
                    <CircleAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-sm flex-1">{getFriendlyError(activeError)}</div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label htmlFor="resetEmail" className="text-sm font-medium text-muted-foreground/90">
                    Correo Electrónico
                  </label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="tu@correo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-background/50 border-muted-foreground/15 text-foreground placeholder-muted-foreground/40 focus:border-blue-500/50 focus-visible:ring-blue-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Enviando enlace...
                    </>
                  ) : (
                    'Enviar Enlace de Recuperación'
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
