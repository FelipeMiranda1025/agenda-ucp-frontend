-- =============================================
-- SISTEMA DE AGENDA DOCENTE — UCP
-- Script de inicialización consolidado para Docker / PostgreSQL
-- Incluye: schema, migraciones aplicadas y datos iniciales (seed)
-- Ejecutar una sola vez al levantar el contenedor por primera vez.
-- =============================================

-- ─── Extensiones necesarias ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- para gen_random_uuid()


-- =============================================
-- CATÁLOGOS
-- =============================================

CREATE TABLE IF NOT EXISTS public.roles (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.states (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.semester (
  id          SERIAL PRIMARY KEY,
  number      INT  NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.faculties (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.education_levels (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.professional_careers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);


-- =============================================
-- ACTIVIDADES
-- =============================================

CREATE TABLE IF NOT EXISTS public.indirect_teaching (
  id           SERIAL PRIMARY KEY,
  name         TEXT           NOT NULL,
  weekly_hours NUMERIC(5,2)   NOT NULL DEFAULT 0,
  number_weeks INT            NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.investigations (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  weekly_hours INT  NOT NULL DEFAULT 0,
  number_weeks INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.social_projects (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  weekly_hours INT  NOT NULL DEFAULT 0,
  number_weeks INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.teacher_training (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  weekly_hours INT  NOT NULL DEFAULT 0,
  number_weeks INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.degree_works (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(50)  NOT NULL,
  number_projects INTEGER      NOT NULL DEFAULT 0,
  number_weeks    INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.complementary_activities (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  weekly_hours INT  NOT NULL DEFAULT 0,
  number_weeks INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.administrative_activities (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  weekly_hours INT  NOT NULL DEFAULT 0,
  number_weeks INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.academic_practices (
  id              SERIAL PRIMARY KEY,
  name            TEXT    NOT NULL,
  number_students INTEGER NOT NULL DEFAULT 0,
  number_weeks    INTEGER NOT NULL DEFAULT 0
);


-- =============================================
-- ENTIDADES PRINCIPALES
-- =============================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id                     SERIAL PRIMARY KEY,
  id_semester            INT REFERENCES public.semester(id),
  id_education_level     INT REFERENCES public.education_levels(id),
  id_state               INT REFERENCES public.states(id),
  id_faculty             INT REFERENCES public.faculties(id),
  id_professional_career INT REFERENCES public.professional_careers(id),
  name                   TEXT NOT NULL,
  weekly_hours           INT  NOT NULL DEFAULT 0,
  number_weeks           INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.users (
  id               SERIAL PRIMARY KEY,
  id_rol           INT  NOT NULL REFERENCES public.roles(id),
  id_state         INT  NOT NULL REFERENCES public.states(id),
  first_name       TEXT NOT NULL,
  second_name      TEXT DEFAULT '',
  first_last_name  TEXT NOT NULL,
  second_last_name TEXT DEFAULT '',
  password         TEXT NOT NULL,
  cc               TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.agendas (
  id           UUID                     NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      INT                      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  docente_cc   TEXT                     NOT NULL,
  subfunction_id TEXT                   NOT NULL,
  data         JSONB                    NOT NULL DEFAULT '{}',
  total_horas  INT                      NOT NULL DEFAULT 0,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  semester_id  INT REFERENCES public.semester(id),
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.roles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_levels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_careers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indirect_teaching         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_training          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.degree_works              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complementary_activities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_practices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas                   ENABLE ROW LEVEL SECURITY;

-- Catálogos — lectura pública
CREATE POLICY "Anyone can read roles"                    ON public.roles                     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read states"                   ON public.states                    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read semester"                 ON public.semester                  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read faculties"                ON public.faculties                 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read education_levels"         ON public.education_levels          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read professional_careers"     ON public.professional_careers      FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read indirect_teaching"        ON public.indirect_teaching         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read investigations"           ON public.investigations            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read social_projects"          ON public.social_projects           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read teacher_training"         ON public.teacher_training          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read degree_works"             ON public.degree_works              FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read complementary_activities" ON public.complementary_activities  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read administrative_activities" ON public.administrative_activities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read academic_practices"       ON public.academic_practices        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read subjects"                 ON public.subjects                  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read users"                    ON public.users                     FOR SELECT TO anon, authenticated USING (true);

-- Agendas — CRUD abierto
CREATE POLICY "Users can read agendas"   ON public.agendas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert agendas" ON public.agendas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update agendas" ON public.agendas FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete agendas" ON public.agendas FOR DELETE TO anon, authenticated USING (true);


-- =============================================
-- TRIGGER: updated_at en agendas
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agendas_updated_at
  BEFORE UPDATE ON public.agendas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO public.roles (id, name, description) VALUES
  (6, 'Docente de planta', 'rol encargado de hacer la diligencia del formulario')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.states (id, name) VALUES
  (1, 'Activo'),
  (2, 'Inactivo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.semester (id, number, description) VALUES
  (1, 1, 'Primer semestre'),
  (2, 2, 'Segundo semestre'),
  (3, 3, 'Tercer semestre'),
  (4, 4, 'Cuarto semestre'),
  (5, 5, 'Quinto semestre'),
  (6, 6, 'Sexto semestre')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faculties (id, name) VALUES
  (1, 'Facultad de ciencias básicas e ingeniería')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.education_levels (id, name) VALUES
  (1, 'Pregrado'),
  (2, 'Especialización'),
  (3, 'Maestría'),
  (4, 'Doctorado')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.professional_careers (id, name) VALUES
  (1, 'Tecnología en desarrollo de software')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subjects (id, name, weekly_hours, number_weeks, id_semester, id_education_level, id_state, id_faculty, id_professional_career) VALUES
  (1,  'Deportes formativo y cultural (Microfútbol mixto)',     2, 16, 1, 1, 1, 1, 1),
  (2,  'Desarrollo de software I',                              4, 16, 1, 1, 1, 1, 1),
  (3,  'Desarrollo humano',                                     3, 16, 1, 1, 1, 1, 1),
  (4,  'Introducción a la tecnología',                          3, 16, 1, 1, 1, 1, 1),
  (5,  'Matemáticas I',                                         6, 16, 1, 1, 1, 1, 1),
  (6,  'Desarrollo de software II',                             4, 16, 2, 1, 1, 1, 1),
  (7,  'Diálogo fe y cultura',                                  3, 16, 2, 1, 1, 1, 1),
  (8,  'Electiva I',                                            2, 16, 2, 1, 1, 1, 1),
  (9,  'Expresión oral y escrita',                              3, 16, 2, 1, 1, 1, 1),
  (10, 'Matemáticas II',                                        4, 16, 2, 1, 1, 1, 1),
  (11, 'Administración y empresarismo',                         3, 16, 3, 1, 1, 1, 1),
  (12, 'Algebra lineal',                                        4, 16, 3, 1, 1, 1, 1),
  (13, 'Base de datos I',                                       3, 16, 3, 1, 1, 1, 1),
  (14, 'Desarrollo de software III',                            4, 16, 3, 1, 1, 1, 1),
  (15, 'Física I',                                              4, 16, 3, 1, 1, 1, 1),
  (16, 'Base de datos II',                                      4, 16, 4, 1, 1, 1, 1),
  (17, 'Estadística I',                                         4, 16, 4, 1, 1, 1, 1),
  (18, 'Gestión de tecnología',                                 3, 16, 4, 1, 1, 1, 1),
  (19, 'Optativa I (Programación web)',                         3, 16, 4, 1, 1, 1, 1),
  (20, 'Electiva II (Introducción a la analítica de datos)',    2, 16, 5, 1, 1, 1, 1),
  (21, 'Formulación y evaluación de proyectos',                 3, 16, 5, 1, 1, 1, 1),
  (22, 'Investigación en tecnología',                           2, 16, 5, 1, 1, 1, 1),
  (23, 'Optativa II (Microservicios)',                          3, 16, 5, 1, 1, 1, 1),
  (24, 'Redes de computadores',                                 4, 16, 5, 1, 1, 1, 1),
  (25, 'Electiva III (Despliegue de aplicaciones)',             2, 16, 6, 1, 1, 1, 1),
  (26, 'Optativa III (Ciberseguridad web)',                     3, 16, 6, 1, 1, 1, 1),
  (27, 'Trabajo final',                                         4, 16, 6, 1, 1, 1, 1),
  (28, 'Ética',                                                 3, 16, 6, 1, 1, 1, 1),
  (29, 'Electiva II (Robótica)',                                2, 16, 5, 1, 1, 1, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, first_name, second_name, first_last_name, second_last_name, cc, email, password, id_rol, id_state) VALUES
  (3, 'Docente', '', 'Planta', 'Pruebas', '1234', 'docenteplanta.pruebas@ucp.edu.co',
   '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 6, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.indirect_teaching (id, name, weekly_hours, number_weeks) VALUES
  (3, 'Preparación de clases',    0.50, 18),
  (4, 'Asesorías de estudiantes', 1.00, 18)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.investigations (id, name, weekly_hours, number_weeks) VALUES
  (3, 'Investigador principal', 0, 23),
  (4, 'Coinvestigador',         0, 23)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.social_projects (id, name, weekly_hours, number_weeks) VALUES
  (1, 'Actividad de proyección social', 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.teacher_training (id, name, weekly_hours, number_weeks) VALUES
  (4, 'Estudios maestría',           0, 23),
  (5, 'Estudios doctorado',          0, 23),
  (6, 'Otros procesos de formación', 0, 23)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.degree_works (id, name, number_projects, number_weeks) VALUES
  (1, 'Trabajo pregrado',        0, 15),
  (2, 'Trabajo especialización', 0, 15),
  (3, 'Trabajo maestría',        0, 30),
  (4, 'Trabajo doctorado',       0, 45)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complementary_activities (id, name, weekly_hours, number_weeks) VALUES
  (4, 'Participación en comités institucionales permanentes', 0, 23),
  (5, 'Coordinación gestión desarrollo de software',         0, 23),
  (6, 'Actividades de desarrollo personal',                  0, 23)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.administrative_activities (id, name, weekly_hours, number_weeks) VALUES
  (5, 'Director de programa pregrado',  0, 23),
  (6, 'Director de departamento',       0, 23),
  (7, 'Director de programa posgrado',  0, 23),
  (8, 'Director de programa doctorado', 0, 23)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.academic_practices (id, name, number_students, number_weeks) VALUES
  (1, 'Práctica profesional (IST)', 0, 10)
ON CONFLICT (id) DO NOTHING;


-- =============================================
-- RESET DE SECUENCIAS
-- =============================================

SELECT setval(pg_get_serial_sequence('public.roles',                    'id'), COALESCE((SELECT MAX(id) FROM public.roles),                    1));
SELECT setval(pg_get_serial_sequence('public.states',                   'id'), COALESCE((SELECT MAX(id) FROM public.states),                   1));
SELECT setval(pg_get_serial_sequence('public.semester',                 'id'), COALESCE((SELECT MAX(id) FROM public.semester),                 1));
SELECT setval(pg_get_serial_sequence('public.faculties',                'id'), COALESCE((SELECT MAX(id) FROM public.faculties),                1));
SELECT setval(pg_get_serial_sequence('public.education_levels',         'id'), COALESCE((SELECT MAX(id) FROM public.education_levels),         1));
SELECT setval(pg_get_serial_sequence('public.professional_careers',     'id'), COALESCE((SELECT MAX(id) FROM public.professional_careers),     1));
SELECT setval(pg_get_serial_sequence('public.subjects',                 'id'), COALESCE((SELECT MAX(id) FROM public.subjects),                 1));
SELECT setval(pg_get_serial_sequence('public.users',                    'id'), COALESCE((SELECT MAX(id) FROM public.users),                    1));
SELECT setval(pg_get_serial_sequence('public.indirect_teaching',        'id'), COALESCE((SELECT MAX(id) FROM public.indirect_teaching),        1));
SELECT setval(pg_get_serial_sequence('public.investigations',           'id'), COALESCE((SELECT MAX(id) FROM public.investigations),           1));
SELECT setval(pg_get_serial_sequence('public.social_projects',          'id'), COALESCE((SELECT MAX(id) FROM public.social_projects),          1));
SELECT setval(pg_get_serial_sequence('public.teacher_training',         'id'), COALESCE((SELECT MAX(id) FROM public.teacher_training),         1));
SELECT setval(pg_get_serial_sequence('public.degree_works',             'id'), COALESCE((SELECT MAX(id) FROM public.degree_works),             1));
SELECT setval(pg_get_serial_sequence('public.complementary_activities', 'id'), COALESCE((SELECT MAX(id) FROM public.complementary_activities), 1));
SELECT setval(pg_get_serial_sequence('public.administrative_activities','id'), COALESCE((SELECT MAX(id) FROM public.administrative_activities),1));
SELECT setval(pg_get_serial_sequence('public.academic_practices',       'id'), COALESCE((SELECT MAX(id) FROM public.academic_practices),       1));
