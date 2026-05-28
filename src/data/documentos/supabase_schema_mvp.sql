-- mIAngel - SQL Completo para MVP (Basado en Documento 2 Mayo)
-- Ejecutar en Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 0. USUARIOS MOCK (Para satisfacer claves foráneas a auth.users)
-- -----------------------------------------------------------------------------
-- Inserción segura para pruebas, para que el script no falle.
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'padre1@ejemplo.com', 'pwd', NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'padre2@ejemplo.com', 'pwd', NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'medico@ejemplo.com', 'pwd', NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'terapeuta@ejemplo.com', 'pwd', NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'educador@ejemplo.com', 'pwd', NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 1. FAMILIAS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.familias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    propietario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_familia TEXT NOT NULL,
    pais TEXT,
    ciudad TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. PERSONAS AUTISMO (Niños)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personas_autismo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familia_id UUID REFERENCES public.familias(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    birth_date DATE,
    diagnosis_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. EQUIPO PAI
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipo_pai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_autismo_id UUID REFERENCES public.personas_autismo(id) ON DELETE CASCADE,
    familia_id UUID REFERENCES public.familias(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    rol TEXT NOT NULL,
    specialty TEXT,
    estado TEXT DEFAULT 'activo',
    codigo_verificacion TEXT,
    codigo_verificacion_vence_at TIMESTAMP WITH TIME ZONE,
    codigo_verificado_at TIMESTAMP WITH TIME ZONE,
    puede_ver_historial BOOLEAN DEFAULT true,
    puede_crear_observaciones BOOLEAN DEFAULT true,
    puede_sugerir_objetivos BOOLEAN DEFAULT false,
    puede_crear_rutinas BOOLEAN DEFAULT false,
    puede_editar_objetivos BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. OBJETIVOS PAI
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pai_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familia_id UUID REFERENCES public.familias(id) ON DELETE CASCADE,
    persona_autismo_id UUID REFERENCES public.personas_autismo(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    area TEXT,
    status TEXT DEFAULT 'activo',
    progress INTEGER DEFAULT 0,
    target_date DATE,
    created_by UUID REFERENCES auth.users(id),
    propuesto_por UUID REFERENCES auth.users(id),
    rol_propuso TEXT,
    aprobado_por UUID REFERENCES auth.users(id),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. OBSERVACIONES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.observaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familia_id UUID REFERENCES public.familias(id) ON DELETE CASCADE,
    persona_autismo_id UUID REFERENCES public.personas_autismo(id) ON DELETE CASCADE,
    registrado_por UUID REFERENCES auth.users(id),
    tipo TEXT CHECK (tipo IN ('comportamiento', 'lenguaje', 'social', 'motor', 'sensorial', 'adaptativo')),
    descripcion_texto TEXT NOT NULL,
    intensidad_escala INTEGER CHECK (intensidad_escala BETWEEN 1 AND 5),
    url_audio TEXT,
    texto_transcrito TEXT,
    contexto TEXT,
    severidad TEXT CHECK (severidad IN ('critica', 'alta', 'normal', 'baja')),
    alerta_generada BOOLEAN DEFAULT false,
    alerta_enviada_a UUID[],
    fecha_observacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. ALERTAS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familia_id UUID REFERENCES public.familias(id) ON DELETE CASCADE,
    persona_autismo_id UUID REFERENCES public.personas_autismo(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('nueva_observacion', 'cambio_comportamiento', 'patron_detectado', 'objetivo_proximo_vencer', 'regresion', 'sugerencia_estrategia')),
    descripcion TEXT NOT NULL,
    severidad TEXT CHECK (severidad IN ('critica', 'alta', 'normal', 'baja')),
    observacion_id UUID REFERENCES public.observaciones(id) ON DELETE CASCADE,
    pai_goal_id UUID REFERENCES public.pai_goals(id) ON DELETE CASCADE,
    enviado_a UUID[],
    leida_por UUID[],
    accion_sugerida TEXT,
    creada_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. DOCUMENTOS VALIDADOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documentos_validados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    autor TEXT,
    fecha_publicacion DATE,
    tipo_archivo TEXT,
    tipo_contenido TEXT,
    ruta_archivo TEXT,
    url_archivo TEXT,
    tamaño_bytes TEXT,
    mime_type TEXT,
    contenido_indexable TEXT,
    palabras_clave TEXT[],
    duracion_minutos INTEGER,
    numero_paginas INTEGER,
    idioma TEXT DEFAULT 'es',
    nivel_complejidad TEXT,
    validado_por UUID REFERENCES auth.users(id),
    fecha_validacion DATE,
    organismo_validador TEXT,
    areas_cobertura TEXT[],
    publico BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    descargas_count INTEGER DEFAULT 0,
    rating_promedio DECIMAL DEFAULT 0.0,
    numero_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. ACTIVIDADES SUGERIDAS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.actividades_sugeridas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familia_id UUID REFERENCES public.familias(id) ON DELETE CASCADE,
    persona_autismo_id UUID REFERENCES public.personas_autismo(id) ON DELETE CASCADE,
    pai_goal_id UUID REFERENCES public.pai_goals(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    instrucciones TEXT,
    duracion_estimada_minutos INTEGER,
    origen TEXT CHECK (origen IN ('documento_validado', 'sugerencia_miembro', 'generada_ia')),
    documento_fuente_id UUID REFERENCES public.documentos_validados(id) ON DELETE CASCADE,
    contextos_validos TEXT[],
    veces_sugerida INTEGER DEFAULT 0,
    veces_completada INTEGER DEFAULT 0,
    efectividad_promedio DECIMAL DEFAULT 0.0,
    creada_por UUID REFERENCES auth.users(id),
    sugerida_por UUID REFERENCES auth.users(id),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. RESÚMENES CONSOLIDADOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resumenes_consolidados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familia_id UUID REFERENCES public.familias(id) ON DELETE CASCADE,
    persona_autismo_id UUID REFERENCES public.personas_autismo(id) ON DELETE CASCADE,
    tipo_resumen TEXT CHECK (tipo_resumen IN ('diario', 'semanal', 'mensual')),
    fecha_inicio DATE,
    fecha_fin DATE,
    contenido_json JSONB,
    resumen_texto TEXT,
    cambios_comportamiento TEXT,
    actividades_principales TEXT,
    objetivos_avanzados JSONB,
    recomendaciones_futuro TEXT,
    alertas_detectadas JSONB,
    patrones_identificados JSONB,
    generado_por TEXT DEFAULT 'agente_ia',
    enviado_a UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. RETROALIMENTACIÓN DE ACTIVIDADES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.retroalimentacion_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_sugerida_id UUID REFERENCES public.actividades_sugeridas(id) ON DELETE CASCADE,
    evaluado_por UUID REFERENCES auth.users(id),
    funcionamiento_efectivo BOOLEAN,
    escala_efectividad INTEGER CHECK (escala_efectividad BETWEEN 1 AND 5),
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INSERCIÓN DE DATOS DE EJEMPLO (5 FILAS POR TABLA)
-- =============================================================================

-- 1. Familias
INSERT INTO public.familias (id, propietario_id, nombre_familia, pais, ciudad) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Familia Perez Gómez', 'Ecuador', 'Quito'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Familia Torres Sánchez', 'Ecuador', 'Guayaquil'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Familia Rodríguez', 'Ecuador', 'Cuenca'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Familia López', 'Colombia', 'Bogotá'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Familia Silva', 'Ecuador', 'Loja')
ON CONFLICT DO NOTHING;

-- 2. Personas Autismo
INSERT INTO public.personas_autismo (id, familia_id, full_name, birth_date, diagnosis_date) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mateo Perez', '2018-05-12', '2021-03-10'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Sofia Torres', '2019-08-20', '2022-01-15'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Lucas Rodríguez', '2017-11-05', '2020-09-08'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Emma López', '2020-02-14', '2023-05-18'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Liam Silva', '2021-06-30', '2023-11-20')
ON CONFLICT DO NOTHING;

-- 3. Equipo PAI
INSERT INTO public.equipo_pai (id, persona_autismo_id, familia_id, user_id, rol, specialty, estado) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Padre', 'N/A', 'activo'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Médico', 'Neuropediatra', 'activo'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Terapeuta', 'Terapia Ocupacional', 'activo'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'Educador', 'Profesor de Apoyo', 'activo'),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Médico', 'Neuropediatra', 'activo')
ON CONFLICT DO NOTHING;

-- 4. PAI Goals
INSERT INTO public.pai_goals (id, familia_id, persona_autismo_id, title, area, status, progress, target_date, created_by) VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Mejorar motricidad fina (agarre de lápiz)', 'Motor', 'activo', 30, '2026-06-01', 'a0000000-0000-0000-0000-000000000004'),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Aumentar contacto visual al hablar', 'Social', 'activo', 15, '2026-07-15', 'a0000000-0000-0000-0000-000000000003'),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Reducir aleteo en momentos de estrés', 'Comportamiento', 'activo', 50, '2026-05-30', 'a0000000-0000-0000-0000-000000000002'),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Seguir instrucciones de 2 pasos', 'Lenguaje', 'activo', 10, '2026-08-20', 'a0000000-0000-0000-0000-000000000005'),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Tolerar texturas húmedas en manos', 'Sensorial', 'activo', 80, '2026-05-10', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- 5. Observaciones
INSERT INTO public.observaciones (id, familia_id, persona_autismo_id, registrado_por, tipo, descripcion_texto, intensidad_escala, contexto, severidad) VALUES
('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'social', 'Evitó contacto visual, se retiró al área solitaria', 3, 'Parque con muchas personas', 'normal'),
('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'comportamiento', 'Rabieta intensa por no querer salir de casa', 5, 'Momento de transición', 'alta'),
('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'lenguaje', 'Logró decir 3 palabras seguidas para pedir agua', 2, 'Aula durante el almuerzo', 'baja'),
('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'motor', 'Sostuvo el lápiz correctamente por 5 minutos', 4, 'Consulta terapéutica', 'normal'),
('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'sensorial', 'Se tapó los oídos al escuchar la licuadora', 4, 'Cocina en casa', 'normal')
ON CONFLICT DO NOTHING;

-- 6. Alertas
INSERT INTO public.alertas (id, familia_id, persona_autismo_id, tipo, descripcion, severidad, observacion_id) VALUES
('77777777-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'cambio_comportamiento', 'Alerta: Rabieta intensa por transición reportada', 'alta', 'f0000000-0000-0000-0000-000000000002'),
('77777777-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'patron_detectado', 'Patrón: Las conductas agresivas aumentan los lunes', 'normal', NULL),
('77777777-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'nueva_observacion', 'Avance significativo en lenguaje en aula', 'baja', 'f0000000-0000-0000-0000-000000000003'),
('77777777-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'objetivo_proximo_vencer', 'El objetivo de motricidad vence en 7 días', 'normal', NULL),
('77777777-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'sugerencia_estrategia', 'Sugerencia: usar audífonos canceladores de ruido', 'normal', 'f0000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- 7. Documentos Validados
INSERT INTO public.documentos_validados (id, titulo, autor, tipo_archivo, tipo_contenido, url_archivo) VALUES
('88888888-0000-0000-0000-000000000001', 'Guía de Manejo Sensorial en Casa', 'Asociación de Pediatría', 'pdf', 'pdf_guia', 'https://ejemplo.com/guia1.pdf'),
('88888888-0000-0000-0000-000000000002', 'Ejercicios de Motricidad Fina', 'Terapia Global', 'video', 'video_tutorial', 'https://ejemplo.com/video1.mp4'),
('88888888-0000-0000-0000-000000000003', 'Estrategias de Transición', 'Ministerio de Salud Ecuador', 'pdf', 'articulo_cientifico', 'https://ejemplo.com/guia3.pdf'),
('88888888-0000-0000-0000-000000000004', 'Fomento de Contacto Visual', 'ASHA', 'pdf', 'pdf_guia', 'https://ejemplo.com/guia4.pdf'),
('88888888-0000-0000-0000-000000000005', 'Comunicación Aumentativa (PECS)', 'Centro TEA', 'pdf', 'pdf_guia', 'https://ejemplo.com/guia5.pdf')
ON CONFLICT DO NOTHING;

-- 8. Actividades Sugeridas
INSERT INTO public.actividades_sugeridas (id, familia_id, persona_autismo_id, pai_goal_id, nombre, descripcion, origen, documento_fuente_id) VALUES
('99999999-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Pintura con dedos', 'Usar pintura dactilar para mejorar sensibilidad y motricidad', 'documento_validado', '88888888-0000-0000-0000-000000000002'),
('99999999-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Juego de Espejo', 'Imitar expresiones frente al espejo', 'sugerencia_miembro', NULL),
('99999999-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 'Conteo respiratorio', 'Respirar profundamente 5 veces al frustrarse', 'generada_ia', NULL),
('99999999-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', 'Simón Dice (Simple)', 'Juego de seguir 2 instrucciones rápidas', 'documento_validado', '88888888-0000-0000-0000-000000000005'),
('99999999-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000005', 'Tocar gelatina', 'Juego exploratorio con gelatina en taza', 'sugerencia_miembro', NULL)
ON CONFLICT DO NOTHING;

-- 9. Resúmenes Consolidados
INSERT INTO public.resumenes_consolidados (id, familia_id, persona_autismo_id, tipo_resumen, resumen_texto) VALUES
('aaaaaaaa-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'semanal', 'Esta semana: 5 observaciones, aumento de agresividad el lunes...'),
('aaaaaaaa-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'mensual', 'Mes de Abril: Gran progreso en adaptación escolar, 3 objetivos cumplidos...'),
('aaaaaaaa-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'diario', 'Día tranquilo, se reportó buen comportamiento en terapia...'),
('aaaaaaaa-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'semanal', 'Múltiples crisis reportadas en ambiente de la cocina por ruidos...'),
('aaaaaaaa-0000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'diario', 'Día tranquilo, se reportó buen comportamiento en terapia...'),
('aaaaaaaa-0000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'semanal', 'Múltiples crisis reportadas en ambiente de la cocina por ruidos...'),
('aaaaaaaa-0000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'mensual', 'Resumen mensual: Estabilidad sensorial y mejora en el sueño...')
ON CONFLICT DO NOTHING;

-- 10. Retroalimentación Actividades
INSERT INTO public.retroalimentacion_actividades (id, actividad_sugerida_id, evaluado_por, funcionamiento_efectivo, escala_efectividad, comentarios) VALUES
('bbbbbbbb-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', true, 4, 'Le gustó bastante la pintura, aunque se ensució mucho'),
('bbbbbbbb-0000-0000-0000-0000-000000000002', '99999999-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', false, 1, 'Lloró al verse en el espejo'),
('bbbbbbbb-0000-0000-0000-0000-000000000003', '99999999-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', true, 5, 'Muy efectivo en clase para calmarlo'),
('bbbbbbbb-0000-0000-0000-0000-000000000004', '99999999-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', true, 3, 'Logró seguir 1 instrucción, la segunda le costó'),
('bbbbbbbb-0000-0000-0000-0000-000000000005', '99999999-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', false, 2, 'No quiso tocar la gelatina, le dio asco')
ON CONFLICT DO NOTHING;
