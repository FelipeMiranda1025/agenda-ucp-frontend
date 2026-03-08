import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SubfunctionForm } from "@/components/SubfunctionForm";
import { SummaryPanel } from "@/components/SummaryPanel";
import { AgendaProvider } from "@/context/AgendaContext";

const Index = () => {
  return (
    <AgendaProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <header className="h-14 flex items-center gap-3 border-b bg-primary px-4">
              <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10" />
              <h1 className="text-primary-foreground font-semibold text-lg">
                Sistema de Gestión de Agenda Docente
              </h1>
              <span className="text-primary-foreground/70 text-sm ml-auto hidden sm:block">
                Universidad Católica de Pereira
              </span>
            </header>
            <div className="flex-1 flex min-h-0">
              <main className="flex-1 p-6 overflow-auto">
                <SubfunctionForm />
              </main>
              <SummaryPanel />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </AgendaProvider>
  );
};

export default Index;
