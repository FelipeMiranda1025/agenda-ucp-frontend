CREATE TABLE public.semester_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_label text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by text,
  agenda_views jsonb NOT NULL DEFAULT '[]'::jsonb,
  agenda_comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  agendas jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedules jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.semester_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read semester_archives"
  ON public.semester_archives FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert semester_archives"
  ON public.semester_archives FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_semester_archives_archived_at ON public.semester_archives (archived_at DESC);

INSERT INTO public.system_settings (key, value)
VALUES ('semester_label', '{"label":"2026-1"}'::jsonb)
ON CONFLICT (key) DO NOTHING;