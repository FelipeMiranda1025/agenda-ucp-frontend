import { createContext } from "react";
import type { DropdownOption, Record as AgendaRecord, MetricasPie, ScheduleData, ScheduleBlock } from "@/types/agenda";
import type { DocentePlanta } from "@/types/docentePlanta";

/** Shared context ref — must live in its own module so lazy route chunks use the same instance as App. */
export interface AgendaContextType {
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
  loadFromAgendaView: (targetCc?: string) => Promise<boolean>;
  isAgendaReadOnly: boolean;
  isOwnAgendaPendingReview: boolean;
  canSupervisorReviewSubordinate: boolean;
  canSupervisorAmendApprovedAgenda: boolean;
  canAccessScheduleDistribution: boolean;
}

export const AgendaContext = createContext<AgendaContextType | null>(null);
