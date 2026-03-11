import { SpreadsheetView } from "@/components/SpreadsheetView";
import { useAuth } from "@/context/AuthContext";
import { useAgenda } from "@/context/AgendaContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, ChevronDown, User, LogOut } from "lucide-react";
import { getDocenteFullName } from "@/types/docentePlanta";
import ucpLogo from "@/assets/ucp-logo.png";

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { selectedDocente, setSelectedDocente, docentesList } = useAgenda();

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.firstLastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center gap-3 border-b bg-primary px-4 shrink-0">
        <img src={ucpLogo} alt="UCP" className="h-8 w-auto" />
        <h1 className="text-primary-foreground font-semibold text-lg hidden md:block">
          Agenda Docente
        </h1>

        {/* Docente selector */}
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={selectedDocente?.id || ""}
            onValueChange={(val) => {
              const d = docentesList.find((doc) => doc.id === val) || null;
              setSelectedDocente(d);
            }}
          >
            <SelectTrigger className="h-8 w-56 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-sm">
              <SelectValue placeholder="Seleccionar docente..." />
            </SelectTrigger>
            <SelectContent>
              {docentesList.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {getDocenteFullName(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Profile dropdown */}
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

      <main className="flex-1 overflow-auto bg-background">
        <SpreadsheetView />
      </main>
    </div>
  );
};

export default Index;
