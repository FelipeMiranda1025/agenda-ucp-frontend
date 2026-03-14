import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { DropdownOption, Record as AgendaRecord, MetricasPie, ScheduleBlock, ScheduleData } from "@/types/agenda";
import { initialDropdownOptions } from "@/data/initialDropdownOptions";
import { subfunctions } from "@/data/subfunctions";
import { DocentePlanta } from "@/types/docentePlanta";
import { docentesPlanta } from "@/data/docentesPlanta";

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
}

const AgendaContext = createContext<AgendaContextType | null>(null);

export const useAgenda = () => {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda must be used within AgendaProvider");
  return ctx;
};

export const AgendaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>(initialDropdownOptions);
  const [recordsByDocente, setRecordsByDocente] = useState<{ [docenteId: string]: AgendaRecord[] }>({});
  const [scheduleByDocente, setScheduleByDocente] = useState<{ [docenteId: string]: ScheduleData }>({});
  const [horasSemestreDefecto, setHorasSemestreDefecto] = useState(920);
  const [activeSubfunction, setActiveSubfunction] = useState("docencia-directa");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocente, setSelectedDocente] = useState<DocentePlanta | null>(docentesPlanta[0]);

  const docenteId = selectedDocente?.id ?? "";
  const records = useMemo(() => recordsByDocente[docenteId] || [], [recordsByDocente, docenteId]);

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
    setRecordsByDocente((prev) => ({
      ...prev,
      [docenteId]: (prev[docenteId] || []).filter((r) => r.id !== id),
    }));
  }, [docenteId]);

  // Upsert: find existing record with same subfunctionId and same primary key (first string value in data), update or create
  const upsertRecord = useCallback((subfunctionId: string, data: AgendaRecord["data"], totalHoras: number) => {
    if (!docenteId) return;
    setRecordsByDocente((prev) => {
      const existing = prev[docenteId] || [];
      // Find primary key: first string value in data
      const primaryKey = Object.entries(data).find(([, v]) => typeof v === "string")?.[1] as string | undefined;
      const match = primaryKey
        ? existing.find((r) => r.subfunctionId === subfunctionId && Object.values(r.data).includes(primaryKey))
        : null;

      if (match) {
        return {
          ...prev,
          [docenteId]: existing.map((r) => (r.id === match.id ? { ...r, data, totalHoras } : r)),
        };
      } else {
        return {
          ...prev,
          [docenteId]: [
            ...existing,
            { id: String(Date.now()), subfunctionId, data, totalHoras, createdAt: new Date().toISOString() },
          ],
        };
      }
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
        docentesList: docentesPlanta,
        saveSchedule,
        getSchedule,
        hasSchedule,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};
