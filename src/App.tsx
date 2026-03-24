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
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import ScheduleBuilder from "./pages/ScheduleBuilder";
import AuditLog from "./pages/AuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginDialog />;
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
