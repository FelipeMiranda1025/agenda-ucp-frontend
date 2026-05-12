/**
 * LoginDialog.tsx
 * ─────────────────────────────────────────────────────────────
 * Diálogo principal de inicio de sesión con recuperación
 * de contraseña directa (sin modal).
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, User, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import ucpLogoWhite from '@/assets/ucp-logo-white.png';

// ─── Constantes de rate limiting del lado cliente ──────────────────────────
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_SECONDS     = 30;

// ─── Validadores ───────────────────────────────────────────────────────────

function getUsernameError(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Ingresa tu cédula o correo institucional.';
  if (/^\d+$/.test(trimmed)) {
    return trimmed.length >= 6 ? '' : 'La cédula debe tener mínimo 6 dígitos.';
  }
  return trimmed.toLowerCase().endsWith('@ucp.edu.co')
    ? ''
    : 'El correo debe terminar con @ucp.edu.co';
}

function getPasswordError(value: string): string {
  if (value.length < 8) return 'Mínimo 8 caracteres.';
  if (!/[A-Z]/.test(value)) return 'Incluye al menos una mayúscula.';
  if (!/[a-z]/.test(value)) return 'Incluye al menos una minúscula.';
  if (!/[0-9]/.test(value)) return 'Incluye al menos un número.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Incluye al menos un carácter especial (@ - $ ! #).';
  return '';
}

// ─── Componente principal ──────────────────────────────────────────────────

export const LoginDialog: React.FC = () => {
  const { login } = useAuth();

  const [username,      setUsername]      = useState('');
  const [password,      setPassword]      = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError,   setServerError]   = useState('');
  const [loading,       setLoading]       = useState(false);

  // Recuperación directa
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Rate limiting login
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const lockoutInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lockoutUntil === null) return;
    const tick = () => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutCountdown(0);
        if (lockoutInterval.current) clearInterval(lockoutInterval.current);
      } else {
        setLockoutCountdown(remaining);
      }
    };
    tick();
    lockoutInterval.current = setInterval(tick, 1000);
    return () => {
      if (lockoutInterval.current) clearInterval(lockoutInterval.current);
    };
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  // ── Login ─────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setServerError('');
    setForgotSuccess('');

    if (isLockedOut) return;

    const trimmedUser = username.trim();
    const userError   = getUsernameError(trimmedUser);
    const pwdError    = getPasswordError(password);

    if (userError) { setUsernameError(userError); }
    if (pwdError)  { setPasswordError(pwdError);  }
    if (userError || pwdError) return;

    setLoading(true);
    const result = await login(trimmedUser, password);
    setLoading(false);

    if (!result.success) {
      setServerError(result.error || 'Credenciales inválidas. Intente nuevamente.');
      setPassword('');
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setFailedAttempts(0);
      }
    } else {
      setFailedAttempts(0);
    }
  };

  // ── Recuperación directa ──────────────────────────────────

  const handleForgotPassword = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError('Ingresa tu cédula o correo institucional primero.');
      return;
    }
    const idError = getUsernameError(trimmed);
    if (idError) {
      setUsernameError(idError);
      return;
    }

    setForgotSuccess('');
    setForgotSending(true);

    try {
      await api.post('/auth/forgot-password', { identifier: trimmed });
      setForgotSuccess('ÉXITO!\n\nSe ha enviado la contraseña al correo institucional registrado.');
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('429')) {
        setServerError('Demasiados intentos. Espera unos minutos.');
      } else {
        setServerError('No se pudo procesar la solicitud. Intenta nuevamente.');
      }
    } finally {
      setForgotSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-background rounded-2xl shadow-2xl border overflow-hidden">

        {/* Encabezado institucional */}
        <div className="bg-primary px-6 py-8 flex flex-col items-center gap-3">
          <img src={ucpLogoWhite} alt="Logo UCP" className="h-16 w-auto object-contain" />
          <h2 className="text-primary-foreground text-xl font-bold text-center">
            Sistema de Gestión de Agenda Docente
          </h2>
          <p className="text-primary-foreground/70 text-sm text-center">
            Universidad Católica de Pereira
          </p>
        </div>

        {/* Formulario de login */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Número de cédula o correo institucional
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Ej: 1234567890 o correo@ucp.edu.co"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                  setServerError('');
                  setForgotSuccess('');
                }}
                className="pl-10"
                autoComplete="username"
                autoFocus
                maxLength={100}
              />
            </div>
            {usernameError && (
              <p className="text-sm text-destructive text-left">{usernameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setServerError('');
                }}
                className="pl-10"
                autoComplete="current-password"
                maxLength={128}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive text-left">{passwordError}</p>
            )}
          </div>

          {/* Olvidé mi contraseña */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotSending}
              className="text-sm text-primary hover:underline focus:outline-none disabled:opacity-50"
            >
              {forgotSending ? 'Enviando...' : 'Olvidé mi contraseña'}
            </button>
          </div>

          {/* Éxito */}
          {forgotSuccess && (
            <p className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-center dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 whitespace-pre-line">
              {forgotSuccess}
            </p>
          )}

          {/* Error */}
          {serverError && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          {isLockedOut && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-md px-3 py-2 text-center">
              Demasiados intentos fallidos. Intente de nuevo en {lockoutCountdown}s.
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={loading || isLockedOut || forgotSending}
          >
            {loading ? 'Verificando...' : isLockedOut ? `Bloqueado (${lockoutCountdown}s)` : 'Iniciar Sesión'}
          </Button>

        </form>
      </div>
    </div>
  );
};