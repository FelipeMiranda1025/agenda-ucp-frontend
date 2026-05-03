/**
 * LoginDialog.tsx
 * ─────────────────────────────────────────────────────────────
 * Diálogo principal de inicio de sesión con modal integrado
 * de recuperación de contraseña ("Olvidé mi contraseña").
 *
 * Cambios en la sección de recuperación:
 *  - Limpieza correcta del estado al cerrar/abrir el modal.
 *  - Mensaje de éxito más claro y consistente con el backend
 *    (el backend ahora siempre devuelve el mismo mensaje).
 *  - Manejo de error HTTP 429 (rate limit) con mensaje amigable.
 *  - Validación del identificador antes de enviar la petición.
 *  - Deshabilitación del botón durante el envío para evitar
 *    doble clic (doble submit).
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, User, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import ucpLogoWhite from '@/assets/ucp-logo-white.png';

// ─── Constantes de rate limiting del lado cliente ──────────────────────────
const MAX_FAILED_ATTEMPTS = 3;   // Intentos fallidos antes del bloqueo
const LOCKOUT_SECONDS     = 30;  // Segundos de bloqueo local

// ─── Validadores ───────────────────────────────────────────────────────────

/**
 * Valida el identificador (cédula o correo @ucp.edu.co).
 * Retorna un mensaje de error o cadena vacía si es válido.
 */
function getUsernameError(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Ingresa tu cédula o correo institucional.';

  // Solo dígitos → cédula
  if (/^\d+$/.test(trimmed)) {
    return trimmed.length >= 6 ? '' : 'La cédula debe tener mínimo 6 dígitos.';
  }

  // Contiene letras → correo institucional
  return trimmed.toLowerCase().endsWith('@ucp.edu.co')
    ? ''
    : 'El correo debe terminar con @ucp.edu.co';
}

/**
 * Valida la contraseña: mínimo 8 caracteres con may/min/número/especial.
 */
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

  // ── Estado del formulario de login ────────────────────────
  const [username,      setUsername]      = useState('');
  const [password,      setPassword]      = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError,   setServerError]   = useState('');
  const [loading,       setLoading]       = useState(false);

  // ── Estado del modal "Olvidé mi contraseña" ───────────────
  const [forgotOpen,            setForgotOpen]            = useState(false);
  const [forgotIdentifier,      setForgotIdentifier]      = useState('');
  const [forgotIdentifierError, setForgotIdentifierError] = useState('');
  const [forgotSending,         setForgotSending]         = useState(false);
  const [forgotError,           setForgotError]           = useState('');
  const [forgotSuccess,         setForgotSuccess]         = useState('');

  // ── Rate limiting del lado cliente (login) ────────────────
  const [failedAttempts,    setFailedAttempts]    = useState(0);
  const [lockoutUntil,      setLockoutUntil]      = useState<number | null>(null);
  const [lockoutCountdown,  setLockoutCountdown]  = useState(0);
  const lockoutInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Temporizador de bloqueo local
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

  // ── Handlers de login ─────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setServerError('');

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

  // ── Handlers del modal de recuperación ───────────────────

  /**
   * Abre el modal reiniciando todo su estado interno.
   * Así no queda "sucio" si el usuario lo cerró a la mitad.
   */
  const handleOpenForgot = () => {
    setForgotIdentifier('');
    setForgotIdentifierError('');
    setForgotError('');
    setForgotSuccess('');
    setForgotSending(false);
    setForgotOpen(true);
  };

  /** Cierra el modal y limpia el estado. */
  const handleCloseForgot = () => {
    if (forgotSending) return; // No cerrar mientras se envía
    setForgotOpen(false);
    setForgotIdentifier('');
    setForgotIdentifierError('');
    setForgotError('');
    setForgotSuccess('');
  };

  /**
   * Envía la solicitud de recuperación de contraseña al backend.
   *
   * El backend siempre responde con el mismo mensaje genérico
   * independientemente de si el usuario existe (anti-enumeración).
   * Aquí mostramos ese mensaje al usuario.
   */
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
      await api.post('/auth/forgot-password', { identifier: trimmed });

      // Éxito: cerrar modal y mostrar mensaje en el formulario principal
      setForgotOpen(false);
      setForgotSuccess(
        'Si el identificador está registrado, recibirás la contraseña temporal en tu correo institucional.'
      );

    } catch (err: unknown) {
      // Manejo específico de error 429 (rate limit del servidor)
      if (err instanceof Error && err.message.includes('429')) {
        setForgotError('Demasiados intentos. Por favor espera unos minutos antes de volver a intentarlo.');
        return;
      }
      // Otros errores del servidor (500, red, etc.)
      setForgotError(
        err instanceof Error
          ? err.message
          : 'No se pudo procesar la solicitud. Intenta nuevamente.'
      );
    } finally {
      // Siempre desactivar el spinner al terminar
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

          {/* Campo: Cédula o correo */}
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
                maxLength={100}
              />
            </div>
            {usernameError && (
              <p className="text-sm text-destructive text-left">{usernameError}</p>
            )}
          </div>

          {/* Campo: Contraseña */}
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

          {/* Enlace "Olvidé mi contraseña" */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleOpenForgot}
              className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
            >
              Olvidé mi contraseña
            </button>
          </div>

          {/* Mensaje de éxito tras envío de contraseña temporal */}
          {forgotSuccess && (
            <p className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-center dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800">
              {forgotSuccess}
            </p>
          )}

          {/* Error de servidor en login */}
          {serverError && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Bloqueo por intentos fallidos */}
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
            {loading
              ? 'Verificando...'
              : isLockedOut
                ? `Bloqueado (${lockoutCountdown}s)`
                : 'Iniciar Sesión'}
          </Button>

        </form>
      </div>

      {/* ── Modal "Recuperar contraseña" ────────────────────────────────── */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          // Cerrar al hacer clic en el backdrop (fuera del modal)
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseForgot();
          }}
        >
          <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border overflow-hidden">

            {/* Encabezado del modal */}
            <div className="bg-primary px-6 py-5 flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary-foreground" />
              <h3 className="text-primary-foreground text-lg font-semibold">
                Recuperar contraseña
              </h3>
            </div>

            {/* Formulario del modal */}
            <form onSubmit={handleSendForgot} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ingresa tu cédula o correo institucional. Si está registrado en el
                sistema, recibirás una <strong>contraseña temporal</strong> en el
                correo asociado a tu cuenta. Úsala para iniciar sesión y cámbiala
                de inmediato desde tu perfil.
              </p>

              {/* Campo: Identificador */}
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
                    // Permitir envío con Enter
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleCloseForgot();
                    }}
                  />
                </div>
                {forgotIdentifierError && (
                  <p className="text-sm text-destructive text-left">
                    {forgotIdentifierError}
                  </p>
                )}
              </div>

              {/* Error del servidor (incluye mensaje de rate limit 429) */}
              {forgotError && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-md px-3 py-2">
                  {forgotError}
                </p>
              )}

              {/* Botones: Cancelar + Enviar */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseForgot}
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
