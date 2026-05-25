import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import type { Record as AgendaRecord, ScheduleData } from "@/types/agenda";
import type { DocentePlanta } from "@/types/docentePlanta";
import { subfunctions } from "@/data/subfunctions";
import { DAYS, HOURS, formatHour } from "@/data/scheduleConstants";

const UCP_GREEN: [number, number, number] = [0, 128, 78];
const SEMESTER_WEEKS = 23;
const DEFAULT_SEMESTER_HOURS = 920;

interface AuthUser {
  id: string;
  firstName: string;
  secondName?: string | null;
  firstLastName: string;
  secondLastName?: string | null;
}

export interface ExportPdfArgs {
  user: AuthUser;
  selectedDocente: DocentePlanta | null;
  records: AgendaRecord[];
  schedule: ScheduleData | null;
  semesterLabel?: string;
  programa?: string;
}

export interface BatchAgendaPdfItem {
  user: AuthUser;
  selectedDocente?: DocentePlanta | null;
  records: AgendaRecord[];
  schedule: ScheduleData | null;
  programa?: string;
}

function fullName(d: {
  firstName: string;
  secondName?: string | null;
  firstLastName: string;
  secondLastName?: string | null;
}) {
  return [d.firstName, d.secondName, d.firstLastName, d.secondLastName]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" ");
}

function safeFileName(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

function resolveDocenteInfo(args: ExportPdfArgs) {
  const isSelf = !args.selectedDocente || args.selectedDocente.firstName === "Yo";
  const docenteName = isSelf ? fullName(args.user) : fullName(args.selectedDocente!);
  const programa =
    args.programa ||
    (args.records.find((r) => r.subfunctionId === "docencia-directa")?.data?.["programa"] as
      | string
      | undefined) ||
    "—";
  return { docenteName, programa };
}

function addHeader(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(...UCP_GREEN);
  doc.rect(14, y, 182, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, 16, y + 7);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  return y + 14;
}

function buildAgendaPdfDocument(args: ExportPdfArgs): jsPDF {
  const { records, schedule, semesterLabel = "2026-1" } = args;
  const { docenteName, programa } = resolveDocenteInfo(args);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 16;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Agenda Docente - UCP", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Docente: ${docenteName}`, margin, y);
  y += 6;
  doc.text(`Programa académico: ${programa}`, margin, y);
  y += 6;
  doc.text(`Semestre lectivo: ${semesterLabel}`, margin, y);
  y += 6;
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, margin, y);
  y += 10;

  const exportSections = subfunctions.filter((sf) => sf.sectionId !== "horario");
  let totalSemestral = 0;
  let docenciaTotal = 0;
  let otrasTotal = 0;

  for (const sf of exportSections) {
    const recs = records.filter((r) => r.subfunctionId === sf.id);
    const sectionTotal = recs.reduce((s, r) => s + (Number(r.totalHoras) || 0), 0);
    totalSemestral += sectionTotal;
    if (sf.sectionId === "produccion") docenciaTotal += sectionTotal;
    else otrasTotal += sectionTotal;

    if (y > 250) {
      doc.addPage();
      y = 16;
    }

    y = addHeader(doc, y, sf.title);

    const dataFields = sf.fields.filter((f) => f.type !== "calculated");
    const head = [
      ...dataFields.map((f) => f.label),
      "Total horas",
    ];
    const body =
      recs.length === 0
        ? [
            [
              ...dataFields.map(() => "—"),
              "0",
            ],
          ]
        : recs.map((r) => [
            ...dataFields.map((f) => String(r.data[f.name] ?? "")),
            String(r.totalHoras ?? 0),
          ]);

    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: UCP_GREEN,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal sección: ${sectionTotal} h`, margin, y);
    y += 10;
  }

  if (y > 230) {
    doc.addPage();
    y = 16;
  }

  y = addHeader(doc, y, "Resumen de horas");
  autoTable(doc, {
    startY: y,
    head: [["Concepto", "Horas semestre"]],
    body: [
      ["Total actividades de docencia (sección 1)", String(docenciaTotal)],
      ["Total actividades diferentes a la docencia (sección 2)", String(otrasTotal)],
      ["Total horas semestre", String(totalSemestral)],
      ["Promedio semanal (÷ 23 semanas)", (totalSemestral / SEMESTER_WEEKS).toFixed(1)],
      ["Horas meta semestre", String(DEFAULT_SEMESTER_HOURS)],
      ["Horas faltantes / excedentes", String(DEFAULT_SEMESTER_HOURS - totalSemestral)],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: UCP_GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  if (schedule?.blocks?.length) {
    if (y > 200) {
      doc.addPage();
      y = 16;
    }
    y = addHeader(doc, y, `Horario de permanencia — ${docenteName}`);

    const blockMap = new Map<string, string>();
    for (const b of schedule.blocks) {
      blockMap.set(`${b.day}-${b.hour}`, b.label);
    }

    const scheduleHead = ["Hora", ...DAYS];
    const scheduleBody = HOURS.map((h) => {
      const row: string[] = [formatHour(h)];
      for (let day = 0; day < 6; day++) {
        row.push(blockMap.get(`${day}-${h}`) || "");
      }
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: [scheduleHead],
      body: scheduleBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 1.5, halign: "center" },
      headStyles: { fillColor: UCP_GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 0: { halign: "left", cellWidth: 18 } },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Universidad Católica de Pereira — Agenda Docente — Pág. ${i} de ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  return doc;
}

export async function exportAgendaToPdf(args: ExportPdfArgs): Promise<void> {
  const { docenteName } = resolveDocenteInfo(args);
  const semesterLabel = args.semesterLabel ?? "2026-1";
  const doc = buildAgendaPdfDocument(args);
  doc.save(`Agenda_${safeFileName(docenteName)}_${semesterLabel}.pdf`);
}

export async function exportAgendasBatchPdf(
  items: BatchAgendaPdfItem[],
  opts: { zipName?: string; semesterLabel?: string } = {}
): Promise<void> {
  if (items.length === 0) return;
  const semesterLabel = opts.semesterLabel ?? "2026-1";

  if (items.length === 1) {
    await exportAgendaToPdf({
      user: items[0].user,
      selectedDocente: items[0].selectedDocente ?? null,
      records: items[0].records,
      schedule: items[0].schedule,
      semesterLabel,
      programa: items[0].programa,
    });
    return;
  }

  const zip = new JSZip();
  for (const item of items) {
    const { docenteName } = resolveDocenteInfo({
      user: item.user,
      selectedDocente: item.selectedDocente ?? null,
      records: item.records,
      schedule: item.schedule,
      programa: item.programa,
    });
    const doc = buildAgendaPdfDocument({
      user: item.user,
      selectedDocente: item.selectedDocente ?? null,
      records: item.records,
      schedule: item.schedule,
      semesterLabel,
      programa: item.programa,
    });
    const bytes = doc.output("arraybuffer");
    zip.file(`Agenda_${safeFileName(docenteName)}_${semesterLabel}.pdf`, bytes);
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
