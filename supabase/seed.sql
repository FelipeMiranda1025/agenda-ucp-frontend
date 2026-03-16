-- =============================================
-- SEED DATA: Datos iniciales del Sistema de Agenda Docente UCP
-- Este archivo inserta todos los registros base necesarios para
-- que la aplicación funcione correctamente al clonar el repositorio.
-- Usa ON CONFLICT DO NOTHING para ser idempotente.
-- =============================================

-- 1. ROLES
INSERT INTO roles (id, name, description) VALUES
  (6, 'Docente de planta', 'rol encargado de hacer la diligencia del formulario')
ON CONFLICT (id) DO NOTHING;

-- 2. STATES
INSERT INTO states (id, name) VALUES
  (1, 'Activo'),
  (2, 'Inactivo')
ON CONFLICT (id) DO NOTHING;

-- 3. SEMESTER
INSERT INTO semester (id, number, description) VALUES
  (1, 1, 'Primer semestre'),
  (2, 2, 'Segundo semestre'),
  (3, 3, 'Tercer semestre'),
  (4, 4, 'Cuarto semestre'),
  (5, 5, 'Quinto semestre'),
  (6, 6, 'Sexto semestre')
ON CONFLICT (id) DO NOTHING;

-- 4. FACULTIES
INSERT INTO faculties (id, name) VALUES
  (1, 'Facultad de ciencias básicas e ingeniería')
ON CONFLICT (id) DO NOTHING;

-- 5. EDUCATION LEVELS
INSERT INTO education_levels (id, name) VALUES
  (1, 'Pregrado'),
  (2, 'Especialización'),
  (3, 'Maestría'),
  (4, 'Doctorado')
ON CONFLICT (id) DO NOTHING;

-- 6. PROFESSIONAL CAREERS
INSERT INTO professional_careers (id, name) VALUES
  (1, 'Tecnología en desarrollo de software')
ON CONFLICT (id) DO NOTHING;

