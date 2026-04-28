import ExcelJS from "exceljs";
import type { Record as AgendaRecord, ScheduleData } from "@/types/agenda";
import type { DocentePlanta } from "@/types/docentePlanta";
import { DAYS, HOURS, formatHour } from "@/data/scheduleConstants";

interface AuthUser {
  id: string;
  firstName: string;
  secondName?: string | null;
  firstLastName: string;
  secondLastName?: string | null;
}

interface ExportArgs {
  user: AuthUser;
  selectedDocente: DocentePlanta | null;
  records: AgendaRecord[];
  schedule: ScheduleData | null;
  semesterLabel?: string;
  programa?: string;
}

// Tailwind bg-* class → ARGB hex used by ExcelJS fills
const TAILWIND_TO_ARGB: { [k: string]: string } = {
  "bg-blue-500": "FF3B82F6",
  "bg-emerald-500": "FF10B981",
  "bg-amber-500": "FFF59E0B",
  "bg-purple-500": "FFA855F7",
  "bg-rose-500": "FFF43F5E",
  "bg-orange-500": "FFF97316",
  "bg-teal-500": "FF14B8A6",
  "bg-indigo-500": "FF6366F1",
  "bg-slate-500": "FF64748B",
};

const BORDER_THIN: ExcelJS.Borders = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
} as ExcelJS.Borders;

const FILL_HEADER = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFD9D9D9" },
};
const FILL_TOTAL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFF2F2F2" },
};
const FILL_TITLE = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFBDD7EE" },
};

function fullName(d: { firstName: string; secondName?: string | null; firstLastName: string; secondLastName?: string | null }) {
  return [d.firstName, d.secondName, d.firstLastName, d.secondLastName]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" ");
}

function setRow(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  values: { [col: string]: string | number | { formula: string } | null },
  opts?: { bold?: boolean; fill?: ExcelJS.Fill; border?: boolean; align?: ExcelJS.Alignment["horizontal"]; wrap?: boolean }
) {
  const row = ws.getRow(rowIdx);
  for (const [col, val] of Object.entries(values)) {
    const cell = row.getCell(col);
    if (val !== null && typeof val === "object" && "formula" in val) {
      cell.value = { formula: val.formula } as ExcelJS.CellFormulaValue;
    } else {
      cell.value = val as ExcelJS.CellValue;
    }
    if (opts?.bold) cell.font = { bold: true };
    if (opts?.fill) cell.fill = opts.fill;
    if (opts?.border !== false) cell.border = BORDER_THIN;
    cell.alignment = {
      vertical: "middle",
      horizontal: opts?.align ?? "left",
      wrapText: opts?.wrap ?? true,
    };
  }
  row.height = 18;
}

