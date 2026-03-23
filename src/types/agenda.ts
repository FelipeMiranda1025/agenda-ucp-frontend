export interface DropdownOption {
  id: string;
  category: string;
  value: string;
}

export interface SubfunctionField {
  name: string;
  label: string;
  labelKey?: string;
  type: "dropdown" | "number" | "calculated";
  category?: string;
  calculatedFrom?: { field1: string; field2: string; operation: "multiply" };
}

export interface SubfunctionConfig {
  id: string;
  sectionId: "produccion" | "actividades" | "horario";
  title: string;
  shortTitle: string;
  fields: SubfunctionField[];
}

export interface Record {
  id: string;
  subfunctionId: string;
  data: { [fieldName: string]: string | number };
  totalHoras: number;
  createdAt: string;
}

export interface MetricasPie {
  totalHorasSemestrales: number;
  promedioHorasSemana: number;
  horasSemestreDefecto: number;
  horasFaltantes: number;
}

export interface ScheduleBlock {
  id: string;
  recordId: string;
  subfunctionId: string;
  label: string;
  color: string;
  day: number; // 0=Lunes, 5=Sábado
  hour: number; // 8-21
}

export interface ScheduleData {
  docenteId: string;
  blocks: ScheduleBlock[];
  lastModified: string;
}
