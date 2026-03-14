import { useState, useEffect, useRef, useCallback } from "react";
import { SubfunctionForm } from "@/components/SubfunctionForm";
import { SummaryPanel } from "@/components/SummaryPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { subfunctions } from "@/data/subfunctions";

import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, ChevronDown, User, LogOut, Menu, X } from "lucide-react";
import ucpLogoWhite from "@/assets/ucp-logo-white.png";

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibleSection, setVisibleSection] = useState<string>("Producción");
  const mainRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.firstLastName?.[0] || ""}`.toUpperCase()
    : "U";

  // IntersectionObserver for dynamic subtitle
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const sections = main.querySelectorAll("[data-section-id]");
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute("data-section-id");
            if (sectionId) {
              const sf = subfunctions.find((s) => s.id === sectionId);
              if (sf) {
                if (sf.sectionId === "produccion") setVisibleSection("Producción");
                else if (sf.sectionId === "actividades") setVisibleSection("Actividades diferentes a la docencia");
                else if (sf.sectionId === "horario") setVisibleSection("Horario de permanencia");
              }
            }
          }
        }
      },
      { root: main, threshold: 0.3 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleMenuClose = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-primary border-b shrink-0">
        <div className="h-14 flex items-center gap-3 px-4">
          <img src={ucpLogoWhite} alt="UCP" className="h-9 w-auto" />
          <div className="flex-1 min-w-0">
            <h1 className="text-primary-foreground font-semibold text-lg leading-tight">
              Sistema de Gestión de Agenda Docente
            </h1>
            <p className="text-primary-foreground/80 text-sm leading-tight">{visibleSection}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                <User className="h-4 w-4" /> Ver perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        <main ref={mainRef} className="flex-1 p-6 overflow-auto space-y-8">
          {subfunctions
            .filter((s) => s.id !== "distribucion-horaria")
            .map((s) => (
              <section key={s.id} id={`section-${s.id}`} data-section-id={s.id}>
                <SubfunctionForm subfunctionId={s.id} />
              </section>
            ))}
        </main>
        <SummaryPanel />
      </div>

      {/* Floating hamburger button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/50" onClick={handleMenuClose} />
          <div className="relative z-10 w-72 bg-card shadow-2xl h-full animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-end p-2">
              <Button variant="ghost" size="icon" onClick={handleMenuClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <AppSidebar onClose={handleMenuClose} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
