
-- Tabla de relaciones jerárquicas entre usuarios
CREATE TABLE public.user_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supervisor_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_hierarchy ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can read user_hierarchy"
  ON public.user_hierarchy FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert user_hierarchy"
  ON public.user_hierarchy FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update user_hierarchy"
  ON public.user_hierarchy FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete user_hierarchy"
  ON public.user_hierarchy FOR DELETE
  TO anon, authenticated
  USING (true);
