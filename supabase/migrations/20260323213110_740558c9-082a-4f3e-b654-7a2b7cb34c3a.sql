
-- RLS policies for indirect_teaching
CREATE POLICY "Anyone can insert indirect_teaching" ON public.indirect_teaching FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update indirect_teaching" ON public.indirect_teaching FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete indirect_teaching" ON public.indirect_teaching FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for degree_works
CREATE POLICY "Anyone can insert degree_works" ON public.degree_works FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update degree_works" ON public.degree_works FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete degree_works" ON public.degree_works FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for academic_practices
CREATE POLICY "Anyone can insert academic_practices" ON public.academic_practices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update academic_practices" ON public.academic_practices FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete academic_practices" ON public.academic_practices FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for investigations
CREATE POLICY "Anyone can insert investigations" ON public.investigations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update investigations" ON public.investigations FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete investigations" ON public.investigations FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for social_projects
CREATE POLICY "Anyone can insert social_projects" ON public.social_projects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update social_projects" ON public.social_projects FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete social_projects" ON public.social_projects FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for complementary_activities
CREATE POLICY "Anyone can insert complementary_activities" ON public.complementary_activities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update complementary_activities" ON public.complementary_activities FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete complementary_activities" ON public.complementary_activities FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for teacher_training
CREATE POLICY "Anyone can insert teacher_training" ON public.teacher_training FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update teacher_training" ON public.teacher_training FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete teacher_training" ON public.teacher_training FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for administrative_activities
CREATE POLICY "Anyone can insert administrative_activities" ON public.administrative_activities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update administrative_activities" ON public.administrative_activities FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete administrative_activities" ON public.administrative_activities FOR DELETE TO anon, authenticated USING (true);
