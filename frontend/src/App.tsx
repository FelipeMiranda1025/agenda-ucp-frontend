import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AgendaProvider } from "@/context/AgendaContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { LoginDialog } from "@/components/LoginDialog";
import { InactivityWarning } from "@/components/InactivityWarning";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import ScheduleBuilder from "./pages/ScheduleBuilder";
import AuditLog from "./pages/AuditLog";
import NotFound from "./pages/NotFound";
import SupportPanel from "./pages/SupportPanel";
import Dashboard from "./pages/Dashboard";
import HistoryPanel from "./pages/HistoryPanel";
import { SystemMaintenance } from "@/components/SystemMaintenance";
import { useSystemEnabled } from "@/hooks/useSystemEnabled";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

class AgendaErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("AgendaProvider error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="flex items-center justify-center h-screen text-destructive">Error al cargar la agenda. Recarga la página.</div>;
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthenticated, roleName } = useAuth();
  const { enabled: systemEnabled } = useSystemEnabled();

  if (!isAuthenticated) {
    return <LoginDialog />;
  }

  // Rol Soporte: panel exclusivo de gestión de usuarios. No carga AgendaProvider ni rutas normales.
  if (roleName === "Soporte") {
    return <SupportPanel />;
  }

  // Sistema apagado por el Vicerrector: bloquea a todos excepto Soporte y Vicerrector
  if (!systemEnabled && roleName !== "VicerrectorAcadémico") {
    return <SystemMaintenance />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AgendaErrorBoundary>
              <AgendaProvider>
                <InactivityWarning />
                <Index />
              </AgendaProvider>
            </AgendaErrorBoundary>
          }
        />
        <Route
          path="/schedule"
          element={
            <AgendaErrorBoundary>
              <AgendaProvider>
                <InactivityWarning />
                <ScheduleBuilder />
              </AgendaProvider>
            </AgendaErrorBoundary>
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<HistoryPanel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
