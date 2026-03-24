CREATE TABLE public.agenda_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  reviewer_cc text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agenda_comments" ON public.agenda_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert agenda_comments" ON public.agenda_comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update agenda_comments" ON public.agenda_comments FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete agenda_comments" ON public.agenda_comments FOR DELETE TO anon, authenticated USING (true);