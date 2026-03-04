import { SubfunctionConfig } from "@/types/agenda";

export const subfunctions: SubfunctionConfig[] = [
  // === PRODUCCIÓN ===
  {
    id: "docencia-directa",
    sectionId: "produccion",
    title: "1.1 Docencia Directa",
    shortTitle: "Docencia Directa",
    fields: [
      { name: "asignatura", label: "Asignatura", type: "dropdown", category: "asignatura" },
      { name: "semestre", label: "Semestre", type: "dropdown", category: "semestre" },
      { name: "facultad", label: "Facultad", type: "dropdown", category: "facultad" },
      { name: "programa", label: "Programa", type: "dropdown", category: "programa" },
      { name: "jornada", label: "Jornada", type: "dropdown", category: "jornada" },
      { name: "nivel", label: "Nivel de formación", type: "dropdown", category: "nivel" },
      { name: "horasSemana", label: "Horas a la semana", type: "number" },
      { name: "cantidadSemanas", label: "Cantidad de semanas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "horasSemana", field2: "cantidadSemanas", operation: "multiply" } },
    ],
  },
  {
    id: "docencia-indirecta",
    sectionId: "produccion",
    title: "1.2 Docencia Indirecta",
    shortTitle: "Docencia Indirecta",
    fields: [
      { name: "actividad", label: "Actividad", type: "dropdown", category: "actividad_indirecta" },
      { name: "horasSemana", label: "Horas a la semana", type: "number" },
      { name: "cantidadSemanas", label: "Cantidad de semanas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "horasSemana", field2: "cantidadSemanas", operation: "multiply" } },
    ],
  },
  {
    id: "trabajos-grado",
    sectionId: "produccion",
    title: "1.3 Dirección y asesorías en trabajos de grado",
    shortTitle: "Trabajos de Grado",
    fields: [
      { name: "tipoTrabajo", label: "Tipo de trabajo", type: "dropdown", category: "tipo_trabajo" },
      { name: "cantidadProyectos", label: "Cantidad de proyectos", type: "number" },
      { name: "cantidadHoras", label: "Cantidad de horas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "cantidadProyectos", field2: "cantidadHoras", operation: "multiply" } },
    ],
  },
  {
    id: "practicas-academicas",
    sectionId: "produccion",
    title: "1.4 Asesorías de prácticas académicas",
    shortTitle: "Prácticas Académicas",
    fields: [
      { name: "actividad", label: "Actividad", type: "dropdown", category: "actividad_practicas" },
      { name: "cantidadEstudiantes", label: "Cantidad de estudiantes", type: "number" },
      { name: "cantidadHoras", label: "Cantidad de horas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "cantidadEstudiantes", field2: "cantidadHoras", operation: "multiply" } },
    ],
  },
  // === ACTIVIDADES DIFERENTES A LA DOCENCIA ===
  {
    id: "investigacion",
    sectionId: "actividades",
    title: "2.1 Investigación y desarrollo tecnológico",
    shortTitle: "Investigación",
    fields: [
      { name: "actividad", label: "Actividad", type: "dropdown", category: "actividad_investigacion" },
      { name: "horasSemana", label: "Horas a la semana", type: "number" },
      { name: "cantidadSemanas", label: "Cantidad de semanas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "horasSemana", field2: "cantidadSemanas", operation: "multiply" } },
    ],
  },
  {
    id: "proyeccion-social",
    sectionId: "actividades",
    title: "2.2 Actividades de proyección social",
    shortTitle: "Proyección Social",
    fields: [
      { name: "actividad", label: "Actividad", type: "dropdown", category: "actividad_proyeccion" },
      { name: "horasSemana", label: "Horas a la semana", type: "number" },
      { name: "cantidadSemanas", label: "Cantidad de semanas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "horasSemana", field2: "cantidadSemanas", operation: "multiply" } },
    ],
  },
  {
    id: "complementarias",
    sectionId: "actividades",
    title: "2.3 Actividades complementarias",
    shortTitle: "Complementarias",
    fields: [
      { name: "actividad", label: "Actividad", type: "dropdown", category: "actividad_complementaria" },
      { name: "horasSemana", label: "Horas a la semana", type: "number" },
      { name: "cantidadSemanas", label: "Cantidad de semanas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "horasSemana", field2: "cantidadSemanas", operation: "multiply" } },
    ],
  },
  {
    id: "formacion-docentes",
    sectionId: "actividades",
    title: "2.4 Formación de docentes",
    shortTitle: "Formación Docentes",
    fields: [
      { name: "actividad", label: "Actividad", type: "dropdown", category: "actividad_formacion" },
      { name: "horasSemana", label: "Horas a la semana", type: "number" },
      { name: "cantidadSemanas", label: "Cantidad de semanas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "horasSemana", field2: "cantidadSemanas", operation: "multiply" } },
    ],
  },
  {
    id: "administrativas",
    sectionId: "actividades",
    title: "2.5 Actividades académico-administrativas",
    shortTitle: "Administrativas",
    fields: [
      { name: "actividad", label: "Actividad", type: "dropdown", category: "actividad_administrativa" },
      { name: "horasSemana", label: "Horas a la semana", type: "number" },
      { name: "cantidadSemanas", label: "Cantidad de semanas", type: "number" },
      { name: "totalHoras", label: "Total de horas", type: "calculated", calculatedFrom: { field1: "horasSemana", field2: "cantidadSemanas", operation: "multiply" } },
    ],
  },
];
