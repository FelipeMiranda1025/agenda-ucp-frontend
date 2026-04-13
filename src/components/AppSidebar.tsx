import { BookOpen, FlaskConical, Search, GraduationCap, Briefcase, Users, Brain, Building2, Lightbulb, Heart, Award, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgenda } from "@/context/AgendaContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { subfunctions } from "@/data/subfunctions";
import { getDocenteFullName } from "@/types/docentePlanta";
import { toast } from "sonner";
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
  "distribucion-horaria": Calendar,
};

interface AppSidebarProps {
  onClose: () => void;
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const { activeSubfunction, setActiveSubfunction, searchTerm, setSearchTerm, selectedDocente, setSelectedDocente, docentesList, loadFromAgendaView } = useAgenda();
  const { t } = useLanguage();

  const prodSubs = subfunctions.filter((s) => s.sectionId === "produccion");
  const actSubs = subfunctions.filter((s) => s.sectionId === "actividades");
  const horSubs = subfunctions.filter((s) => s.sectionId === "horario");

  const filter = (items: typeof subfunctions) =>
    searchTerm
      ? items.filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
      : items;

  const handleItemClick = (id: string) => {
    setActiveSubfunction(id);
    onClose();
    setTimeout(() => {
      const el = document.getElementById(`section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const renderItems = (items: typeof subfunctions) =>
    filter(items).map((item) => {
      const Icon = iconMap[item.id] || Users;
      const isActive = activeSubfunction === item.id;
      return (
        <button
          key={item.id}
          onClick={() => handleItemClick(item.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            isActive
              ? "bg-accent text-accent-foreground font-medium"
              : "text-foreground/80 hover:bg-accent/50"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{t(item.shortTitleKey || item.shortTitle)}</span>
        </button>
      );
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pb-3">
        <img src={ucpLogo} alt="Universidad Católica de Pereira" className="h-14 w-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-2">{t("sidebar.agendaDocente")}</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("sidebar.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 space-y-4">
        <div>
          <p className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">{t("sidebar.production")}</p>
          <div className="space-y-0.5">{renderItems(prodSubs)}</div>
        </div>
        <div>
          <p className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">{t("sidebar.activities")}</p>
          <div className="space-y-0.5">{renderItems(actSubs)}</div>
        </div>
        <div>
          <p className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">{t("sidebar.schedule")}</p>
          <div className="space-y-0.5">{renderItems(horSubs)}</div>
        </div>
      </div>

      <div className="p-4 border-t">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t("sidebar.docente")}</p>
        <Select
          value={selectedDocente?.id || ""}
          onValueChange={async (val) => {
            const d = docentesList.find((doc) => doc.id === val) || null;
            setSelectedDocente(d);
            // If selecting a subordinate (not "Yo"), check if they have a pending agenda
            if (d && d.firstName !== "Yo") {
              // Wait a tick for docenteId to update, then load
              setTimeout(async () => {
                const found = await loadFromAgendaView();
                if (!found) {
                  toast.info(`Docente ${getDocenteFullName(d)} no ha diligenciado su agenda`);
                }
              }, 100);
            }
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={t("sidebar.selectDocente")} />
          </SelectTrigger>
          <SelectContent>
            {docentesList.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.firstName === "Yo" ? "Yo" : getDocenteFullName(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
