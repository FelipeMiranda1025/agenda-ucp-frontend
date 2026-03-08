import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { DropdownOption, Record as AgendaRecord, MetricasPie } from "@/types/agenda";
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

  const docenteId = selectedDocente?.id ?? "";
  const records = useMemo(() => recordsByDocente[docenteId] || [], [recordsByDocente, docenteId]);
  const [horasSemestreDefecto, setHorasSemestreDefecto] = useState(920);
  const [activeSubfunction, setActiveSubfunction] = useState("docencia-directa");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocente, setSelectedDocente] = useState<DocentePlanta | null>(docentesPlanta[0]);

  const addDropdownOption = useCallback((category: string, value: string) => {
    setDropdownOptions((prev) => [
      ...prev,
      { id: String(Date.now()), category, value },
    ]);
  }, []);

  const addRecord = useCallback((record: Omit<AgendaRecord, "id" | "createdAt">) => {
    setRecords((prev) => [
      ...prev,
      { ...record, id: String(Date.now()), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const updateRecord = useCallback((id: string, data: AgendaRecord["data"], totalHoras: number) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, data, totalHoras } : r))
    );
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getRecordsBySubfunction = useCallback(
    (subfunctionId: string) => records.filter((r) => r.subfunctionId === subfunctionId),
    [records]
  );

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
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};
