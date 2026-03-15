
-- Recreate degree_works with number_projects instead of weekly_hours
DROP TABLE IF EXISTS degree_works;
CREATE TABLE degree_works (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  number_projects INTEGER NOT NULL DEFAULT 0,
  number_weeks INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE degree_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read degree_works" ON degree_works FOR SELECT TO anon, authenticated USING (true);

-- Recreate academic_practices with number_students instead of weekly_hours
DROP TABLE IF EXISTS academic_practices;
CREATE TABLE academic_practices (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  number_students INTEGER NOT NULL DEFAULT 0,
  number_weeks INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE academic_practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read academic_practices" ON academic_practices FOR SELECT TO anon, authenticated USING (true);
