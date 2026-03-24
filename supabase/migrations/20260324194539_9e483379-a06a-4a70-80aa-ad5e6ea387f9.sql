CREATE TABLE public.docente_semester_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cc text NOT NULL,
  semester_label text NOT NULL DEFAULT '2025-1',
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_direct_hours integer NOT NULL DEFAULT 16,
  observations text[] DEFAULT '{}'::text[],
  conflicts text[] DEFAULT '{}'::text[],
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_cc, semester_label)
);

ALTER TABLE public.docente_semester_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read docente_semester_config" ON public.docente_semester_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert docente_semester_config" ON public.docente_semester_config FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update docente_semester_config" ON public.docente_semester_config FOR UPDATE TO anon, authenticated USING (true);

CREATE TRIGGER update_docente_semester_config_updated_at
  BEFORE UPDATE ON public.docente_semester_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();