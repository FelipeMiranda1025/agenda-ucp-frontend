import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AgendaContext, type AgendaContextType } from "@/context/agendaContextRef";
import { DropdownOption, Record as AgendaRecord, MetricasPie, ScheduleBlock, ScheduleData } from "@/types/agenda";
import { initialDropdownOptions } from "@/data/initialDropdownOptions";
import { subfunctions } from "@/data/subfunctions";
import { DocentePlanta } from "@/types/docentePlanta";
import { api, qs } from "@/lib/api";
import { useSubordinatesWithNames, useAllDocentes, useAgendaView, SubordinateDocente } from "@/hooks/useDatabase";
import { useAuth } from "@/context/AuthContext";
import { useSystemEnabled } from "@/hooks/useSystemEnabled";
import { useActiveLineamientos } from "@/hooks/useActiveLineamientos";
import { canAccessScheduleDistribution } from "@/lib/agendaScheduleAccess";

export const AgendaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, roleName } = useAuth();
  const isVicerrector = roleName === "VicerrectorAcadémico";
  const { data: ownAgendaView } = useAgendaView(user?.id);
  const isSupervisorRole =
    roleName === "DirectorPrograma" ||
    roleName === "DecanoFacultad" ||
    roleName === "VicerrectorAcadémico";

  // Load active lineamientos for dynamic factors
  const { data: lineamientos } = useActiveLineamientos();

  // For Vicerrector: load ALL docentes. For others: only direct subordinates via hierarchy.
  const { data: subordinates = [], isLoading: loadingSubs, error: subsError } = useSubordinatesWithNames(
    isVicerrector ? undefined : user?.id
  );
  const { data: allDocentes = [], isLoading: loadingAll, error: allError } = useAllDocentes(isVicerrector);

  const effectiveDocentes: SubordinateDocente[] = isVicerrector
    ? allDocentes.filter((d) => d.id !== user?.id)
    : subordinates;

  useEffect(() => {
    if (user) {
      console.log("[AgendaContext] user.id (cc):", user.id, "rolId:", user.rolId, "role:", roleName);
      console.log("[AgendaContext] effectiveDocentes →", {
        isVicerrector,
        loading: isVicerrector ? loadingAll : loadingSubs,
        error: isVicerrector ? allError : subsError,
        count: effectiveDocentes.length,
      });
    }
  }, [user, roleName, isVicerrector, effectiveDocentes, loadingSubs, subsError, loadingAll, allError]);

  // Build dynamic docentes list: "Yo" (current user) + subordinates
  const docentesList = useMemo<DocentePlanta[]>(() => {
    const list: DocentePlanta[] = [];
    if (user) {
      list.push({
        id: user.id,
        firstName: "Yo",
        secondName: "",
        firstLastName: "",
        secondLastName: "",
      });
    }
    for (const sub of effectiveDocentes) {
      if (sub.id !== user?.id && !list.some((d) => d.id === sub.id)) {
        list.push({
          id: sub.id,
          firstName: sub.firstName,
          secondName: sub.secondName,
          firstLastName: sub.firstLastName,
          secondLastName: sub.secondLastName,
        });
      }
    }
    return list;
  }, [user, effectiveDocentes]);

  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>(initialDropdownOptions);
  const [recordsByDocente, setRecordsByDocente] = useState<{ [docenteId: string]: AgendaRecord[] }>({});
  const [scheduleByDocente, setScheduleByDocente] = useState<{ [docenteId: string]: ScheduleData }>({});
  const [horasSemestreDefecto, setHorasSemestreDefecto] = useState(920);

  // Update semester hours when lineamientos change
  useEffect(() => {
    if (lineamientos?.horasSemestre) {
      setHorasSemestreDefecto(lineamientos.horasSemestre);
    }
  }, [lineamientos]);

  const [activeSubfunction, setActiveSubfunction] = useState("docencia-directa");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocente, setSelectedDocente] = useState<DocentePlanta | null>(null);
  const [editingRecord, setEditingRecord] = useState<AgendaRecord | null>(null);
  const [hasPendingAgendaView, setHasPendingAgendaView] = useState(false);

  // Auto-select first docente (Yo) when list changes and no selection
  useEffect(() => {
    if (!selectedDocente && docentesList.length > 0) {
      setSelectedDocente(docentesList[0]);
    }
  }, [docentesList, selectedDocente]);

  const docenteId = selectedDocente?.id ?? "";
  const records = useMemo(() => recordsByDocente[docenteId] || [], [recordsByDocente, docenteId]);

  const subordinateCc =
    selectedDocente && user && selectedDocente.id !== user.id ? selectedDocente.id : undefined;
  const { data: subordinateAgendaView } = useAgendaView(subordinateCc);

  const isViewingOwnAgenda = !!(selectedDocente && user && selectedDocente.id === user.id);

  /** Supervisor actual puede editar la agenda del subordinado en revisión */
  const canSupervisorEditSubordinate = useMemo(() => {
    if (!isSupervisorRole || !user || !subordinateCc) return false;
    if (subordinateAgendaView?.status !== "pending") return false;
    return user.rolId === subordinateAgendaView.pending_reviewer_rol;
  }, [isSupervisorRole, user, subordinateCc, subordinateAgendaView]);

  const isAgendaReadOnly = useMemo(() => {
    if (selectedDocente && user && selectedDocente.id !== user.id) {
      return !canSupervisorEditSubordinate;
    }
    if (isViewingOwnAgenda && ownAgendaView) {
      return ownAgendaView.status === "pending" || ownAgendaView.status === "approved";
    }
    return false;
  }, [
    selectedDocente,
    user,
    canSupervisorEditSubordinate,
    isViewingOwnAgenda,
    ownAgendaView,
  ]);

  const isOwnAgendaPendingReview =
    isViewingOwnAgenda && ownAgendaView?.status === "pending";

  const canAccessSchedule = useMemo(
    () =>
      isViewingOwnAgenda &&
      canAccessScheduleDistribution(ownAgendaView, user?.rolId),
    [isViewingOwnAgenda, ownAgendaView, user?.rolId]
  );

  // Helper: generate indirect teaching records from all docencia-directa records
  const generateIndirectRecords = useCallback((allRecords: AgendaRecord[]): AgendaRecord[] => {
    const directRecords = allRecords.filter((r) => r.subfunctionId === "docencia-directa");
    // Remove existing auto-generated indirect records
    const withoutAutoIndirect = allRecords.filter(
      (r) => !(r.subfunctionId === "docencia-indirecta" && (r.data["_auto"] === "1"))
    );

    if (directRecords.length === 0) return withoutAutoIndirect;

    // Sum all weekly hours from docencia-directa
    const totalWeeklyHours = directRecords.reduce((sum, r) => sum + (Number(r.data["horasSemana"]) || 0), 0);
    const numberOfSubjects = directRecords.length; // Cantidad de asignaturas

    // Use dynamic factors from lineamientos or fallbacks
    const prepFactor = lineamientos?.docenciaIndirecta?.preparacionClasePorHora ?? 0.5;
    const asesFactor = lineamientos?.docenciaIndirecta?.asesoriaPorCurso ?? 1.0;
    const weeks = lineamientos?.docenciaIndirecta?.semanasSemestre ?? 18;

    const prepWeekly = totalWeeklyHours * prepFactor; // Preparación de clases
    const asesWeekly = numberOfSubjects * asesFactor; // Asesorías
    
    const autoRecords: AgendaRecord[] = [];

    if (prepWeekly > 0) {
      autoRecords.push({
        id: `auto-prep-${docenteId}`,
        subfunctionId: "docencia-indirecta",
        data: { actividad: "Preparación de clases", horasSemana: prepWeekly, cantidadSemanas: weeks, _auto: "1" },
        totalHoras: prepWeekly * weeks,
        createdAt: new Date().toISOString(),
      });
    }

    if (asesWeekly > 0) {
      autoRecords.push({
        id: `auto-ases-${docenteId}`,
        subfunctionId: "docencia-indirecta",
        data: { actividad: "Asesorías de estudiantes", horasSemana: asesWeekly, cantidadSemanas: weeks, _auto: "1" },
        totalHoras: asesWeekly * weeks,
        createdAt: new Date().toISOString(),
      });
    }

    return [...withoutAutoIndirect, ...autoRecords];
  }, [docenteId, lineamientos]);

  const addDropdownOption = useCallback((category: string, value: string) => {
    setDropdownOptions((prev) => [
      ...prev,
      { id: String(Date.now()), category, value },
    ]);
  }, []);

  const addRecord = useCallback((record: Omit<AgendaRecord, "id" | "createdAt">) => {
    if (!docenteId) return;
    if (user && docenteId !== user.id && !canSupervisorEditSubordinate) {
      console.warn("[AgendaContext] addRecord blocked: cannot modify another user's agenda");
      return;
    }
    setRecordsByDocente((prev) => ({
      ...prev,
      [docenteId]: [
        ...(prev[docenteId] || []),
        { ...record, id: String(Date.now()), createdAt: new Date().toISOString() },
      ],
    }));
  }, [docenteId, user, canSupervisorEditSubordinate]);

  const updateRecord = useCallback((id: string, data: AgendaRecord["data"], totalHoras: number) => {
    if (!docenteId) return;
    if (user && docenteId !== user.id && !canSupervisorEditSubordinate) {
      console.warn("[AgendaContext] updateRecord blocked: cannot modify another user's agenda");
      return;
    }
    setRecordsByDocente((prev) => ({
      ...prev,
      [docenteId]: (prev[docenteId] || []).map((r) => (r.id === id ? { ...r, data, totalHoras } : r)),
    }));
  }, [docenteId, user, canSupervisorEditSubordinate]);

  const deleteRecord = useCallback((id: string) => {
    if (!docenteId) return;
    if (user && docenteId !== user.id && !canSupervisorEditSubordinate) {
      console.warn("[AgendaContext] deleteRecord blocked: cannot modify another user's agenda");
      return;
    }
    setRecordsByDocente((prev) => {
      const existing = prev[docenteId] || [];
      const deletedRecord = existing.find((r) => r.id === id);
      let filtered = existing.filter((r) => r.id !== id);
      // Regenerate indirect records if a docencia-directa record was deleted
      if (deletedRecord?.subfunctionId === "docencia-directa") {
        filtered = generateIndirectRecords(filtered);
      }
      return { ...prev, [docenteId]: filtered };
    });
  }, [docenteId, generateIndirectRecords, user, canSupervisorEditSubordinate]);

  // Upsert: match by subfunctionId + ALL string values in data (composite key)
  const upsertRecord = useCallback((subfunctionId: string, data: AgendaRecord["data"], totalHoras: number) => {
    if (!docenteId) return;
    if (user && docenteId !== user.id && !canSupervisorEditSubordinate) {
      console.warn("[AgendaContext] upsertRecord blocked: cannot modify another user's agenda");
      return;
    }
    setRecordsByDocente((prev) => {
      const existing = prev[docenteId] || [];
      // Composite key: all string values from data
      const stringValues = Object.entries(data)
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => `${k}=${v}`);
      
      const match = stringValues.length > 0
        ? existing.find((r) => {
            if (r.subfunctionId !== subfunctionId) return false;
            const rStringValues = Object.entries(r.data)
              .filter(([, v]) => typeof v === "string")
              .map(([k, v]) => `${k}=${v}`);
            return stringValues.length === rStringValues.length && stringValues.every((sv) => rStringValues.includes(sv));
          })
        : null;

      let newRecords: AgendaRecord[];
      if (match) {
        newRecords = existing.map((r) => (r.id === match.id ? { ...r, data, totalHoras } : r));
      } else {
        newRecords = [
          ...existing,
          { id: String(Date.now()), subfunctionId, data, totalHoras, createdAt: new Date().toISOString() },
        ];
      }

      // Auto-generate docencia-indirecta records when docencia-directa changes
      if (subfunctionId === "docencia-directa") {
        newRecords = generateIndirectRecords(newRecords);
      }

      return { ...prev, [docenteId]: newRecords };
    });
  }, [docenteId, user, canSupervisorEditSubordinate, generateIndirectRecords]);

  const getRecordsBySubfunction = useCallback(
    (subfunctionId: string) => records.filter((r) => r.subfunctionId === subfunctionId),
    [records]
  );

  const saveSchedule = useCallback((blocks: ScheduleBlock[]) => {
    if (!docenteId) return;
    if (user && docenteId !== user.id && !canSupervisorEditSubordinate) {
      console.warn("[AgendaContext] saveSchedule blocked: cannot modify another user's agenda");
      return;
    }
    setScheduleByDocente((prev) => ({
      ...prev,
      [docenteId]: {
        docenteId,
        blocks,
        lastModified: new Date().toISOString(),
      },
    }));
  }, [docenteId, user, canSupervisorEditSubordinate]);

  const getSchedule = useCallback(() => {
    return scheduleByDocente[docenteId] || null;
  }, [scheduleByDocente, docenteId]);

  const hasSchedule = useMemo(() => {
    const s = scheduleByDocente[docenteId];
    return !!s && s.blocks.length > 0;
  }, [scheduleByDocente, docenteId]);

  // Load agenda from agenda_views on login
  const loadFromAgendaView = useCallback(async (targetCc?: string): Promise<boolean> => {
    const cc = targetCc ?? docenteId;
    if (!cc) return false;
    try {
      const list = await api.get<Array<{ status: string; records: AgendaRecord[] }>>(
        `/agenda-views${qs({ user_cc: cc, limit: 1, order: "created_at.desc" })}`
      );
      const data = list[0];
      if (!data) return false;
      if (data.status === "pending" || data.status === "approved" || data.status === "returned") {
        if (cc === user?.id) {
          setHasPendingAgendaView(data.status === "pending");
        }
        const savedRecords = data.records as AgendaRecord[];
        if (savedRecords && savedRecords.length > 0) {
          setRecordsByDocente((prev) => ({
            ...prev,
            [cc]: savedRecords,
          }));
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [docenteId, user?.id]);

  // Auto-load on docente change — always fetch fresh data
  useEffect(() => {
    if (docenteId) {
      loadFromAgendaView();
    }
  }, [docenteId]);

  // Detectar transición del interruptor del sistema (false → true): nuevo semestre.
  // Limpia memoria local de registros y horarios para que ningún docente conserve datos del semestre anterior.
  const { enabled: systemEnabled } = useSystemEnabled();
  const prevEnabledRef = React.useRef<boolean>(systemEnabled);
  useEffect(() => {
    if (prevEnabledRef.current === false && systemEnabled === true) {
      console.log("[AgendaContext] Nuevo semestre detectado: limpiando memoria local.");
      setRecordsByDocente({});
      setScheduleByDocente({});
      setHasPendingAgendaView(false);
      // Re-cargar (encontrará 0 registros para el nuevo semestre)
      if (docenteId) loadFromAgendaView();
    }
    prevEnabledRef.current = systemEnabled;
  }, [systemEnabled, docenteId, loadFromAgendaView]);

  const metricas = useMemo<MetricasPie>(() => {
    const prodIds = subfunctions.filter((s) => s.sectionId === "produccion").map((s) => s.id);
    const actIds = subfunctions.filter((s) => s.sectionId === "actividades").map((s) => s.id);

    const totalProd = records
      .filter((r) => prodIds.includes(r.subfunctionId))
      .reduce((sum, r) => sum + r.totalHoras, 0);
    const totalAct = records
      .filter((r) => actIds.includes(r.subfunctionId))
      .reduce((sum, r) => sum + r.totalHoras, 0);

    const total = totalProd + totalAct;
    return {
      totalHorasSemestrales: total,
      promedioHorasSemana: total / 18,
      horasSemestreDefecto,
      horasFaltantes: horasSemestreDefecto - total,
    };
  }, [records, horasSemestreDefecto]);

  return (
    <AgendaContext.Provider
      value={{
        dropdownOptions,
        addDropdownOption,
        records,
        addRecord,
        updateRecord,
        deleteRecord,
        upsertRecord,
        getRecordsBySubfunction,
        metricas,
        horasSemestreDefecto,
        setHorasSemestreDefecto,
        activeSubfunction,
        setActiveSubfunction,
        searchTerm,
        setSearchTerm,
        selectedDocente,
        setSelectedDocente,
        docentesList,
        saveSchedule,
        getSchedule,
        hasSchedule,
        editingRecord,
        setEditingRecord,
        hasPendingAgendaView,
        loadFromAgendaView,
        isAgendaReadOnly,
        isOwnAgendaPendingReview,
        canSupervisorReviewSubordinate: canSupervisorEditSubordinate,
        canAccessScheduleDistribution: canAccessSchedule,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};
