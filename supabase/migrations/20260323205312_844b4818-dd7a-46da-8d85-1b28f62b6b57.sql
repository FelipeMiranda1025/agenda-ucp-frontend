CREATE POLICY "Anyone can insert subjects" ON public.subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update subjects" ON public.subjects FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete subjects" ON public.subjects FOR DELETE TO anon, authenticated USING (true);