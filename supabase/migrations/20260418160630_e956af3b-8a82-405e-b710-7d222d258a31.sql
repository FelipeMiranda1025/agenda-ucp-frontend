CREATE POLICY "Anyone can insert users"
ON public.users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update users"
ON public.users FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can delete users"
ON public.users FOR DELETE
TO anon, authenticated
USING (true);