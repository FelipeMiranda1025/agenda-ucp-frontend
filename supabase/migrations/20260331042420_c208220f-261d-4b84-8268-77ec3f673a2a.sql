
ALTER TABLE public.users ADD CONSTRAINT users_cc_min_length CHECK (LENGTH(cc) >= 6);

ALTER TABLE public.agenda_comments ADD COLUMN IF NOT EXISTS read_by text[] DEFAULT '{}';
