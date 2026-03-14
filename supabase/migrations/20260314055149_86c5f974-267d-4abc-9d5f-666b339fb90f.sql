
-- =============================================
-- CATÁLOGOS
-- =============================================

-- 1. Roles
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 2. States
CREATE TABLE public.states (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 3. Semester
CREATE TABLE public.semester (
  id SERIAL PRIMARY KEY,
  number INT NOT NULL UNIQUE,
  description TEXT
);

-- 4. Faculties
CREATE TABLE public.faculties (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 5. Education Levels
CREATE TABLE public.education_levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 6. Professional Careers
CREATE TABLE public.professional_careers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- =============================================
-- ACTIVIDADES (tablas de opciones con horas)
-- =============================================

-- 7. Indirect Teaching
CREATE TABLE public.indirect_teaching (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 8. Investigations
CREATE TABLE public.investigations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 9. Social Projects
CREATE TABLE public.social_projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 10. Teacher Training
CREATE TABLE public.teacher_training (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 11. Degree Works
CREATE TABLE public.degree_works (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 12. Complementary Activities
CREATE TABLE public.complementary_activities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 13. Administrative Activities
CREATE TABLE public.administrative_activities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 14. Academic Practices
CREATE TABLE public.academic_practices (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- =============================================
-- ENTIDADES PRINCIPALES
-- =============================================

-- 15. Subjects
CREATE TABLE public.subjects (
  id SERIAL PRIMARY KEY,
  id_semester INT REFERENCES public.semester(id),
  id_education_level INT REFERENCES public.education_levels(id),
  id_state INT REFERENCES public.states(id),
  id_faculty INT REFERENCES public.faculties(id),
  id_professional_career INT REFERENCES public.professional_careers(id),
  name TEXT NOT NULL,
  weekly_hours INT NOT NULL DEFAULT 0,
  number_weeks INT NOT NULL DEFAULT 0
);

-- 16. Users
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  id_rol INT NOT NULL REFERENCES public.roles(id),
  id_state INT NOT NULL REFERENCES public.states(id),
  first_name TEXT NOT NULL,
  second_name TEXT DEFAULT '',
  first_last_name TEXT NOT NULL,
  second_last_name TEXT DEFAULT '',
  password TEXT NOT NULL,
  cc TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE
);

-- 17. Agendas (registros confirmados)
CREATE TABLE public.agendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  docente_cc TEXT NOT NULL,
  subfunction_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  total_horas INT NOT NULL DEFAULT 0,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  semester_id INT REFERENCES public.semester(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indirect_teaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.degree_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complementary_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura pública para usuarios autenticados
CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read states" ON public.states FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read semester" ON public.semester FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read faculties" ON public.faculties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read education_levels" ON public.education_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read professional_careers" ON public.professional_careers FOR SELECT TO authenticated USING (true);

-- Actividades: lectura pública para autenticados
CREATE POLICY "Anyone can read indirect_teaching" ON public.indirect_teaching FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read investigations" ON public.investigations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read social_projects" ON public.social_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read teacher_training" ON public.teacher_training FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read degree_works" ON public.degree_works FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read complementary_activities" ON public.complementary_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read administrative_activities" ON public.administrative_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read academic_practices" ON public.academic_practices FOR SELECT TO authenticated USING (true);

-- Subjects: lectura para autenticados
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

-- Users: lectura para autenticados, update solo su propio registro
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT TO authenticated USING (true);

-- Agendas: CRUD por el usuario que creó el registro
CREATE POLICY "Users can read their own agendas" ON public.agendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert agendas" ON public.agendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own agendas" ON public.agendas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete their own agendas" ON public.agendas FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at en agendas
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
