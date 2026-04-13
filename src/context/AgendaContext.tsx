import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { DropdownOption, Record as AgendaRecord, MetricasPie, ScheduleBlock, ScheduleData } from "@/types/agenda";
import { initialDropdownOptions } from "@/data/initialDropdownOptions";
import { subfunctions } from "@/data/subfunctions";
import { DocentePlanta } from "@/types/docentePlanta";
import { supabase } from "@/integrations/supabase/client";
import { useSubordinatesWithNames, SubordinateDocente } from "@/hooks/useDatabase";
import { useAuth } from "@/context/AuthContext";

interface AgendaContextType {
  dropdownOptions: DropdownOption[];
  addDropdownOption: (category: string, value: string) => void;
  records: AgendaRecord[];
  addRecord: (record: Omit<AgendaRecord, "id" | "createdAt">) => void;
  updateRecord: (id: string, data: AgendaRecord["data"], totalHoras: number) => void;
  deleteRecord: (id: string) => void;
  upsertRecord: (subfunctionId: string, data: AgendaRecord["data"], totalHoras: number) => void;
  getRecordsBySubfunction: (subfunctionId: string) => AgendaRecord[];
  metricas: MetricasPie;
  horasSemestreDefecto: number;
  setHorasSemestreDefecto: (v: number) => void;
  activeSubfunction: string;
  setActiveSubfunction: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (t: string) => void;
  selectedDocente: DocentePlanta | null;
  setSelectedDocente: (d: DocentePlanta | null) => void;
  docentesList: DocentePlanta[];
  saveSchedule: (blocks: ScheduleBlock[]) => void;
  getSchedule: () => ScheduleData | null;
  hasSchedule: boolean;
  editingRecord: AgendaRecord | null;
  setEditingRecord: (r: AgendaRecord | null) => void;
  hasPendingAgendaView: boolean;
  loadFromAgendaView: () => Promise<boolean>;
}

const AgendaContext = createContext<AgendaContextType | null>(null);

export const useAgenda = () => {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda must be used within AgendaProvider");
  return ctx;
};

export const AgendaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: subordinates = [] } = useSubordinatesWithNames(user?.id);

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
    for (const sub of subordinates) {
      list.push({
        id: sub.id,
        firstName: sub.firstName,
        secondName: sub.secondName,
        firstLastName: sub.firstLastName,
        secondLastName: sub.secondLastName,
      });
    }
    return list;
  }, [user, subordinates]);

  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>(initialDropdownOptions);
  const [recordsByDocente, setRecordsByDocente] = useState<{ [docenteId: string]: AgendaRecord[] }>({});
  const [scheduleByDocente, setScheduleByDocente] = useState<{ [docenteId: string]: ScheduleData }>({});
  const [horasSemestreDefecto, setHorasSemestreDefecto] = useState(920);
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

    const prepWeekly = totalWeeklyHours * 0.5; // Preparación de clases
    const asesWeekly = numberOfSubjects;        // Asesorías: 1h por asignatura
    const weeks = 18;

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
  }, [docenteId]);

  const addDropdownOption = useCallback((category: string, value: string) => {
    setDropdownOptions((prev) => [
      ...prev,
      { id: String(Date.now()), category, value },
    ]);
  }, []);

  const addRecord = useCallback((record: Omit<AgendaRecord, "id" | "createdAt">) => {
    if (!docenteId) return;
    setRecordsByDocente((prev) => ({
      ...prev,
      [docenteId]: [
        ...(prev[docenteId] || []),
        { ...record, id: String(Date.now()), createdAt: new Date().toISOString() },
      ],
    }));
  }, [docenteId]);

  const updateRecord = useCallback((id: string, data: AgendaRecord["data"], totalHoras: number) => {
    if (!docenteId) return;
    setRecordsByDocente((prev) => ({
      ...prev,
      [docenteId]: (prev[docenteId] || []).map((r) => (r.id === id ? { ...r, data, totalHoras } : r)),
    }));
  }, [docenteId]);

  const deleteRecord = useCallback((id: string) => {
    if (!docenteId) return;
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
  }, [docenteId, generateIndirectRecords]);

  // Upsert: match by subfunctionId + ALL string values in data (composite key)
  const upsertRecord = useCallback((subfunctionId: string, data: AgendaRecord["data"], totalHoras: number) => {
    if (!docenteId) return;
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
  }, [docenteId]);

  const getRecordsBySubfunction = useCallback(
    (subfunctionId: string) => records.filter((r) => r.subfunctionId === subfunctionId),
    [records]
  );

  const saveSchedule = useCallback((blocks: ScheduleBlock[]) => {
    if (!docenteId) return;
    setScheduleByDocente((prev) => ({
      ...prev,
      [docenteId]: {
        docenteId,
        blocks,
        lastModified: new Date().toISOString(),
      },
    }));
  }, [docenteId]);

  const getSchedule = useCallback(() => {
    return scheduleByDocente[docenteId] || null;
  }, [scheduleByDocente, docenteId]);

  const hasSchedule = useMemo(() => {
    const s = scheduleByDocente[docenteId];
    return !!s && s.blocks.length > 0;
  }, [scheduleByDocente, docenteId]);

  // Load agenda from agenda_views on login
  const loadFromAgendaView = useCallback(async (): Promise<boolean> => {
    if (!docenteId) return false;
    try {
      const { data, error } = await (supabase.from("agenda_views" as any) as any)
        .select("*")
        .eq("user_cc", docenteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return false;
      if (data.status === "pending" || data.status === "approved" || data.status === "returned") {
        setHasPendingAgendaView(data.status === "pending");
        const savedRecords = data.records as AgendaRecord[];
        if (savedRecords && savedRecords.length > 0) {
          setRecordsByDocente((prev) => ({
            ...prev,
            [docenteId]: savedRecords,
          }));
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [docenteId]);

  // Auto-load on docente change
  useEffect(() => {
    if (docenteId) {
      const existing = recordsByDocente[docenteId];
      if (!existing || existing.length === 0) {
        loadFromAgendaView();
      }
    }
  }, [docenteId]);

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
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};
