import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, User, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ucpLogoWhite from '@/assets/ucp-logo-white.png';

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

function getUsernameError(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Mínimo de 6 caracteres';
  // Solo dígitos → cédula
  if (/^\d+$/.test(trimmed)) {
    return trimmed.length >= 6 ? '' : 'Mínimo de 6 caracteres';
  }
  // Tiene letras o caracteres especiales (junto con o sin números) → correo
  return trimmed.endsWith('@ucp.edu.co') ? '' : 'El correo debe de terminar con @ucp.edu.co';
}

function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

export const LoginDialog: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  // Recuperar contraseña
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotIdentifierError, setForgotIdentifierError] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Rate limiting
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const lockoutInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lockout countdown timer
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

  const handleForgotPassword = () => {
    setForgotOpen(true);
    setForgotIdentifier('');
    setForgotIdentifierError('');
    setForgotError('');
    setForgotSuccess('');
  };

  const handleSendForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotIdentifierError('');

    const trimmed = forgotIdentifier.trim();
    const idError = getUsernameError(trimmed);
    if (idError) {
      setForgotIdentifierError(idError);
      return;
    }

    setForgotSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'request-password-reset',
        { body: { identifier: trimmed } }
      );

      if (error || (data && (data as any).error)) {
        setForgotError(
          ((data as any)?.error as string) ||
            'Intenta nuevamente.'
        );
      } else {
        setForgotOpen(false);
        setForgotSuccess('Se envió la nueva contraseña al correo');
      }
    } catch {
      setForgotError('Intenta nuevamente.');
    } finally {
      setForgotSending(false);
    }
  };

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  const getPasswordError = (pwd: string): string => {
    if (pwd.length < 8) return 'Mínimo de 8 caracteres.';
    if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd)) {
      return 'Incluye mayúsculas, minúsculas, números y carácter especial (@ - $)';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setServerError('');

    if (isLockedOut) return;

    const trimmedUser = username.trim();
    let hasError = false;

    // Validate username
    const userError = getUsernameError(trimmedUser);
    if (userError) {
      setUsernameError(userError);
      hasError = true;
    }

    // Validate password
    const pwdError = getPasswordError(password);
    if (pwdError) {
      setPasswordError(pwdError);
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    const result = await login(trimmedUser, password);
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
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-background rounded-2xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-8 flex flex-col items-center gap-3">
          <img src={ucpLogoWhite} alt="Logo UCP" className="h-16 w-auto object-contain" />
          <h2 className="text-primary-foreground text-xl font-bold text-center">
            Sistema de Gestión de Agenda Docente
          </h2>
          <p className="text-primary-foreground/70 text-sm text-center">
            Universidad Católica de Pereira
          </p>
        </div>

        {/* Form */}
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
                }}
                className="pl-10"
                autoComplete="username"
                autoFocus
                maxLength={50}
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

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-primary hover:underline"
            >
              Olvidé mi contraseña
            </button>
          </div>

          {forgotSuccess && (
            <p className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-center dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800">
              {forgotSuccess}
            </p>
          )}

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
            disabled={loading || isLockedOut}
          >
            {loading ? 'Verificando...' : isLockedOut ? `Bloqueado (${lockoutCountdown}s)` : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border overflow-hidden">
            <div className="bg-primary px-6 py-5 flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary-foreground" />
              <h3 className="text-primary-foreground text-lg font-semibold">
                Recuperar contraseña
              </h3>
            </div>

            <form onSubmit={handleSendForgot} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresa tu cédula o correo institucional. Enviaremos una contraseña
                temporal al correo registrado en el sistema.
              </p>

              <div className="space-y-2">
                <Label htmlFor="forgotIdentifier" className="text-sm font-medium">
                  Cédula o correo institucional
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgotIdentifier"
                    type="text"
                    placeholder="Ej: 1234567890 o correo@ucp.edu.co"
                    value={forgotIdentifier}
                    onChange={(e) => {
                      setForgotIdentifier(e.target.value);
                      setForgotIdentifierError('');
                      setForgotError('');
                    }}
                    className="pl-10"
                    autoFocus
                    maxLength={100}
                    disabled={forgotSending}
                  />
                </div>
                {forgotIdentifierError && (
                  <p className="text-sm text-destructive text-left">
                    {forgotIdentifierError}
                  </p>
                )}
              </div>

              {forgotError && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-md px-3 py-2">
                  {forgotError}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setForgotOpen(false)}
                  disabled={forgotSending}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={forgotSending}
                >
                  {forgotSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar contraseña temporal'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
