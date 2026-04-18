ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS id_faculty INTEGER REFERENCES public.faculties(id),
  ADD COLUMN IF NOT EXISTS id_professional_career INTEGER REFERENCES public.professional_careers(id);