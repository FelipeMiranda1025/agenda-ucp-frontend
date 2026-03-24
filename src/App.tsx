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
import { PreAgendaQuestionnaire } from "@/components/PreAgendaQuestionnaire";
import { useDocenteConfig } from "@/hooks/useDocenteConfig";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import ScheduleBuilder from "./pages/ScheduleBuilder";
import AuditLog from "./pages/AuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const { data: config, isLoading: configLoading } = useDocenteConfig(user?.id);

  if (!isAuthenticated) {
    return <LoginDialog />;
  }

  // Show questionnaire if config not confirmed for this semester
  if (!configLoading && (!config || !config.confirmed)) {
    return (
      <PreAgendaQuestionnaire
        onConfirmed={() => {
          // Re-fetch will happen automatically via query invalidation
        }}
      />
    );
  }

  if (configLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <AgendaProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/schedule" element={<ScheduleBuilder />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AgendaProvider>
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
