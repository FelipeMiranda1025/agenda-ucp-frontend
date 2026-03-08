export interface DocentePlanta {
  id: string; // cédula
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
}

export const getDocenteFullName = (d: DocentePlanta): string =>
  [d.firstName, d.secondName, d.firstLastName, d.secondLastName].filter(Boolean).join(' ');
