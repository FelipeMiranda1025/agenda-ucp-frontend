import { describe, it, expect } from "vitest";
import { calculateHours } from "@/hooks/useDocenteConfig";
import { DocenteResponses, DEFAULT_RESPONSES } from "@/types/docenteConfig";

const make = (overrides: Partial<DocenteResponses> = {}): DocenteResponses => ({
  ...DEFAULT_RESPONSES,
  ...overrides,
});

describe("calculateHours", () => {
  it("devuelve 16h por defecto sin condiciones especiales", () => {
    const result = calculateHours(make());
    expect(result.finalDirectHours).toBe(16);
    expect(result.investigationHours).toBe(0);
    expect(result.reductions).toHaveLength(0);
  });

  it("investigador principal x1: 10h directas, 11h investigación", () => {
    const result = calculateHours(make({ investPrincipal1: true }));
    expect(result.directHours).toBe(10);
    expect(result.finalDirectHours).toBe(10);
    expect(result.investigationHours).toBe(11);
    expect(result.recommendedSubjects).toBe(3);
  });

  it("investigador principal x2: 4h directas", () => {
    const result = calculateHours(make({ investPrincipal2: true }));
    expect(result.finalDirectHours).toBe(4);
    expect(result.recommendedSubjects).toBe(1);
  });

  it("co-investigador x1: 13h directas, 6h investigación", () => {
    const result = calculateHours(make({ coInvestigador1: true }));
    expect(result.directHours).toBe(13);
    expect(result.investigationHours).toBe(6);
    expect(result.recommendedSubjects).toBe(4);
  });

  it("co-investigador x2: 9h directas", () => {
    const result = calculateHours(make({ coInvestigador2: true }));
    expect(result.finalDirectHours).toBe(9);
    expect(result.recommendedSubjects).toBe(3);
  });

  it("IP1 + CI1: 6h directas, 3 asignaturas", () => {
    const result = calculateHours(make({ investPrincipal1: true, coInvestigador1: true }));
    expect(result.finalDirectHours).toBe(6);
    expect(result.recommendedSubjects).toBe(3);
  });

  it("formación doctorado: 8h directas, 15h investigación", () => {
    const result = calculateHours(make({ isFormacionDoctorado: true }));
    expect(result.directHours).toBe(8);
    expect(result.investigationHours).toBe(15);
    expect(result.recommendedSubjects).toBe(2);
  });

  it("formación maestría: 12h directas, 7h investigación", () => {
    const result = calculateHours(make({ isFormacionMaestria: true }));
    expect(result.directHours).toBe(12);
    expect(result.investigationHours).toBe(7);
    expect(result.recommendedSubjects).toBe(4);
  });

  it("jefe depto/director pregrado: 6h directas", () => {
    const result = calculateHours(make({ isJefeDeptoPregrado: true }));
    expect(result.directHours).toBe(6);
    expect(result.recommendedSubjects).toBe(2);
  });

  it("decano: 4h directas", () => {
    const result = calculateHours(make({ isDecano: true }));
    expect(result.finalDirectHours).toBe(4);
    expect(result.recommendedSubjects).toBe(1);
  });

  it("vicerrector: 4h directas", () => {
    const result = calculateHours(make({ isVicerrector: true }));
    expect(result.directHours).toBe(4);
    expect(result.recommendedSubjects).toBe(1);
  });

  it("director doctorado: 4h directas", () => {
    const result = calculateHours(make({ isDirectorDoctorado: true }));
    expect(result.directHours).toBe(4);
    expect(result.recommendedSubjects).toBe(1);
  });

  it("coordinador de área: 13h directas", () => {
    const result = calculateHours(make({ isCoordinadorArea: true }));
    expect(result.finalDirectHours).toBe(13);
    expect(result.recommendedSubjects).toBe(4);
  });

  it("formación pedagógica: 13h directas", () => {
    const result = calculateHours(make({ isFormacionPedagogica: true }));
    expect(result.finalDirectHours).toBe(13);
    expect(result.recommendedSubjects).toBe(4);
  });

  it("director posgrado x1: 11h directas", () => {
    const result = calculateHours(make({ dirPosgrado1: true }));
    expect(result.finalDirectHours).toBe(11);
    expect(result.recommendedSubjects).toBe(4);
  });

  it("director posgrado x2: 6h directas", () => {
    const result = calculateHours(make({ dirPosgrado2: true }));
    expect(result.finalDirectHours).toBe(6);
    expect(result.recommendedSubjects).toBe(3);
  });
});
