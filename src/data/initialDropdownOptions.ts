import { DropdownOption } from "@/types/agenda";

let idCounter = 1;
const opt = (category: string, value: string): DropdownOption => ({
  id: String(idCounter++),
  category,
  value,
});

export const initialDropdownOptions: DropdownOption[] = [
  // Asignaturas
  opt("asignatura", "Electiva II Robótica"),
  opt("asignatura", "Redes de computadores"),
  opt("asignatura", "Formulación y evaluación de proyectos"),
  opt("asignatura", "Investigación en Tecnología"),
  opt("asignatura", "Optativa II Microservicios"),
  opt("asignatura", "Electiva III Despliegue de aplicaciones"),
  opt("asignatura", "Trabajo final"),
  opt("asignatura", "Optativa III Ciberseguridad web"),
  opt("asignatura", "Ética"),
  // Semestres
  opt("semestre", "1"),
  opt("semestre", "2"),
  opt("semestre", "3"),
  opt("semestre", "5"),
  opt("semestre", "6"),
  // Facultad
  opt("facultad", "Facultad de ciencias básicas e ingeniería"),
  // Programa
  opt("programa", "Tecnología en desarrollo de software"),
  // Jornada
  opt("jornada", "Nocturna"),
  opt("jornada", "Diurna"),
  // Nivel
  opt("nivel", "Pregrado"),
  opt("nivel", "Especialización"),
  opt("nivel", "Maestría"),
  opt("nivel", "Doctorado"),
  // Actividad indirecta
  opt("actividad_indirecta", "Preparación de clase"),
  opt("actividad_indirecta", "Asesoría de estudiantes"),
  // Tipo trabajo
  opt("tipo_trabajo", "Trabajo Pregrado"),
  opt("tipo_trabajo", "Trabajo Especialización"),
  opt("tipo_trabajo", "Trabajo Maestría"),
  opt("tipo_trabajo", "Trabajo Doctorado"),
  // Actividad prácticas
  opt("actividad_practicas", "Práctica profesional (IST)"),
  // Actividad investigación
  opt("actividad_investigacion", "Investigador principal"),
  opt("actividad_investigacion", "Coinvestigador"),
  // Actividad proyección
  opt("actividad_proyeccion", "Actividad de proyección social"),
  // Actividad complementaria
  opt("actividad_complementaria", "Participación en comités institucionales permanentes"),
  opt("actividad_complementaria", "Coordinación gestión desarrollo de software"),
  opt("actividad_complementaria", "Actividades de desarrollo personal"),
  // Actividad formación
  opt("actividad_formacion", "Estudios maestría"),
  opt("actividad_formacion", "Estudios doctorado"),
  opt("actividad_formacion", "Otros procesos de formación"),
  // Actividad administrativa
  opt("actividad_administrativa", "Director de programa pregrado"),
  opt("actividad_administrativa", "Director de departamento"),
  opt("actividad_administrativa", "Director de programa posgrado"),
  opt("actividad_administrativa", "Director de programa doctorado"),
];
