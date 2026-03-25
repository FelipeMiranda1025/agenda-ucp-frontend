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

  it("fuerza 16h si tiene producción pendiente (Art. 6c)", () => {
    const result = calculateHours(make({ isProduccionPendiente: true, isInvestigadorPrincipal: true }));
    expect(result.finalDirectHours).toBe(16);
    expect(result.investigationHours).toBe(0);
  });

  it("investigador principal: 10h directas, 11h investigación (Art. 6a)", () => {
    const result = calculateHours(make({ isInvestigadorPrincipal: true }));
    expect(result.directHours).toBe(10);
    expect(result.finalDirectHours).toBe(10);
    expect(result.investigationHours).toBe(11);
  });

  it("co-investigador: 13h directas, 6h investigación (Art. 6b)", () => {
    const result = calculateHours(make({ isCoInvestigador: true }));
    expect(result.directHours).toBe(13);
    expect(result.investigationHours).toBe(6);
  });

  it("formación doctorado: 8h directas, 15h investigación (Art. 6i)", () => {
    const result = calculateHours(make({ isFormacionDoctorado: true }));
    expect(result.directHours).toBe(8);
    expect(result.investigationHours).toBe(15);
  });

  it("formación maestría: 12h directas, 7h investigación (Art. 6j)", () => {
    const result = calculateHours(make({ isFormacionMaestria: true }));
    expect(result.directHours).toBe(12);
    expect(result.investigationHours).toBe(7);
  });

  it("director pregrado: 6h directas (Art. 6e)", () => {
    const result = calculateHours(make({ isDirectorPregrado: true }));
    expect(result.directHours).toBe(6);
  });

  it("decano: 4h directas (Art. 6h)", () => {
    const result = calculateHours(make({ isDecano: true }));
    expect(result.directHours).toBe(4);
    expect(result.finalDirectHours).toBe(4);
  });

  it("vicerrector: 4h directas (Art. 6h)", () => {
    const result = calculateHours(make({ isVicerrector: true }));
    expect(result.directHours).toBe(4);
  });

  it("director doctorado: 4h directas (Art. 6h)", () => {
    const result = calculateHours(make({ isDirectorDoctorado: true }));
    expect(result.directHours).toBe(4);
  });

  it("coordinador de área reduce 3h (Art. 6g)", () => {
    const result = calculateHours(make({ isCoordinadorArea: true }));
    expect(result.finalDirectHours).toBe(13);
    expect(result.reductions).toContainEqual({ label: "Coordinación de área", hours: 3 });
  });

  it("formación pedagógica reduce 3h (Art. 6l)", () => {
    const result = calculateHours(make({ isFormacionPedagogica: true }));
    expect(result.finalDirectHours).toBe(13);
  });

  it("director posgrado reduce 5h por programa (Art. 6f)", () => {
    const result = calculateHours(make({ isDirectorPosgrado: true, cantidadPosgrados: 2 }));
    expect(result.finalDirectHours).toBe(6); // 16 - 10
  });

  it("reducciones acumulables: coordinador + formación pedagógica", () => {
    const result = calculateHours(make({ isCoordinadorArea: true, isFormacionPedagogica: true }));
    expect(result.finalDirectHours).toBe(10); // 16 - 3 - 3
  });

  it("decano no tiene reducciones acumulables", () => {
    const result = calculateHours(make({ isDecano: true, isCoordinadorArea: true }));
    expect(result.finalDirectHours).toBe(4);
    expect(result.reductions).toHaveLength(0);
  });

  it("no baja de 0 horas con muchas reducciones", () => {
    const result = calculateHours(make({
      isDirectorPregrado: true, // 6h
      isDirectorPosgrado: true,
      cantidadPosgrados: 2, // -10h
    }));
    expect(result.finalDirectHours).toBe(0);
  });
});
