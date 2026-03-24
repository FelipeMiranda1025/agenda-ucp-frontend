
-- 1. Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read audit_log" ON public.audit_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert audit_log" ON public.audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 2. Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old jsonb;
  _new jsonb;
  _record_id text;
  _changed text[];
  _key text;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    _old := to_jsonb(OLD);
    _record_id := _old->>'id';
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields)
    VALUES (TG_TABLE_NAME, COALESCE(_record_id, ''), 'DELETE', _old, NULL, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'INSERT') THEN
    _new := to_jsonb(NEW);
    _record_id := _new->>'id';
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields)
    VALUES (TG_TABLE_NAME, COALESCE(_record_id, ''), 'INSERT', NULL, _new, NULL);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    _record_id := _new->>'id';
    _changed := ARRAY[]::text[];
    FOR _key IN SELECT jsonb_object_keys(_new)
    LOOP
      IF (_old->_key IS DISTINCT FROM _new->_key) THEN
        _changed := array_append(_changed, _key);
      END IF;
    END LOOP;
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields)
    VALUES (TG_TABLE_NAME, COALESCE(_record_id, ''), 'UPDATE', _old, _new, _changed);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. Apply triggers to all 13 tables
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.agendas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.agenda_comments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.indirect_teaching FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.investigations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.social_projects FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.teacher_training FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.degree_works FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.complementary_activities FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.administrative_activities FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.academic_practices FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.professional_careers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
