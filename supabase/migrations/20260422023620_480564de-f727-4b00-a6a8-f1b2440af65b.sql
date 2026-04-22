-- 1. Bucket privado para PDFs de lineamientos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lineamientos', 'lineamientos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de storage abiertas (mismo patrón que el resto del proyecto)
CREATE POLICY "Anyone can read lineamientos files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'lineamientos');

CREATE POLICY "Anyone can upload lineamientos files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'lineamientos');

CREATE POLICY "Anyone can update lineamientos files"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'lineamientos');

CREATE POLICY "Anyone can delete lineamientos files"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'lineamientos');

-- 3. Tabla de documentos de lineamientos
CREATE TABLE public.lineamientos_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_label text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  rules_extracted jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  applied boolean NOT NULL DEFAULT false,
  applied_at timestamptz,
  applied_by text
);

ALTER TABLE public.lineamientos_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lineamientos_documents"
ON public.lineamientos_documents FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert lineamientos_documents"
ON public.lineamientos_documents FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update lineamientos_documents"
ON public.lineamientos_documents FOR UPDATE
TO anon, authenticated
USING (true);

CREATE INDEX idx_lineamientos_documents_uploaded_at
  ON public.lineamientos_documents (uploaded_at DESC);