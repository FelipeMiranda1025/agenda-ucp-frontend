export interface DropdownOption {
  id: string;
  category: string;
  value: string;
}

export interface SubfunctionField {
  name: string;
  label: string;
  type: "dropdown" | "number" | "calculated";
  category?: string; // for dropdown - links to dropdown_options category
  calculatedFrom?: { field1: string; field2: string; operation: "multiply" };
}

export interface SubfunctionConfig {
  id: string;
  sectionId: "produccion" | "actividades";
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
