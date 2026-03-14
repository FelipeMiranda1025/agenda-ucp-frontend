ALTER TABLE public.indirect_teaching ALTER COLUMN weekly_hours TYPE numeric(5,2);
DELETE FROM public.indirect_teaching;
INSERT INTO public.indirect_teaching (name, weekly_hours, number_weeks) VALUES
  ('Preparación de clases', 0.5, 18),
  ('Asesorías de estudiantes', 1, 18);