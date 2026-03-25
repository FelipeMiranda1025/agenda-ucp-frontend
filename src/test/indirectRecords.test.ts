import { describe, it, expect } from "vitest";
import { Record as AgendaRecord } from "@/types/agenda";

// Extract the indirect record generation logic for testing
function generateIndirectRecords(allRecords: AgendaRecord[], docenteId: string): AgendaRecord[] {
  const directRecords = allRecords.filter((r) => r.subfunctionId === "docencia-directa");
  const withoutAutoIndirect = allRecords.filter(
    (r) => !(r.subfunctionId === "docencia-indirecta" && r.data["_auto"] === "1")
  );

  if (directRecords.length === 0) return withoutAutoIndirect;

  const totalWeeklyHours = directRecords.reduce((sum, r) => sum + (Number(r.data["horasSemana"]) || 0), 0);
  const numberOfSubjects = directRecords.length;

  const prepWeekly = totalWeeklyHours * 0.5;
  const asesWeekly = numberOfSubjects; // 1h por asignatura
  const weeks = 18;

  const autoRecords: AgendaRecord[] = [];

  if (prepWeekly > 0) {
    autoRecords.push({
      id: `auto-prep-${docenteId}`,
      subfunctionId: "docencia-indirecta",
      data: { actividad: "Preparación de clases", horasSemana: prepWeekly, cantidadSemanas: weeks, _auto: "1" },
      totalHoras: prepWeekly * weeks,
      createdAt: new Date().toISOString(),
    });
  }

  if (asesWeekly > 0) {
    autoRecords.push({
      id: `auto-ases-${docenteId}`,
      subfunctionId: "docencia-indirecta",
      data: { actividad: "Asesorías de estudiantes", horasSemana: asesWeekly, cantidadSemanas: weeks, _auto: "1" },
      totalHoras: asesWeekly * weeks,
      createdAt: new Date().toISOString(),
    });
  }

  return [...withoutAutoIndirect, ...autoRecords];
}

const makeDirectRecord = (id: string, horasSemana: number): AgendaRecord => ({
  id,
  subfunctionId: "docencia-directa",
  data: { asignatura: `Materia ${id}`, horasSemana, cantidadSemanas: 18 },
  totalHoras: horasSemana * 18,
  createdAt: new Date().toISOString(),
});

describe("generateIndirectRecords", () => {
  it("sin registros directos no genera indirectos", () => {
    const result = generateIndirectRecords([], "doc1");
    expect(result).toHaveLength(0);
  });

  it("1 materia de 4h genera: preparación 2h/sem y asesorías 1h/sem", () => {
    const records = [makeDirectRecord("1", 4)];
    const result = generateIndirectRecords(records, "doc1");
    const prep = result.find(r => r.data["actividad"] === "Preparación de clases");
    const ases = result.find(r => r.data["actividad"] === "Asesorías de estudiantes");

    expect(prep).toBeDefined();
    expect(prep!.data["horasSemana"]).toBe(2); // 4 * 0.5
    expect(prep!.totalHoras).toBe(36); // 2 * 18

    expect(ases).toBeDefined();
    expect(ases!.data["horasSemana"]).toBe(1); // 1 materia = 1h
    expect(ases!.totalHoras).toBe(18); // 1 * 18
  });

  it("3 materias generan asesorías de 3h/sem (1h por materia)", () => {
    const records = [
      makeDirectRecord("1", 4),
      makeDirectRecord("2", 3),
      makeDirectRecord("3", 5),
    ];
    const result = generateIndirectRecords(records, "doc1");
    const ases = result.find(r => r.data["actividad"] === "Asesorías de estudiantes");

    expect(ases).toBeDefined();
    expect(ases!.data["horasSemana"]).toBe(3); // 3 materias
    expect(ases!.totalHoras).toBe(54); // 3 * 18
  });

  it("3 materias (4+3+5=12h) generan preparación de 6h/sem", () => {
    const records = [
      makeDirectRecord("1", 4),
      makeDirectRecord("2", 3),
      makeDirectRecord("3", 5),
    ];
    const result = generateIndirectRecords(records, "doc1");
    const prep = result.find(r => r.data["actividad"] === "Preparación de clases");

    expect(prep).toBeDefined();
    expect(prep!.data["horasSemana"]).toBe(6); // 12 * 0.5
    expect(prep!.totalHoras).toBe(108); // 6 * 18
  });

  it("reemplaza registros auto-generados previos", () => {
    const existing: AgendaRecord[] = [
      makeDirectRecord("1", 4),
      {
        id: "auto-ases-doc1",
        subfunctionId: "docencia-indirecta",
        data: { actividad: "Asesorías de estudiantes", horasSemana: 99, cantidadSemanas: 18, _auto: "1" },
        totalHoras: 99 * 18,
        createdAt: new Date().toISOString(),
      },
    ];
    const result = generateIndirectRecords(existing, "doc1");
    const asesRecords = result.filter(r => r.data["actividad"] === "Asesorías de estudiantes");

    expect(asesRecords).toHaveLength(1);
    expect(asesRecords[0].data["horasSemana"]).toBe(1); // 1 materia
  });

  it("preserva registros manuales de docencia indirecta", () => {
    const existing: AgendaRecord[] = [
      makeDirectRecord("1", 4),
      {
        id: "manual-1",
        subfunctionId: "docencia-indirecta",
        data: { actividad: "Otra actividad", horasSemana: 2, cantidadSemanas: 18 },
        totalHoras: 36,
        createdAt: new Date().toISOString(),
      },
    ];
    const result = generateIndirectRecords(existing, "doc1");
    const manual = result.find(r => r.id === "manual-1");

    expect(manual).toBeDefined();
    expect(result).toHaveLength(3); // manual + prep + ases
  });
});
