import { Language } from "./translations";

const optionTranslationsMap: Record<string, string> = {
  // === Subjects ===
  "Administración y empresarismo": "Administration and Entrepreneurship",
  "Algebra lineal": "Linear Algebra",
  "Base de datos I": "Database I",
  "Base de datos II": "Database II",
  "Deportes formativo y cultural (Microfútbol mixto)": "Formative and Cultural Sports (Mixed Futsal)",
  "Desarrollo de software I": "Software Development I",
  "Desarrollo de software II": "Software Development II",
  "Desarrollo de software III": "Software Development III",
  "Desarrollo humano": "Human Development",
  "Diálogo fe y cultura": "Faith and Culture Dialogue",
  "Electiva I": "Elective I",
  "Electiva II (Introducción a la analítica de datos)": "Elective II (Introduction to Data Analytics)",
  "Electiva II (Robótica)": "Elective II (Robotics)",
  "Electiva III (Despliegue de aplicaciones)": "Elective III (Application Deployment)",
  "Estadística I": "Statistics I",
  "Ética": "Ethics",
  "Expresión oral y escrita": "Oral and Written Expression",
  "Física I": "Physics I",
  "Formulación y evaluación de proyectos": "Project Formulation and Evaluation",
  "Gestión de tecnología": "Technology Management",
  "Introducción a la tecnología": "Introduction to Technology",
  "Investigación en tecnología": "Technology Research",
  "Matemáticas I": "Mathematics I",
  "Matemáticas II": "Mathematics II",
  "Optativa I (Programación web)": "Optional I (Web Programming)",
  "Optativa II (Microservicios)": "Optional II (Microservices)",
  "Optativa III (Ciberseguridad web)": "Optional III (Web Cybersecurity)",
  "Redes de computadores": "Computer Networks",
  "Trabajo final": "Final Project",

  // === Indirect Teaching ===
  "Asesorías de estudiantes": "Student Advising",
  "Preparación de clases": "Class Preparation",

  // === Investigations ===
  "Coinvestigador": "Co-researcher",
  "Investigador principal": "Principal Researcher",

  // === Social Projects ===
  "Actividad de proyección social": "Social Outreach Activity",

  // === Teacher Training ===
  "Estudios doctorado": "Doctoral Studies",
  "Estudios maestría": "Master's Studies",
  "Otros procesos de fomación": "Other Training Processes",

  // === Complementary Activities ===
  "Actividades de desarrollo personal": "Personal Development Activities",
  "Coordinación gestión desarrollo de software": "Software Development Management Coordination",
  "Participación en comités institucionales permanentes": "Participation in Permanent Institutional Committees",

  // === Administrative Activities ===
  "Director de departamento": "Department Director",
  "Director de programa doctorado": "Doctoral Program Director",
  "Director de programa posgrado": "Graduate Program Director",
  "Director de programa pregrado": "Undergraduate Program Director",

  // === Degree Works ===
  "Trabajo doctorado": "Doctoral Thesis",
  "Trabajo especialización": "Specialization Project",
  "Trabajo maestría": "Master's Thesis",
  "Trabajo pregrado": "Undergraduate Thesis",

  // === Academic Practices ===
  "Práctica profesional (IST)": "Professional Practice (IST)",

  // === Education Levels ===
  "Pregrado": "Undergraduate",
  "Especialización": "Specialization",
  "Maestría": "Master's",
  "Doctorado": "Doctorate",

  // === Faculties ===
  "Facultad de ciencias básicas e ingeniería": "Faculty of Basic Sciences and Engineering",

  // === Professional Careers ===
  "Tecnología en desarrollo de software": "Software Development Technology",

  // === Jornada ===
  "Nocturna": "Night Shift",
  "Diurna": "Day Shift",

  // === Old dropdown values (initialDropdownOptions variants) ===
  "Electiva II Robótica": "Elective II Robotics",
  "Investigación en Tecnología": "Technology Research",
  "Optativa II Microservicios": "Optional II Microservices",
  "Electiva III Despliegue de aplicaciones": "Elective III Application Deployment",
  "Optativa III Ciberseguridad web": "Optional III Web Cybersecurity",
  "Preparación de clase": "Class Preparation",
  "Asesoría de estudiantes": "Student Advising",
  "Trabajo Pregrado": "Undergraduate Thesis",
  "Trabajo Especialización": "Specialization Project",
  "Trabajo Maestría": "Master's Thesis",
  "Trabajo Doctorado": "Doctoral Thesis",
  "Otros procesos de formación": "Other Training Processes",
};

export function translateOption(value: string | number, lang: Language): string {
  if (lang === "es" || typeof value !== "string") return String(value);
  return optionTranslationsMap[value] || String(value);
}
