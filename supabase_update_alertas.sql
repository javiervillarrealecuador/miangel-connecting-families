-- Añadir columnas de configuración de alertas a la tabla equipo_pai
ALTER TABLE public.equipo_pai 
ADD COLUMN IF NOT EXISTS recibir_alertas BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS metodos_alerta TEXT[] DEFAULT ARRAY['app', 'email'],
ADD COLUMN IF NOT EXISTS sensibilidad_minima INTEGER DEFAULT 2;
