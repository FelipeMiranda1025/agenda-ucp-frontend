import type { ScheduleData } from "@/types/agenda";

const STORAGE_KEY = "ucp_agenda_schedules";

export function loadSchedulesFromStorage(): Record<string, ScheduleData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ScheduleData>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveScheduleToStorage(docenteId: string, data: ScheduleData): void {
  const all = loadSchedulesFromStorage();
  all[docenteId] = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function hasScheduleInStorage(docenteId: string): boolean {
  const s = loadSchedulesFromStorage()[docenteId];
  return !!s?.blocks?.length;
}

export function clearSchedulesFromStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
