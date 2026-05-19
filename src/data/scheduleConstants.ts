/** Paleta oficial UCP para bloques de distribución horaria (solo estos colores). */
export const SCHEDULE_BLOCK_PALETTE = [
  "rgb(0, 155, 216)",
  "rgb(219, 166, 48)",
  "rgb(123, 175, 77)",
  "rgb(216, 49, 53)",
  "rgb(245, 134, 52)",
  "rgb(246, 217, 174)",
  "rgb(213, 215, 162)",
  "rgb(154, 48, 49)",
  "rgb(248, 211, 118)",
  "rgb(168, 124, 82)",
  "rgb(0, 107, 152)", // RGB(0,107,452) del lineamiento → valor válido 152
  "rgb(145, 216, 247)",
  "rgb(239, 210, 198)",
  "rgb(235, 240, 204)",
  "rgb(174, 175, 144)",
] as const;

export const SUBFUNCTION_COLORS: { [key: string]: string } = {
  "docencia-directa": SCHEDULE_BLOCK_PALETTE[0],
  "docencia-indirecta": SCHEDULE_BLOCK_PALETTE[2],
  "trabajos-grado": SCHEDULE_BLOCK_PALETTE[1],
  "practicas-academicas": SCHEDULE_BLOCK_PALETTE[11],
  "investigacion": SCHEDULE_BLOCK_PALETTE[3],
  "proyeccion-social": SCHEDULE_BLOCK_PALETTE[4],
  "complementarias": SCHEDULE_BLOCK_PALETTE[9],
  "formacion-docentes": SCHEDULE_BLOCK_PALETTE[7],
  administrativas: SCHEDULE_BLOCK_PALETTE[10],
};

/** @deprecated Usar color RGB en línea; se mantiene por compatibilidad. */
export const SUBFUNCTION_BORDER_COLORS: { [key: string]: string } = Object.fromEntries(
  Object.entries(SUBFUNCTION_COLORS).map(([id, color]) => [id, color])
);

export const DEFAULT_BLOCK_COLOR = SCHEDULE_BLOCK_PALETTE[0];

export function getSubfunctionBlockColor(subfunctionId: string): string {
  return SUBFUNCTION_COLORS[subfunctionId] ?? DEFAULT_BLOCK_COLOR;
}

/** Resuelve color guardado (legacy tailwind) al RGB de la paleta. */
export function resolveBlockColor(subfunctionId: string, stored?: string): string {
  if (stored?.startsWith("rgb(")) return stored;
  return getSubfunctionBlockColor(subfunctionId);
}

export function getBlockTextColor(bgRgb: string): string {
  const m = bgRgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return "#ffffff";
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "rgb(33, 33, 33)" : "#ffffff";
}

export function blockColorStyles(bgColor: string): {
  backgroundColor: string;
  borderColor: string;
  color: string;
} {
  return {
    backgroundColor: bgColor,
    borderColor: bgColor,
    color: getBlockTextColor(bgColor),
  };
}

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
