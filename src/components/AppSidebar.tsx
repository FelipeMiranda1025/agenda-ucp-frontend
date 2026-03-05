import { BookOpen, FlaskConical, Search, GraduationCap, Briefcase, Users, Brain, Building2, Lightbulb, Heart, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAgenda } from "@/context/AgendaContext";
import { subfunctions } from "@/data/subfunctions";
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
  const { activeSubfunction, setActiveSubfunction, searchTerm, setSearchTerm } = useAgenda();

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
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-semibold uppercase text-xs tracking-wider">
            {collapsed ? "P" : "Producción"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(prodSubs)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-semibold uppercase text-xs tracking-wider">
            {collapsed ? "A" : "Actividades Diferentes"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(actSubs)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