export async function exportAgendaToExcel({
  user,
  selectedDocente,
  records,
  schedule,
  semesterLabel = "2026-1",
  programa,
}: ExportArgs): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "UCP Agenda";
  wb.created = new Date();

  // Resolve docente name: if "Yo" placeholder, use the user
  const isSelf = !selectedDocente || selectedDocente.firstName === "Yo";
  const docenteName = isSelf ? fullName(user) : fullName(selectedDocente);

  // Try to infer programa from records if not provided
  const inferredPrograma =
    programa ||
    (records.find((r) => r.subfunctionId === "docencia-directa")?.data?.["programa"] as string | undefined) ||
    "—";

  // ============================================================
  // SHEET 1: AGENDA (replica de la plantilla)
  // ============================================================
  const ws = wb.addWorksheet("Agenda", {
    views: [{ showGridLines: false }],
  });
  ws.columns = [
    { width: 4 },   // A
    { width: 50 },  // B
    { width: 22 },  // C
    { width: 14 },  // D
    { width: 14 },  // E
    { width: 14 },  // F
  ];

  // ----- Header (rows 1-6) -----
  ws.mergeCells("B2:F2");
  ws.getCell("B2").value = "AGENDA SEMESTRAL DE TRABAJO";
  ws.getCell("B2").font = { bold: true, size: 14 };
  ws.getCell("B2").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("B2").fill = FILL_TITLE;
  ws.getCell("B2").border = BORDER_THIN;
  ws.getRow(2).height = 26;

  ws.mergeCells("B3:F3");
  ws.getCell("B3").value = `NOMBRE DEL DOCENTE: ${docenteName}`;
  ws.getCell("B3").font = { bold: true };
  ws.getCell("B3").border = BORDER_THIN;
  ws.getCell("B3").alignment = { horizontal: "left", vertical: "middle" };

  ws.mergeCells("B4:F4");
  ws.getCell("B4").value = `PROGRAMA ACADÉMICO: ${inferredPrograma}`;
  ws.getCell("B4").font = { bold: true };
  ws.getCell("B4").border = BORDER_THIN;

  ws.mergeCells("B5:F5");
  ws.getCell("B5").value = `SEMESTRE LECTIVO: ${semesterLabel}`;
  ws.getCell("B5").font = { bold: true };
  ws.getCell("B5").border = BORDER_THIN;

  ws.mergeCells("B6:F6");
  ws.getCell("B6").value = `PERIODO: ${semesterLabel}`;
  ws.getCell("B6").font = { bold: true };
  ws.getCell("B6").border = BORDER_THIN;

  // ----- Section 1: PRODUCCIÓN -----
  let row = 8;
  const productionStart = row;

  // 1.1 Docencia directa
  const dd = records.filter((r) => r.subfunctionId === "docencia-directa");
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "1.1 Docencia directa (asignatura, semestre y programa)",
    D: "Horas semana",
    E: "# Semanas",
    F: "Total horas",
  }, { bold: true, fill: FILL_HEADER, align: "center" });
  row++;
  const dd1Start = row;
  if (dd.length === 0) {
    setRow(ws, row, { B: "—", C: "—", D: 0, E: 0, F: 0 });
    row++;
  } else {
    for (const r of dd) {
      setRow(ws, row, {
        B: String(r.data["asignatura"] ?? ""),
        C: String(r.data["programa"] ?? ""),
        D: Number(r.data["horasSemana"] ?? 0),
        E: Number(r.data["cantidadSemanas"] ?? 0),
        F: r.totalHoras,
      }, { align: "left" });
      ws.getCell(`D${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`E${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`F${row}`).alignment = { horizontal: "center", vertical: "middle" };
      row++;
    }
  }
  const dd1End = row - 1;
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Total docencia directa",
    D: { formula: `F${row}/16` },
    F: { formula: `SUM(F${dd1Start}:F${dd1End})` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const dd1Total = row;
  row += 2;

  // 1.2 Docencia indirecta
  const di = records.filter((r) => r.subfunctionId === "docencia-indirecta");
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "1.2 Docencia indirecta",
    D: "Horas semana",
    E: "# Semanas",
    F: "Total horas",
  }, { bold: true, fill: FILL_HEADER, align: "center" });
  row++;
  const di1Start = row;
  if (di.length === 0) {
    ws.mergeCells(`B${row}:C${row}`);
    setRow(ws, row, { B: "—", D: 0, E: 0, F: 0 });
    row++;
  } else {
    for (const r of di) {
      ws.mergeCells(`B${row}:C${row}`);
      setRow(ws, row, {
        B: String(r.data["actividad"] ?? ""),
        D: Number(r.data["horasSemana"] ?? 0),
        E: Number(r.data["cantidadSemanas"] ?? 0),
        F: r.totalHoras,
      });
      ws.getCell(`D${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`E${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`F${row}`).alignment = { horizontal: "center", vertical: "middle" };
      row++;
    }
  }
  const di1End = row - 1;
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Total docencia indirecta",
    F: { formula: `SUM(F${di1Start}:F${di1End})` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const di1Total = row;
  row += 2;

  // 1.3 Trabajos de grado
  const tg = records.filter((r) => r.subfunctionId === "trabajos-grado");
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "1.3 Dirección y Asesorías en trabajos de grado",
    D: "#Estudiantes ó #Proyectos",
    E: "Horas/semestre",
    F: "Total horas",
  }, { bold: true, fill: FILL_HEADER, align: "center" });
  row++;
  const tg1Start = row;
  if (tg.length === 0) {
    ws.mergeCells(`B${row}:C${row}`);
    setRow(ws, row, { B: "—", D: 0, E: 0, F: 0 });
    row++;
  } else {
    for (const r of tg) {
      ws.mergeCells(`B${row}:C${row}`);
      setRow(ws, row, {
        B: String(r.data["tipoTrabajo"] ?? ""),
        D: Number(r.data["cantidadProyectos"] ?? 0),
        E: Number(r.data["cantidadHoras"] ?? 0),
        F: r.totalHoras,
      });
      ws.getCell(`D${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`E${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`F${row}`).alignment = { horizontal: "center", vertical: "middle" };
      row++;
    }
  }
  const tg1End = row - 1;
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Total trabajos de grado",
    F: { formula: `SUM(F${tg1Start}:F${tg1End})` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const tg1Total = row;
  row += 2;

  // 1.4 Prácticas académicas
  const pa = records.filter((r) => r.subfunctionId === "practicas-academicas");
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "1.4 Asesorías de prácticas Académicas",
    D: "# estudiantes",
    E: "Horas/semestre",
    F: "Total horas",
  }, { bold: true, fill: FILL_HEADER, align: "center" });
  row++;
  const pa1Start = row;
  if (pa.length === 0) {
    ws.mergeCells(`B${row}:C${row}`);
    setRow(ws, row, { B: "—", D: 0, E: 0, F: 0 });
    row++;
  } else {
    for (const r of pa) {
      ws.mergeCells(`B${row}:C${row}`);
      setRow(ws, row, {
        B: String(r.data["actividad"] ?? ""),
        D: Number(r.data["cantidadEstudiantes"] ?? 0),
        E: Number(r.data["cantidadHoras"] ?? 0),
        F: r.totalHoras,
      });
      ws.getCell(`D${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`E${row}`).alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell(`F${row}`).alignment = { horizontal: "center", vertical: "middle" };
      row++;
    }
  }
  const pa1End = row - 1;
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Total prácticas",
    F: { formula: `SUM(F${pa1Start}:F${pa1End})` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const pa1Total = row;
  row += 2;

  // Total docencia
  setRow(ws, row, {
    D: "Horas Actividades de Docencia",
    F: { formula: `F${dd1Total}+F${di1Total}+F${tg1Total}+F${pa1Total}` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const docenciaTotalRow = row;
  const productionEnd = row;

  // Vertical merge "1. PRODUCCIÓN"
  ws.mergeCells(`A${productionStart}:A${productionEnd}`);
  const aProd = ws.getCell(`A${productionStart}`);
  aProd.value = "1. PRODUCCIÓN";
  aProd.alignment = { vertical: "middle", horizontal: "center", textRotation: 90, wrapText: true };
  aProd.font = { bold: true, size: 12 };
  aProd.fill = FILL_TITLE;
  aProd.border = BORDER_THIN;

  row += 2;

  // ----- Section 2: ACTIVIDADES DIFERENTES A LA DOCENCIA -----
  const activitiesStart = row;

  const activitySections: Array<{
    code: string;
    title: string;
    sfId: string;
    cols: { D: string; E: string; F: string };
    fields: { B: string; D: string; E: string };
  }> = [
    {
      code: "2.1",
      title: "2.1 Actividades de investigación y Desarrollo tecnológico",
      sfId: "investigacion",
      cols: { D: "Horas semana", E: "# Semanas", F: "Total horas" },
      fields: { B: "actividad", D: "horasSemana", E: "cantidadSemanas" },
    },
    {
      code: "2.2",
      title: "2.2 Actividades de Proyección social",
      sfId: "proyeccion-social",
      cols: { D: "Horas semana", E: "# Semanas", F: "Total horas" },
      fields: { B: "actividad", D: "horasSemana", E: "cantidadSemanas" },
    },
    {
      code: "2.3",
      title: "2.3 Actividades complementarias",
      sfId: "complementarias",
      cols: { D: "Horas semana", E: "# Semanas", F: "Total horas" },
      fields: { B: "actividad", D: "horasSemana", E: "cantidadSemanas" },
    },
    {
      code: "2.4",
      title: "2.4 Formación de docentes",
      sfId: "formacion-docentes",
      cols: { D: "Horas asignadas", E: "# Semanas", F: "Total horas" },
      fields: { B: "actividad", D: "horasSemana", E: "cantidadSemanas" },
    },
    {
      code: "2.5",
      title: "2.5 Actividades académico-administrativas",
      sfId: "administrativas",
      cols: { D: "Horas semana", E: "# Semanas", F: "Total horas" },
      fields: { B: "actividad", D: "horasSemana", E: "cantidadSemanas" },
    },
  ];

  const totalsRows: { [code: string]: number } = {};

  for (const sec of activitySections) {
    const recs = records.filter((r) => r.subfunctionId === sec.sfId);
    ws.mergeCells(`B${row}:C${row}`);
    setRow(ws, row, {
      B: sec.title,
      D: sec.cols.D,
      E: sec.cols.E,
      F: sec.cols.F,
    }, { bold: true, fill: FILL_HEADER, align: "center" });
    row++;
    const start = row;
    if (recs.length === 0) {
      ws.mergeCells(`B${row}:C${row}`);
      setRow(ws, row, { B: "—", D: 0, E: 0, F: 0 });
      row++;
    } else {
      for (const r of recs) {
        ws.mergeCells(`B${row}:C${row}`);
        setRow(ws, row, {
          B: String(r.data[sec.fields.B] ?? ""),
          D: Number(r.data[sec.fields.D] ?? 0),
          E: Number(r.data[sec.fields.E] ?? 0),
          F: r.totalHoras,
        });
        ws.getCell(`D${row}`).alignment = { horizontal: "center", vertical: "middle" };
        ws.getCell(`E${row}`).alignment = { horizontal: "center", vertical: "middle" };
        ws.getCell(`F${row}`).alignment = { horizontal: "center", vertical: "middle" };
        row++;
      }
    }
    const end = row - 1;
    ws.mergeCells(`B${row}:C${row}`);
    setRow(ws, row, {
      B: `Total ${sec.code}`,
      F: { formula: `SUM(F${start}:F${end})` },
    }, { bold: true, fill: FILL_TOTAL, align: "right" });
    totalsRows[sec.code] = row;
    row += 2;
  }

  // Subtotal investigación + proyección social + formación
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Total investigación + Proyección social + Formación Docente",
    F: { formula: `F${totalsRows["2.1"]}+F${totalsRows["2.2"]}+F${totalsRows["2.4"]}` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  row += 2;

  // Total horas diferentes a la docencia
  setRow(ws, row, {
    D: "Horas Diferentes a la Docencia",
    F: {
      formula: `F${totalsRows["2.1"]}+F${totalsRows["2.2"]}+F${totalsRows["2.3"]}+F${totalsRows["2.4"]}+F${totalsRows["2.5"]}`,
    },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const noDocenciaTotalRow = row;
  const activitiesEnd = row;

  ws.mergeCells(`A${activitiesStart}:A${activitiesEnd}`);
  const aAct = ws.getCell(`A${activitiesStart}`);
  aAct.value = "2. ACTIVIDADES DIFERENTES A LA DOCENCIA";
  aAct.alignment = { vertical: "middle", horizontal: "center", textRotation: 90, wrapText: true };
  aAct.font = { bold: true, size: 12 };
  aAct.fill = FILL_TITLE;
  aAct.border = BORDER_THIN;

  row += 2;

  // ----- Final totals -----
  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Total horas semestre",
    D: { formula: `F${docenciaTotalRow}+F${noDocenciaTotalRow}` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const totalSemRow = row;
  row++;

  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Promedio semanal semestre",
    D: { formula: `D${totalSemRow}/23` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  row++;

  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Horas semestre",
    D: 920,
  }, { bold: true, fill: FILL_TOTAL, align: "right" });
  const horasSemRow = row;
  row++;

  ws.mergeCells(`B${row}:C${row}`);
  setRow(ws, row, {
    B: "Horas faltantes",
    D: { formula: `D${horasSemRow}-D${totalSemRow}` },
  }, { bold: true, fill: FILL_TOTAL, align: "right" });

  // ============================================================
  // SHEET 2: HORARIO PERMANENCIA
  // ============================================================
  const ws2 = wb.addWorksheet("Horario Permanencia", {
    views: [{ showGridLines: false }],
  });
  ws2.columns = [
    { width: 14 }, // hora
    { width: 18 }, // L
    { width: 18 }, // M
    { width: 18 }, // X
    { width: 18 }, // J
    { width: 18 }, // V
    { width: 18 }, // S
  ];

  ws2.mergeCells("A1:G1");
  ws2.getCell("A1").value = `HORARIO DE PERMANENCIA — ${docenteName}`;
  ws2.getCell("A1").font = { bold: true, size: 13 };
  ws2.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  ws2.getCell("A1").fill = FILL_TITLE;
  ws2.getCell("A1").border = BORDER_THIN;
  ws2.getRow(1).height = 24;

  // Header row
  const headerRow = 3;
  const headerCells = ["Hora", ...DAYS];
  headerCells.forEach((h, i) => {
    const cell = ws2.getRow(headerRow).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = FILL_HEADER;
    cell.border = BORDER_THIN;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Build a lookup by day/hour
  const blockMap = new Map<string, { label: string; color: string }>();
  if (schedule?.blocks) {
    for (const b of schedule.blocks) {
      blockMap.set(`${b.day}-${b.hour}`, { label: b.label, color: b.color });
    }
  }

  HOURS.forEach((h, idx) => {
    const r = headerRow + 1 + idx;
    const hourCell = ws2.getRow(r).getCell(1);
    hourCell.value = formatHour(h);
    hourCell.alignment = { horizontal: "center", vertical: "middle" };
    hourCell.font = { bold: true };
    hourCell.border = BORDER_THIN;
    hourCell.fill = FILL_HEADER;

    for (let day = 0; day < 6; day++) {
      const cell = ws2.getRow(r).getCell(day + 2);
      const block = blockMap.get(`${day}-${h}`);
      if (block) {
        cell.value = block.label;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: TAILWIND_TO_ARGB[block.color] || "FF94A3B8" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 10 };
      }
      cell.border = BORDER_THIN;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    }
    ws2.getRow(r).height = 22;
  });

  // ----- Save -----
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const safeName = docenteName.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
  const a = document.createElement("a");
  a.href = url;
  a.download = `Agenda_${safeName}_${semesterLabel}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =====================================================================
// Batch export: builds one workbook per docente and bundles them in a ZIP
// when there are 2+. Single docente → falls through to standard download.
// =====================================================================
import JSZip from "jszip";

export interface BatchAgendaItem {
  user: AuthUser;
  selectedDocente?: DocentePlanta | null;
  records: AgendaRecord[];
  schedule: ScheduleData | null;
  programa?: string;
}

/**
 * Download one or many agendas. With 1 item it produces a single .xlsx;
 * with 2+ items it bundles them into a .zip. Reuses exportAgendaToExcel by
 * intercepting its anchor-based download to capture the produced Blob.
 */
export async function exportAgendasBatch(
  items: BatchAgendaItem[],
  opts: { zipName?: string; semesterLabel?: string } = {}
): Promise<void> {
  if (items.length === 0) return;
  const semesterLabel = opts.semesterLabel ?? "2026-1";

  if (items.length === 1) {
    await exportAgendaToExcel({
      user: items[0].user,
      selectedDocente: items[0].selectedDocente ?? null,
      records: items[0].records,
      schedule: items[0].schedule,
      semesterLabel,
      programa: items[0].programa,
    });
    return;
  }

  async function captureWorkbook(item: BatchAgendaItem) {
    let captured: { blob: Blob; filename: string } | null = null;
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    const origAppend = document.body.appendChild.bind(document.body);

    URL.createObjectURL = ((blob: Blob) => {
      captured = { blob, filename: "" };
      return "blob:capture";
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;

    document.body.appendChild = ((node: any) => {
      if (node && node.tagName === "A" && captured) {
        captured.filename = node.download || "agenda.xlsx";
        node.click = () => {};
        return node;
      }
      return origAppend(node);
    }) as typeof document.body.appendChild;

    try {
      await exportAgendaToExcel({
        user: item.user,
        selectedDocente: item.selectedDocente ?? null,
        records: item.records,
        schedule: item.schedule,
        semesterLabel,
        programa: item.programa,
      });
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
      document.body.appendChild = origAppend;
    }

    if (!captured) throw new Error("No se pudo capturar el archivo de agenda");
    return captured as { blob: Blob; filename: string };
  }

  const zip = new JSZip();
  for (const item of items) {
    const { blob, filename } = await captureWorkbook(item);
    zip.file(filename, await blob.arrayBuffer());
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.zipName ?? "Agendas"}_${semesterLabel}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
