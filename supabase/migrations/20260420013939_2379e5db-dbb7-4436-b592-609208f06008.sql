-- Tabla singleton de configuración global
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system_settings"
  ON public.system_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert system_settings"
  ON public.system_settings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update system_settings"
  ON public.system_settings FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fila inicial: sistema encendido por defecto
INSERT INTO public.system_settings (key, value)
VALUES ('system_enabled', '{"enabled": true}'::jsonb);

-- Realtime
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;