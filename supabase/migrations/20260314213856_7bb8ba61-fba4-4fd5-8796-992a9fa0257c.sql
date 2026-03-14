-- Update RLS policies for all catalog tables to allow anon role

DROP POLICY "Anyone can read subjects" ON public.subjects;
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read semester" ON public.semester;
CREATE POLICY "Anyone can read semester" ON public.semester FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read faculties" ON public.faculties;
CREATE POLICY "Anyone can read faculties" ON public.faculties FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read education_levels" ON public.education_levels;
CREATE POLICY "Anyone can read education_levels" ON public.education_levels FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read professional_careers" ON public.professional_careers;
CREATE POLICY "Anyone can read professional_careers" ON public.professional_careers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read indirect_teaching" ON public.indirect_teaching;
CREATE POLICY "Anyone can read indirect_teaching" ON public.indirect_teaching FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read investigations" ON public.investigations;
CREATE POLICY "Anyone can read investigations" ON public.investigations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read social_projects" ON public.social_projects;
CREATE POLICY "Anyone can read social_projects" ON public.social_projects FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read teacher_training" ON public.teacher_training;
CREATE POLICY "Anyone can read teacher_training" ON public.teacher_training FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read degree_works" ON public.degree_works;
CREATE POLICY "Anyone can read degree_works" ON public.degree_works FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read complementary_activities" ON public.complementary_activities;
CREATE POLICY "Anyone can read complementary_activities" ON public.complementary_activities FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read administrative_activities" ON public.administrative_activities;
CREATE POLICY "Anyone can read administrative_activities" ON public.administrative_activities FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read academic_practices" ON public.academic_practices;
CREATE POLICY "Anyone can read academic_practices" ON public.academic_practices FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read roles" ON public.roles;
CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read states" ON public.states;
CREATE POLICY "Anyone can read states" ON public.states FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Anyone can read users" ON public.users;
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Users can read their own agendas" ON public.agendas;
CREATE POLICY "Users can read agendas" ON public.agendas FOR SELECT TO anon, authenticated USING (true);

DROP POLICY "Users can insert agendas" ON public.agendas;
CREATE POLICY "Users can insert agendas" ON public.agendas FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY "Users can update their own agendas" ON public.agendas;
CREATE POLICY "Users can update agendas" ON public.agendas FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY "Users can delete their own agendas" ON public.agendas;
CREATE POLICY "Users can delete agendas" ON public.agendas FOR DELETE TO anon, authenticated USING (true);