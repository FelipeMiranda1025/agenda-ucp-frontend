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
    const results = detectConflicts(make({ investPrincipal1: true, coInvestigador1: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "observation" }));
  });

  it("formación doctorado + investigador genera conflicto Art. 6k", () => {
    const results = detectConflicts(make({ isFormacionDoctorado: true, investPrincipal1: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "conflict", article: "Art. 6k" }));
  });

  it("formación doctorado + jefe depto genera conflicto Art. 6k", () => {
    const results = detectConflicts(make({ isFormacionDoctorado: true, isJefeDeptoPregrado: true }), 2);
    expect(results).toContainEqual(expect.objectContaining({ type: "conflict", article: "Art. 6k" }));
  });

  it("maestría + doctorado simultáneo genera warning", () => {
    const results = detectConflicts(make({ isFormacionMaestria: true, isFormacionDoctorado: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "warning" }));
  });

  it("formación doctorado + coordinador genera conflicto", () => {
    const results = detectConflicts(make({ isFormacionDoctorado: true, isCoordinadorArea: true }), 1);
    expect(results).toContainEqual(expect.objectContaining({ type: "conflict", article: "Art. 6k" }));
  });
});
