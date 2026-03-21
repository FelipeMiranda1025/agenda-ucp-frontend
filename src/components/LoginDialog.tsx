import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, User } from 'lucide-react';
import ucpLogo from '@/assets/ucp-logo.png';

export const LoginDialog: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!showMessage) return;
    if (redirected) return;
    if (countdown <= 0) {
      const link = document.createElement('a');
      link.href = 'https://www.gmail.com';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setRedirected(true);
      const hideTimer = setTimeout(() => {
        setShowMessage(false);
        setRedirected(false);
        setCountdown(5);
      }, 120000);
      return () => clearTimeout(hideTimer);
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showMessage, countdown, redirected]);

  const handleForgotPassword = () => {
    setShowMessage(true);
    setCountdown(5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor complete todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username.trim(), password);
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-background rounded-2xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-8 flex flex-col items-center gap-3">
          <img src={ucpLogo} alt="Logo UCP" className="h-16 w-auto object-contain" />
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
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                autoComplete="username"
                autoFocus
              />
            </div>
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
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
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

          {showMessage && (
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                Debes escribir a soporte@ucp.edu.co
              </p>
              <p className="text-sm text-muted-foreground">
                Redirigiendo en {countdown}...
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
};