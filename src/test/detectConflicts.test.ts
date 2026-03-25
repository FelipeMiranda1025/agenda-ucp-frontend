import { describe, it, expect } from "vitest";
import { detectConflicts } from "@/hooks/useDocenteConfig";
import { DocenteResponses, DEFAULT_RESPONSES } from "@/types/docenteConfig";

const make = (overrides: Partial<DocenteResponses> = {}): DocenteResponses => ({
  ...DEFAULT_RESPONSES,
  ...overrides,
});

describe("detectConflicts", () => {
  it("sin conflictos por defecto", () => {
    expect(detectConflicts(make(), 1)).toHaveLength(0);
  });

  it("investigador principal + co-investigador genera observación", () => {
    const results = detectConflicts(make({ isInvestigadorPrincipal: true, isCoInvestigador: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "observation" }));
  });

  it("formación doctorado + investigador genera conflicto Art. 6k", () => {
    const results = detectConflicts(make({ isFormacionDoctorado: true, isInvestigadorPrincipal: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "conflict", article: "Art. 6k" }));
  });

  it("formación doctorado + director pregrado genera conflicto Art. 6k", () => {
    const results = detectConflicts(make({ isFormacionDoctorado: true, isDirectorPregrado: true }), 2);
    expect(results).toContainEqual(expect.objectContaining({ type: "conflict", article: "Art. 6k" }));
  });

  it("producción pendiente + investigador genera conflicto Art. 6c", () => {
    const results = detectConflicts(make({ isProduccionPendiente: true, isInvestigadorPrincipal: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "conflict", article: "Art. 6c" }));
  });

  it("maestría + doctorado simultáneo genera warning", () => {
    const results = detectConflicts(make({ isFormacionMaestria: true, isFormacionDoctorado: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "warning" }));
  });

  it("más de 2 posgrados genera warning", () => {
    const results = detectConflicts(make({ isDirectorPosgrado: true, cantidadPosgrados: 3 }), 2);
    expect(results).toContainEqual(expect.objectContaining({ type: "warning", article: "Art. 6f, Nota" }));
  });

  it("formación doctorado + coordinador genera conflicto", () => {
    const results = detectConflicts(make({ isFormacionDoctorado: true, isCoordinadorArea: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "conflict", article: "Art. 6k" }));
  });
});
