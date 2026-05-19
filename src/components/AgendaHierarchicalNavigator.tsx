import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, User, Building2, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDocenteFullName } from "@/types/docentePlanta";
import { api } from "@/lib/api";
import { useFaculties, useProfessionalCareers, useSubordinatesWithNames } from "@/hooks/useDatabase";
import { DocentePlanta } from "@/types/docentePlanta";

interface AgendaHierarchicalNavigatorProps {
  selectedDocente: DocentePlanta | null;
  onSelectDocente: (docente: DocentePlanta) => void;
  docentesList: DocentePlanta[];
}

export function AgendaHierarchicalNavigator({
  selectedDocente,
  onSelectDocente,
  docentesList,
}: AgendaHierarchicalNavigatorProps) {
  const { user, roleName } = useAuth();
  const { t } = useLanguage();
  const { data: faculties = [] } = useFaculties();
  const { data: careers = [] } = useProfessionalCareers();

  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    root: true,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const isVicerrector = roleName === "VicerrectorAcadémico";
  const isDecano = roleName === "DecanoFacultad";
  const isDirector = roleName === "DirectorPrograma";
  const isDocente = roleName === "DocentePlanta";

  // Get user's own faculty (for decanos)
  const { data: userFacultyId = null } = useQuery<number | null>({
    queryKey: ["user_faculty_id", user?.id],
    queryFn: async () => {
      if (!user?.id || !isDecano) return null;
      const data = await api
        .get<{ id_faculty?: number | null } | null>(`/users/by-cc/${user.id}`)
        .catch(() => null);
      return data?.id_faculty ?? null;
    },
    enabled: isDecano && !!user?.id,
    staleTime: 1000 * 60 * 30,
  });

  // Get direct subordinates using existing hook
  const { data: directSubordinates = [] } = useSubordinatesWithNames(
    !isDocente && user?.id ? user.id : undefined
  );

  // Get self docente (current user in docentes list)
  const selfDocente = useMemo(
    () => docentesList.find((d) => d.firstName === "Yo"),
    [docentesList]
  );

  // Group subordinates by faculty (for Vicerrector)
  const facultiesWithSubs = useMemo(() => {
    if (!isVicerrector) return { list: [] as any[], unassigned: [] as any[] };

    const facultyMap = new Map<number, typeof directSubordinates>();
    const unassigned: typeof directSubordinates = [];

    directSubordinates.forEach((sub) => {
      const fid = sub.idFaculty;
      if (fid == null) {
        unassigned.push(sub);
      } else {
        if (!facultyMap.has(fid)) facultyMap.set(fid, []);
        facultyMap.get(fid)!.push(sub);
      }
    });

    const list = faculties.map((f) => ({
      faculty: f,
      count: facultyMap.get(f.id)?.length ?? 0,
      subordinates: facultyMap.get(f.id) || [],
    }));

    return { list, unassigned };
  }, [directSubordinates, faculties, isVicerrector]);

  // Group subordinates by career (for Decano)
  const careersWithSubs = useMemo(() => {
    if (!isDecano || userFacultyId == null) {
      return { list: [] as any[], unassigned: [] as any[] };
    }

    const careerMap = new Map<number, number>();
    const careerDetailMap = new Map<number, typeof directSubordinates>();
    const unassigned: typeof directSubordinates = [];

    directSubordinates
      .filter((s) => s.idFaculty === userFacultyId)
      .forEach((sub) => {
        const cid = sub.idProfessionalCareer;
        if (cid == null) {
          unassigned.push(sub);
        } else {
          careerMap.set(cid, (careerMap.get(cid) ?? 0) + 1);
          if (!careerDetailMap.has(cid)) careerDetailMap.set(cid, []);
          careerDetailMap.get(cid)!.push(sub);
        }
      });

    const facultyCareers = careers.filter((c) => c.id_faculty === userFacultyId);
    const list = facultyCareers.map((c) => ({
      career: c,
      count: careerMap.get(c.id) ?? 0,
      subordinates: careerDetailMap.get(c.id) || [],
    }));

    return { list, unassigned };
  }, [directSubordinates, careers, userFacultyId, isDecano]);

  // Docentes for Director
  const docentesForDirector = useMemo(() => {
    if (!isDirector) return [];
    return directSubordinates;
  }, [directSubordinates, isDirector]);

  // Toggle expansion
  const toggleExpanded = (key: string) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter items based on search
  const filterItems = (items: any[], searchField: string) => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      item[searchField]?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Render faculty level
  const renderFacultyLevel = (faculty: any) => {
    const key = `faculty_${faculty.faculty.id}`;
    const isExpanded = expandedLevels[key];

    return (
      <div key={key}>
        <button
          onClick={() => toggleExpanded(key)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-foreground/80 hover:bg-accent/50 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="flex-1 whitespace-normal break-words">{faculty.faculty.name}</span>
          <span className="text-xs text-muted-foreground">{faculty.count}</span>
        </button>

        {isExpanded && (
          <div className="ml-4 border-l border-border space-y-1">
            {faculty.subordinates.map((sub: typeof directSubordinates[0]) => (
              <button
                key={sub.id}
                onClick={() => {
                  const docente: DocentePlanta = {
                    id: sub.id,
                    firstName: sub.firstName,
                    secondName: sub.secondName,
                    firstLastName: sub.firstLastName,
                    secondLastName: sub.secondLastName,
                  };
                  onSelectDocente(docente);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  selectedDocente?.id === sub.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground/80 hover:bg-accent/50"
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="flex-1 whitespace-normal break-words">
                  {[sub.firstName, sub.secondName, sub.firstLastName, sub.secondLastName]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render career level
  const renderCareerLevel = (career: any) => {
    const key = `career_${career.career.id}`;
    const isExpanded = expandedLevels[key];
    const hasSubordinates = career.count > 0;

    if (!hasSubordinates) {
      return null;
    }

    return (
      <div key={key}>
        <button
          onClick={() => toggleExpanded(key)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-foreground/80 hover:bg-accent/50 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span className="flex-1 whitespace-normal break-words">{career.career.name}</span>
          <span className="text-xs text-muted-foreground">{career.count}</span>
        </button>

        {isExpanded && (
          <div className="ml-4 border-l border-border space-y-1">
            {career.subordinates.map((sub: typeof directSubordinates[0]) => (
              <button
                key={sub.id}
                onClick={() => {
                  const docente: DocentePlanta = {
                    id: sub.id,
                    firstName: sub.firstName,
                    secondName: sub.secondName,
                    firstLastName: sub.firstLastName,
                    secondLastName: sub.secondLastName,
                  };
                  onSelectDocente(docente);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  selectedDocente?.id === sub.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground/80 hover:bg-accent/50"
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="flex-1 whitespace-normal break-words">
                  {[sub.firstName, sub.secondName, sub.firstLastName, sub.secondLastName]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // If Docente, only show self
  if (isDocente) {
    return (
      <div className="px-4 py-2 border-b bg-muted/30">
        {selfDocente && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-accent-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Tu Agenda</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b bg-muted/30 space-y-3">
      {/* Search input */}
      <Input
        placeholder={t("sidebar.search")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-8 text-xs"
      />

      <div className="space-y-1">
        {/* Self (Yo) */}
        {selfDocente && (
          <button
            onClick={() => onSelectDocente(selfDocente)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
              selectedDocente?.id === selfDocente.id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-foreground/80 hover:bg-accent/50"
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="flex-1 whitespace-normal break-words">Yo</span>
          </button>
        )}

        {/* Vicerrector: Faculties with subordinates */}
        {isVicerrector && (
          <div className="space-y-1">
            {filterItems(facultiesWithSubs.list, "faculty.name").map((faculty) =>
              renderFacultyLevel(faculty)
            )}
          </div>
        )}

        {/* Decano: Careers with subordinates */}
        {isDecano && (
          <div className="space-y-1">
            {filterItems(careersWithSubs.list, "career.name").map((career) =>
              renderCareerLevel(career)
            )}
          </div>
        )}

        {/* Director: Direct docentes */}
        {isDirector && (
          <div className="space-y-1">
            {docentesForDirector.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  const docente: DocentePlanta = {
                    id: sub.id,
                    firstName: sub.firstName,
                    secondName: sub.secondName,
                    firstLastName: sub.firstLastName,
                    secondLastName: sub.secondLastName,
                  };
                  onSelectDocente(docente);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  selectedDocente?.id === sub.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground/80 hover:bg-accent/50"
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="flex-1 whitespace-normal break-words">
                  {[sub.firstName, sub.secondName, sub.firstLastName, sub.secondLastName]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
