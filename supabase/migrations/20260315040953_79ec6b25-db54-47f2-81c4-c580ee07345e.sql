DROP TABLE IF EXISTS degree_works;
CREATE TABLE degree_works (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  number_projects INTEGER DEFAULT 0,
  number_weeks INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE degree_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read degree_works" ON degree_works FOR SELECT TO anon, authenticated USING (true);