
CREATE TABLE public.agenda_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cc TEXT NOT NULL,
  records JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_cc TEXT,
  reviewer_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agenda_views" ON public.agenda_views FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert agenda_views" ON public.agenda_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update agenda_views" ON public.agenda_views FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete agenda_views" ON public.agenda_views FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_agenda_views_updated_at
  BEFORE UPDATE ON public.agenda_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
