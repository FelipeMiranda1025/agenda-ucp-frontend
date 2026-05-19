import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AgendaProvider } from "@/context/AgendaContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { LoginDialog } from "@/components/LoginDialog";
import { InactivityWarning } from "@/components/InactivityWarning";
import { SystemMaintenance } from "@/components/SystemMaintenance";
import { useSystemEnabled } from "@/hooks/useSystemEnabled";
import { RoleRouteGuard, SupportPanelGuard } from "@/components/RoleRouteGuard";

// Lazy-loaded pages — each becomes its own chunk so the initial bundle is small
// and route transitions only fetch what's needed (with prefetch warming the cache).
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const ScheduleBuilder = lazy(() => import("./pages/ScheduleBuilder"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SupportPanel = lazy(() => import("./pages/SupportPanel"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HistoryPanel = lazy(() => import("./pages/HistoryPanel"));

class AgendaErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Error desconocido" };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("AgendaProvider error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="flex items-center justify-center h-screen text-destructive">Error al cargar la agenda. Recarga la página.</div>;
    }
    return this.props.children;
  }
}

// Lightweight fallback while a route chunk is fetched (only shown on the very
// first navigation to that route — afterward the chunk is cached).
const RouteFallback = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const AppContent = () => {
  const { isAuthenticated, roleName } = useAuth();
  const { enabled: systemEnabled } = useSystemEnabled();

  if (!isAuthenticated) {
    return <LoginDialog />;
  }

  /*
  // Soporte: dedicated user-management panel.
  if (roleName === "Soporte") {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <SupportPanel />
      </Suspense>
    </BrowserRouter>
  );
}*/

  // System paused by Vicerrector: blocks everyone except Soporte and Vicerrector.
  if (!systemEnabled && roleName !== "VicerrectorAcadémico") {
    return <SystemMaintenance />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RoleRouteGuard />
      <Suspense fallback={<RouteFallback />}>
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
          <Route
            path="/support"
            element={
              <SupportPanelGuard>
                <SupportPanel />
              </SupportPanelGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
