import { BookOpen, FlaskConical, Search, GraduationCap, Briefcase, Users, Brain, Building2, Lightbulb, Heart, Award, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAgenda } from "@/context/AgendaContext";
import { subfunctions } from "@/data/subfunctions";
import { getDocenteFullName } from "@/types/docentePlanta";
import ucpLogo from "@/assets/ucp-logo.png";

const iconMap: { [key: string]: React.ElementType } = {
  "docencia-directa": BookOpen,
  "docencia-indirecta": GraduationCap,
  "trabajos-grado": Award,
  "practicas-academicas": Briefcase,
  "investigacion": FlaskConical,
  "proyeccion-social": Heart,
  "complementarias": Lightbulb,
  "formacion-docentes": Brain,
  "administrativas": Building2,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { activeSubfunction, setActiveSubfunction, searchTerm, setSearchTerm, selectedDocente, setSelectedDocente, docentesList } = useAgenda();

  const prodSubs = subfunctions.filter((s) => s.sectionId === "produccion");
  const actSubs = subfunctions.filter((s) => s.sectionId === "actividades");

  const filter = (items: typeof subfunctions) =>
    searchTerm
      ? items.filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
      : items;

  const renderItems = (items: typeof subfunctions) =>
    filter(items).map((item) => {
      const Icon = iconMap[item.id] || Users;
      const isActive = activeSubfunction === item.id;
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            onClick={() => setActiveSubfunction(item.id)}
            className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}
            tooltip={collapsed ? item.shortTitle : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.shortTitle}</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className={collapsed ? "flex justify-center mb-2" : "mb-3"}>
          <img src={ucpLogo} alt="Universidad Católica de Pereira" className={collapsed ? "h-8 w-auto" : "h-14 w-auto mb-1"} />
        </div>
        {!collapsed && (
          <p className="text-xs opacity-80">Agenda Docente</p>
        )}
        {!collapsed && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 opacity-60" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60 h-9"
            />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold uppercase text-xs tracking-wider">
            {collapsed ? "P" : "Producción"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(prodSubs)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold uppercase text-xs tracking-wider">
            {collapsed ? "A" : "Actividades Diferentes"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(actSubs)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">Docente de planta</p>
            <Select
              value={selectedDocente?.id || ""}
              onValueChange={(val) => {
                const d = docentesList.find((doc) => doc.id === val) || null;
                setSelectedDocente(d);
              }}
            >
              <SelectTrigger className="h-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm">
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
          </div>
        ) : (
          <div className="flex justify-center" title={selectedDocente ? getDocenteFullName(selectedDocente) : "Sin docente"}>
            <Users className="h-4 w-4 text-sidebar-foreground/70" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
