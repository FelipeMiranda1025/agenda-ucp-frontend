export const SUBFUNCTION_COLORS: { [key: string]: string } = {
  "docencia-directa": "bg-blue-500",
  "docencia-indirecta": "bg-emerald-500",
  "trabajos-grado": "bg-amber-500",
  "practicas-academicas": "bg-purple-500",
  "investigacion": "bg-rose-500",
  "proyeccion-social": "bg-orange-500",
  "complementarias": "bg-teal-500",
  "formacion-docentes": "bg-indigo-500",
  "administrativas": "bg-slate-500",
};

export const SUBFUNCTION_BORDER_COLORS: { [key: string]: string } = {
  "docencia-directa": "border-blue-600",
  "docencia-indirecta": "border-emerald-600",
  "trabajos-grado": "border-amber-600",
  "practicas-academicas": "border-purple-600",
  "investigacion": "border-rose-600",
  "proyeccion-social": "border-orange-600",
  "complementarias": "border-teal-600",
  "formacion-docentes": "border-indigo-600",
  "administrativas": "border-slate-600",
};

export const DAY_KEYS = ["day.monday", "day.tuesday", "day.wednesday", "day.thursday", "day.friday", "day.saturday"];
export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 to 21

export function getTranslatedDays(t: (key: string) => string): string[] {
  return DAY_KEYS.map((k) => t(k));
}

export function formatHour(hour: number): string {
  const h = hour > 12 ? hour - 12 : hour;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${h}:00 ${suffix}`;
}
