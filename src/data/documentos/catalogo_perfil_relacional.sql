/* 
  MIGRACIÓN RELACIONAL: CATÁLOGOS PAI
  Este script crea la infraestructura para manejar opciones de forma profesional.
  Ejecutar este script en el SQL Editor de Supabase.
*/

-- 1. Tabla Maestra de Catálogos
CREATE TABLE IF NOT EXISTS catalogos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL, -- Ej: 'comorbilidad', 'materia', 'habilidad'
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(categoria, nombre)
);

-- 2. Tabla de Relación (Muchos a Muchos)
-- Conecta al niño con sus características seleccionadas
CREATE TABLE IF NOT EXISTS persona_perfil_items (
    persona_id UUID REFERENCES personas_autismo(id) ON DELETE CASCADE,
    catalogo_id UUID REFERENCES catalogos(id) ON DELETE CASCADE,
    PRIMARY KEY (persona_id, catalogo_id)
);

-- 3. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_persona_items_persona ON persona_perfil_items(persona_id);
CREATE INDEX IF NOT EXISTS idx_catalogos_categoria ON catalogos(categoria);

-- 4. Inserción de Opciones (Data Inicial)
INSERT INTO catalogos (categoria, nombre) VALUES
('comorbilidad', 'TDAH'), ('comorbilidad', 'Ansiedad'), ('comorbilidad', 'Epilepsia'), 
('comorbilidad', 'Déficit Cognitivo'), ('comorbilidad', 'Problemas Gastro'), 
('comorbilidad', 'Trastornos Sueño'), ('comorbilidad', 'Discapacidad Motora'),
('habilidad_social', 'Contacto Visual'), ('habilidad_social', 'Saluda'), 
('habilidad_social', 'Inicia Juego'), ('habilidad_social', 'Sigue Reglas'), 
('habilidad_social', 'Comparte'), ('habilidad_social', 'Reconoce Emociones'),
('habilidad_comunicativa', 'Verbal'), ('habilidad_comunicativa', 'No Verbal'), 
('habilidad_comunicativa', 'Uso de Pictos'), ('habilidad_comunicativa', 'Ecolalia'), 
('habilidad_comunicativa', 'Gestos'), ('habilidad_comunicativa', 'Frases Completas'),
('conducta', 'Agresividad'), ('conducta', 'Autolesión'), ('conducta', 'Berrinches'), 
('conducta', 'Fugas'), ('conducta', 'Destrucción'), ('conducta', 'Gritos'),
('materia', 'Matemáticas'), ('materia', 'Ciencias'), ('materia', 'Arte'), 
('materia', 'Música'), ('materia', 'Ed. Física'), ('materia', 'Lectura'), ('materia', 'Sociales'),
('emocion', 'Alegría'), ('emocion', 'Tristeza'), ('emocion', 'Enojo'), ('emocion', 'Miedo'), 
('emocion', 'Sorpresa'), ('emocion', 'Disgusto'), ('emocion', 'Frustración'), ('emocion', 'Calma'), ('emocion', 'Ansiedad'),
('competencia', 'Memoria'), ('competencia', 'Cálculo'), ('competencia', 'Pensamiento Visual'), 
('competencia', 'Música'), ('competencia', 'Tecnología'), ('competencia', 'Dibujo'), 
('competencia', 'Empatía'), ('competencia', 'Sistemas')
ON CONFLICT DO NOTHING;