-- 7. SUBJECTS (dependen de semester, education_levels, states, faculties, professional_careers)
INSERT INTO subjects (id, name, weekly_hours, number_weeks, id_semester, id_education_level, id_state, id_faculty, id_professional_career) VALUES
  (1,  'Deportes formativo y cultural (Microfútbol mixto)', 2, 16, 1, 1, 1, 1, 1),
  (2,  'Desarrollo de software I',                         4, 16, 1, 1, 1, 1, 1),
  (3,  'Desarrollo humano',                                3, 16, 1, 1, 1, 1, 1),
  (4,  'Introducción a la tecnología',                     3, 16, 1, 1, 1, 1, 1),
  (5,  'Matemáticas I',                                    6, 16, 1, 1, 1, 1, 1),
  (6,  'Desarrollo de software II',                        4, 16, 2, 1, 1, 1, 1),
  (7,  'Diálogo fe y cultura',                             3, 16, 2, 1, 1, 1, 1),
  (8,  'Electiva I',                                       2, 16, 2, 1, 1, 1, 1),
  (9,  'Expresión oral y escrita',                         3, 16, 2, 1, 1, 1, 1),
  (10, 'Matemáticas II',                                   4, 16, 2, 1, 1, 1, 1),
  (11, 'Administración y empresarismo',                    3, 16, 3, 1, 1, 1, 1),
  (12, 'Algebra lineal',                                   4, 16, 3, 1, 1, 1, 1),
  (13, 'Base de datos I',                                  3, 16, 3, 1, 1, 1, 1),
  (14, 'Desarrollo de software III',                       4, 16, 3, 1, 1, 1, 1),
  (15, 'Física I',                                         4, 16, 3, 1, 1, 1, 1),
  (16, 'Base de datos II',                                 4, 16, 4, 1, 1, 1, 1),
  (17, 'Estadística I',                                    4, 16, 4, 1, 1, 1, 1),
  (18, 'Gestión de tecnología',                            3, 16, 4, 1, 1, 1, 1),
  (19, 'Optativa I (Programación web)',                    3, 16, 4, 1, 1, 1, 1),
  (20, 'Electiva II (Introducción a la analítica de datos)', 2, 16, 5, 1, 1, 1, 1),
  (21, 'Formulación y evaluación de proyectos',            3, 16, 5, 1, 1, 1, 1),
  (22, 'Investigación en tecnología',                      2, 16, 5, 1, 1, 1, 1),
  (23, 'Optativa II (Microservicios)',                     3, 16, 5, 1, 1, 1, 1),
  (24, 'Redes de computadores',                            4, 16, 5, 1, 1, 1, 1),
  (25, 'Electiva III (Despliegue de aplicaciones)',        2, 16, 6, 1, 1, 1, 1),
  (26, 'Optativa III (Ciberseguridad web)',                3, 16, 6, 1, 1, 1, 1),
  (27, 'Trabajo final',                                   4, 16, 6, 1, 1, 1, 1),
  (28, 'Ética',                                           3, 16, 6, 1, 1, 1, 1),
  (29, 'Electiva II (Robótica)',                           2, 16, 5, 1, 1, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- 8. USERS (depende de roles y states)
-- Password: SHA-256 de "1234"
INSERT INTO users (id, first_name, second_name, first_last_name, second_last_name, cc, email, password, id_rol, id_state) VALUES
  (3, 'Docente', '', 'Planta', 'Pruebas', '1234', 'docenteplanta.pruebas@ucp.edu.co', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 6, 1)
ON CONFLICT (id) DO NOTHING;

-- 9. INDIRECT TEACHING
INSERT INTO indirect_teaching (id, name, weekly_hours, number_weeks) VALUES
  (3, 'Preparación de clases',    0.50, 18),
  (4, 'Asesorías de estudiantes', 1.00, 18)
ON CONFLICT (id) DO NOTHING;

-- 10. INVESTIGATIONS
INSERT INTO investigations (id, name, weekly_hours, number_weeks) VALUES
  (3, 'Investigador principal', 0, 23),
  (4, 'Coinvestigador',         0, 23)
ON CONFLICT (id) DO NOTHING;

-- 11. SOCIAL PROJECTS
INSERT INTO social_projects (id, name, weekly_hours, number_weeks) VALUES
  (1, 'Actividad de proyección social', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 12. TEACHER TRAINING
INSERT INTO teacher_training (id, name, weekly_hours, number_weeks) VALUES
  (4, 'Estudios maestría',            0, 23),
  (5, 'Estudios doctorado',           0, 23),
  (6, 'Otros procesos de fomación',   0, 23)
ON CONFLICT (id) DO NOTHING;

-- 13. DEGREE WORKS
INSERT INTO degree_works (id, name, number_projects, number_weeks) VALUES
  (1, 'Trabajo pregrado',        0, 15),
  (2, 'Trabajo especialización', 0, 15),
  (3, 'Trabajo maestría',        0, 30),
  (4, 'Trabajo doctorado',       0, 45)
ON CONFLICT (id) DO NOTHING;

-- 14. COMPLEMENTARY ACTIVITIES
INSERT INTO complementary_activities (id, name, weekly_hours, number_weeks) VALUES
  (4, 'Participación en comités institucionales permanentes', 0, 23),
  (5, 'Coordinación gestión desarrollo de software',          0, 23),
  (6, 'Actividades de desarrollo personal',                   0, 23)
ON CONFLICT (id) DO NOTHING;

-- 15. ADMINISTRATIVE ACTIVITIES
INSERT INTO administrative_activities (id, name, weekly_hours, number_weeks) VALUES
  (5, 'Director de programa pregrado',   0, 23),
  (6, 'Director de departamento',        0, 23),
  (7, 'Director de programa posgrado',   0, 23),
  (8, 'Director de programa doctorado',  0, 23)
ON CONFLICT (id) DO NOTHING;

-- 16. ACADEMIC PRACTICES
INSERT INTO academic_practices (id, name, number_students, number_weeks) VALUES
  (1, 'Práctica profesional (IST)', 0, 10)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RESET SEQUENCES para evitar conflictos en futuros inserts
-- =============================================
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));
SELECT setval(pg_get_serial_sequence('states', 'id'), COALESCE((SELECT MAX(id) FROM states), 1));
SELECT setval(pg_get_serial_sequence('semester', 'id'), COALESCE((SELECT MAX(id) FROM semester), 1));
SELECT setval(pg_get_serial_sequence('faculties', 'id'), COALESCE((SELECT MAX(id) FROM faculties), 1));
SELECT setval(pg_get_serial_sequence('education_levels', 'id'), COALESCE((SELECT MAX(id) FROM education_levels), 1));
SELECT setval(pg_get_serial_sequence('professional_careers', 'id'), COALESCE((SELECT MAX(id) FROM professional_careers), 1));
SELECT setval(pg_get_serial_sequence('subjects', 'id'), COALESCE((SELECT MAX(id) FROM subjects), 1));
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('indirect_teaching', 'id'), COALESCE((SELECT MAX(id) FROM indirect_teaching), 1));
SELECT setval(pg_get_serial_sequence('investigations', 'id'), COALESCE((SELECT MAX(id) FROM investigations), 1));
SELECT setval(pg_get_serial_sequence('social_projects', 'id'), COALESCE((SELECT MAX(id) FROM social_projects), 1));
SELECT setval(pg_get_serial_sequence('teacher_training', 'id'), COALESCE((SELECT MAX(id) FROM teacher_training), 1));
SELECT setval(pg_get_serial_sequence('degree_works', 'id'), COALESCE((SELECT MAX(id) FROM degree_works), 1));
SELECT setval(pg_get_serial_sequence('complementary_activities', 'id'), COALESCE((SELECT MAX(id) FROM complementary_activities), 1));
SELECT setval(pg_get_serial_sequence('administrative_activities', 'id'), COALESCE((SELECT MAX(id) FROM administrative_activities), 1));
SELECT setval(pg_get_serial_sequence('academic_practices', 'id'), COALESCE((SELECT MAX(id) FROM academic_practices), 1));
