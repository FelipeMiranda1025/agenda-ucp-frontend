import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle } from "lucide-react";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_BEFORE = 60 * 1000; // 1 minute before
const WARNING_AT = INACTIVITY_TIMEOUT - WARNING_BEFORE; // 4 minutes

export const InactivityWarning: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutTimeRef = useRef<number>(0);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const startWarning = useCallback(() => {
    logoutTimeRef.current = Date.now() + WARNING_BEFORE;
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((logoutTimeRef.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        clearAllTimers();
        setCountdown(null);
        logout();
      }
    }, 1000);
  }, [logout, clearAllTimers]);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setCountdown(null);
    if (!isAuthenticated) return;
    timerRef.current = setTimeout(() => {
      startWarning();
    }, WARNING_AT);
  }, [isAuthenticated, clearAllTimers, startWarning]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      setCountdown(null);
      return;
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handler = () => {
      // Only reset if warning is NOT showing
      if (countdown === null) {
        resetTimer();
      }
    };

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearAllTimers();
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (countdown === null || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl border p-8 max-w-sm mx-4 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
        <p className="text-base font-semibold text-foreground">
          El sistema se cerrará por inactividad en los próximos segundos:
        </p>
        <p className="text-5xl font-bold text-destructive tabular-nums">{countdown}</p>
        <p className="text-sm text-muted-foreground">
          Mueva el mouse o presione una tecla para continuar trabajando.
        </p>
      </div>
    </div>
  );
};
