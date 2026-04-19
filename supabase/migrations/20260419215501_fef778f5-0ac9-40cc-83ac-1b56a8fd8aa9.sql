-- Create recommendation_rules table
CREATE TABLE public.recommendation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  rule_key text NOT NULL UNIQUE,
  label text NOT NULL,
  hours integer NOT NULL DEFAULT 0,
  subjects integer NOT NULL DEFAULT 0,
  default_hours integer NOT NULL DEFAULT 0,
  default_subjects integer NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recommendation_rules"
  ON public.recommendation_rules FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert recommendation_rules"
  ON public.recommendation_rules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update recommendation_rules"
  ON public.recommendation_rules FOR UPDATE
  TO anon, authenticated USING (true);

CREATE POLICY "Anyone can delete recommendation_rules"
  ON public.recommendation_rules FOR DELETE
  TO anon, authenticated USING (true);

CREATE TRIGGER update_recommendation_rules_updated_at
  BEFORE UPDATE ON public.recommendation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 14 default rules
INSERT INTO public.recommendation_rules (category, rule_key, label, hours, subjects, default_hours, default_subjects, priority) VALUES
  -- Formación (highest priority)
  ('formacion', 'form_doctorado', 'Estudios doctorado', 8, 2, 8, 2, 100),
  ('formacion', 'form_maestria', 'Estudios maestría', 12, 4, 12, 4, 90),
  ('formacion', 'form_pedagogicos', 'Estudios Pedagógicos', 13, 4, 13, 4, 80),
  -- Administrativas
  ('administrativas', 'admin_decano_vicerrector_doctorado', 'Decano / Vicerrector / Director doctorado', 2, 1, 2, 1, 70),
  ('administrativas', 'admin_dir_depto_pregrado', 'Director departamento o pregrado', 6, 2, 6, 2, 60),
  ('administrativas', 'admin_dir_posgrado_2', 'Director programa posgrado (2 o más)', 6, 3, 6, 3, 55),
  ('administrativas', 'admin_dir_posgrado_1', 'Director programa posgrado (1)', 11, 4, 11, 4, 50),
  ('administrativas', 'admin_coord_area', 'Coordinador de área', 13, 4, 13, 4, 45),
  -- Investigación
  ('investigacion', 'inv_1p_2c', '1 Investigador principal + 2 Co-investigadores', 3, 1, 3, 1, 40),
  ('investigacion', 'inv_2p', '2 Investigadores principales', 4, 1, 4, 1, 35),
  ('investigacion', 'inv_1p', '1 Investigador principal', 10, 3, 10, 3, 30),
  ('investigacion', 'inv_3c', '3 Co-investigadores', 6, 2, 6, 2, 25),
  ('investigacion', 'inv_2c', '2 Co-investigadores', 9, 3, 9, 3, 20),
  ('investigacion', 'inv_1c', '1 Co-investigador', 13, 4, 13, 4, 15);