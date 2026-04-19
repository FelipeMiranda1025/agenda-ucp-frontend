import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FlaskConical, Search, GraduationCap, Briefcase, Users, Brain, Building2, Lightbulb, Heart, Award, Calendar, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAgenda } from "@/context/AgendaContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { subfunctions } from "@/data/subfunctions";
import { getDocenteFullName } from "@/types/docentePlanta";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFaculties, useProfessionalCareers, useApprovedAgendaCcs } from "@/hooks/useDatabase";
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

type NavView = "root" | "careers" | "docentes";

export function AppSidebar({ onClose }: AppSidebarProps) {
  const { activeSubfunction, setActiveSubfunction, searchTerm, setSearchTerm, selectedDocente, setSelectedDocente, docentesList, loadFromAgendaView } = useAgenda();
  const { roleName, user } = useAuth();
  const isVicerrector = roleName === "VicerrectorAcadémico";
  const isDecano = roleName === "DecanoFacultad";
  const { t } = useLanguage();
  const { data: faculties = [] } = useFaculties();
  const { data: careers = [] } = useProfessionalCareers();

  // Decano's own faculty (used to start sidebar at level 1)
  const { data: deanFacultyId = null } = useQuery<number | null>({
    queryKey: ["dean_faculty_id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("users")
        .select("id_faculty")
        .eq("cc", user.id)
        .maybeSingle();
      return ((data as any)?.id_faculty as number | null) ?? null;
    },
    enabled: isDecano && !!user?.id,
    staleTime: 1000 * 60 * 30,
  });

  const { data: approvedCcs = [] } = useApprovedAgendaCcs(
    isVicerrector ? "vicerrector" : "decano",
    isDecano ? user?.id : undefined,
    isVicerrector || isDecano
  );
  const approvedSet = useMemo(() => new Set(approvedCcs), [approvedCcs]);

  const [navView, setNavView] = useState<NavView>(isDecano ? "careers" : "root");
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedCareerId, setSelectedCareerId] = useState<number | null>(null);

  // For Decano: lock sidebar to their own faculty as soon as we know it
  useEffect(() => {
    if (isDecano && deanFacultyId != null && selectedFacultyId !== deanFacultyId) {
      setSelectedFacultyId(deanFacultyId);
      setNavView("careers");
    }
  }, [isDecano, deanFacultyId, selectedFacultyId]);

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

  // Subordinates only (exclude "Yo" entry which has firstName === "Yo")
  // - Vicerrector: only docentes whose agenda was approved by their dean.
  // - Decano: only docentes whose agenda was approved by their director.
  const subordinates = useMemo(() => {
    const base = docentesList.filter((d) => d.firstName !== "Yo");
    if (isVicerrector || isDecano) return base.filter((d) => approvedSet.has(d.id));
    return base;
  }, [docentesList, isVicerrector, isDecano, approvedSet]);
  const selfDocente = useMemo(
    () => docentesList.find((d) => d.firstName === "Yo"),
    [docentesList]
  );

  // Group subordinates by faculty
  // - Roles normales: solo facultades con al menos 1 subordinado (pruning)
  // - Vicerrector: TODAS las facultades del catálogo, con conteo (puede ser 0)
  const facultiesWithSubs = useMemo(() => {
    const facultyMap = new Map<number, typeof subordinates>();
    const unassigned: typeof subordinates = [];
    subordinates.forEach((s) => {
      const fid = (s as any).idFaculty as number | null;
      if (fid == null) {
        unassigned.push(s);
      } else {
        if (!facultyMap.has(fid)) facultyMap.set(fid, []);
        facultyMap.get(fid)!.push(s);
      }
    });
    const list = isVicerrector
      ? faculties.map((f) => ({ faculty: f, count: facultyMap.get(f.id)?.length ?? 0 }))
      : faculties
          .filter((f) => facultyMap.has(f.id))
          .map((f) => ({ faculty: f, count: facultyMap.get(f.id)!.length }));
    return { list, unassigned };
  }, [subordinates, faculties, isVicerrector]);

  // Careers within selected faculty
  // - Roles normales: solo carreras con al menos 1 subordinado
  // - Vicerrector: TODAS las carreras del catálogo de esa facultad (count puede ser 0 → deshabilitada)
  const careersWithSubs = useMemo(() => {
    if (selectedFacultyId == null) return { list: [] as { career: typeof careers[number]; count: number }[], unassigned: [] as typeof subordinates };
    const careerMap = new Map<number, number>();
    const unassigned: typeof subordinates = [];
    subordinates
      .filter((s) => (s as any).idFaculty === selectedFacultyId)
      .forEach((s) => {
        const cid = (s as any).idProfessionalCareer as number | null;
        if (cid == null) unassigned.push(s);
        else careerMap.set(cid, (careerMap.get(cid) ?? 0) + 1);
      });
    const facultyCareers = careers.filter((c) => c.id_faculty === selectedFacultyId);
    const list = (isVicerrector || isDecano)
      ? facultyCareers.map((c) => ({ career: c, count: careerMap.get(c.id) ?? 0 }))
      : facultyCareers
          .filter((c) => careerMap.has(c.id))
          .map((c) => ({ career: c, count: careerMap.get(c.id)! }));
    return { list, unassigned };
  }, [subordinates, careers, selectedFacultyId, isVicerrector, isDecano]);

  // Docentes within selected career (or unassigned bucket)
  const docentesInCareer = useMemo(() => {
    if (selectedCareerId == null) {
      // "Sin carrera" bucket inside selected faculty
      if (selectedFacultyId == null) return [];
      return subordinates.filter(
        (s) => (s as any).idFaculty === selectedFacultyId && (s as any).idProfessionalCareer == null
      );
    }
    return subordinates.filter((s) => (s as any).idProfessionalCareer === selectedCareerId);
  }, [subordinates, selectedCareerId, selectedFacultyId]);

  const handleSelectDocente = async (d: typeof docentesList[number]) => {
    setSelectedDocente(d);
    if (d.firstName !== "Yo") {
      setTimeout(async () => {
        const found = await loadFromAgendaView();
        if (!found) {
          toast.info(`Docente ${getDocenteFullName(d)} no ha diligenciado su agenda`);
        }
      }, 100);
    }
  };

  const goRoot = () => {
    setNavView("root");
    setSelectedFacultyId(null);
    setSelectedCareerId(null);
  };
  const goCareers = (facultyId: number) => {
    setSelectedFacultyId(facultyId);
    setSelectedCareerId(null);
    setNavView("careers");
  };
  const goDocentes = (careerId: number | null) => {
    setSelectedCareerId(careerId);
    setNavView("docentes");
  };

  const selectedFacultyName = faculties.find((f) => f.id === selectedFacultyId)?.name ?? "";
  const selectedCareerName =
    selectedCareerId != null
      ? careers.find((c) => c.id === selectedCareerId)?.name ?? ""
      : "Sin carrera";

  const itemBtnClass =
    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-foreground/80 hover:bg-accent/50";

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

        {docentesList.length >= 1 && (
          <div>
            <p className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">
              {t("sidebar.docenteSection")} ({docentesList.length})
            </p>

            {/* NIVEL 0 — RAÍZ */}
            {navView === "root" && (
              <div className="space-y-0.5">
                {selfDocente && (
                  <button
                    onClick={() => handleSelectDocente(selfDocente)}
                    className={`${itemBtnClass} ${
                      selectedDocente?.id === selfDocente.id ? "bg-accent text-accent-foreground font-medium" : ""
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">Yo</span>
                  </button>
                )}

                {facultiesWithSubs.list.map(({ faculty, count }) => (
                  <button
                    key={faculty.id}
                    onClick={() => goCareers(faculty.id)}
                    className={itemBtnClass}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1 text-left">{faculty.name}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </button>
                ))}

                {facultiesWithSubs.unassigned.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedFacultyId(null);
                      setSelectedCareerId(null);
                      setNavView("docentes");
                    }}
                    className={itemBtnClass}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1 text-left">Sin facultad asignada</span>
                    <span className="text-xs text-muted-foreground">{facultiesWithSubs.unassigned.length}</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </button>
                )}
              </div>
            )}

            {/* NIVEL 1 — CARRERAS DE LA FACULTAD */}
            {navView === "careers" && selectedFacultyId != null && (
              <div className="space-y-0.5">
                {isDecano ? (
                  <div className={`${itemBtnClass} font-medium cursor-default hover:bg-transparent`}>
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{selectedFacultyName}</span>
                  </div>
                ) : (
                  <button onClick={goRoot} className={`${itemBtnClass} font-medium`}>
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="truncate">{selectedFacultyName}</span>
                  </button>
                )}

                {careersWithSubs.list.map(({ career, count }) => {
                  const disabled = count === 0;
                  return (
                    <button
                      key={career.id}
                      onClick={() => !disabled && goDocentes(career.id)}
                      disabled={disabled}
                      className={`${itemBtnClass} ${disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}`}
                      title={disabled ? "Sin agendas disponibles" : undefined}
                    >
                      <GraduationCap className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 text-left">{career.name}</span>
                      <span className="text-xs text-muted-foreground">{disabled ? "—" : count}</span>
                      {!disabled && <ChevronRight className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}

                {careersWithSubs.unassigned.length > 0 && (
                  <button onClick={() => goDocentes(null)} className={itemBtnClass}>
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1 text-left">Sin carrera asignada</span>
                    <span className="text-xs text-muted-foreground">{careersWithSubs.unassigned.length}</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </button>
                )}
              </div>
            )}

            {/* NIVEL 2 — DOCENTES DE LA CARRERA */}
            {navView === "docentes" && (
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    if (selectedFacultyId != null) {
                      setNavView("careers");
                      setSelectedCareerId(null);
                    } else {
                      goRoot();
                    }
                  }}
                  className={`${itemBtnClass} font-medium`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {selectedFacultyId != null ? selectedCareerName : "Sin facultad asignada"}
                  </span>
                </button>

                {selfDocente && (
                  <button
                    onClick={() => handleSelectDocente(selfDocente)}
                    className={`${itemBtnClass} ${
                      selectedDocente?.id === selfDocente.id ? "bg-accent text-accent-foreground font-medium" : ""
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">Yo</span>
                  </button>
                )}

                {(selectedFacultyId == null
                  ? facultiesWithSubs.unassigned
                  : docentesInCareer
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDocente(d)}
                    className={`${itemBtnClass} ${
                      selectedDocente?.id === d.id ? "bg-accent text-accent-foreground font-medium" : ""
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">{getDocenteFullName(d)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
