-- PLAN DE POLÍTICAS DE SEGURIDAD (RLS) PARA MIANGEL
-- Este archivo es una propuesta y no afecta la base de datos de producción hasta que sea ejecutado manualmente en el Editor de SQL de Supabase.

-- =====================================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS PRINCIPALES
-- =====================================================================

ALTER TABLE public.familias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas_autismo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_pai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pai_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_validados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retroalimentacion_actividades ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. POLÍTICAS PARA LA TABLA: familias
-- =====================================================================

-- Permitir lectura si el usuario autenticado es el propietario o es miembro en equipo_pai
CREATE POLICY select_familias ON public.familias
    FOR SELECT
    USING (
        auth.uid() = propietario_id 
        OR EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.familia_id = familias.id AND equipo_pai.user_id = auth.uid()
        )
    );

-- Permitir inserción en onboarding
CREATE POLICY insert_familias ON public.familias
    FOR INSERT
    WITH CHECK (auth.uid() = propietario_id);

-- Permitir actualización al propietario
CREATE POLICY update_familias ON public.familias
    FOR UPDATE
    USING (auth.uid() = propietario_id);

-- =====================================================================
-- 3. POLÍTICAS PARA LA TABLA: personas_autismo
-- =====================================================================

-- Lectura para miembros de la familia
CREATE POLICY select_personas ON public.personas_autismo
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.persona_autismo_id = personas_autismo.id AND equipo_pai.user_id = auth.uid()
        )
    );

-- Inserción durante onboarding
CREATE POLICY insert_personas ON public.personas_autismo
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.familias 
            WHERE familias.id = personas_autismo.familia_id AND familias.propietario_id = auth.uid()
        )
    );

-- =====================================================================
-- 4. POLÍTICAS PARA LA TABLA: equipo_pai
-- =====================================================================

-- Lectura para miembros del mismo equipo o invitaciones pendientes de su correo
CREATE POLICY select_equipo ON public.equipo_pai
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR invite_email = auth.jwt()->>'email'
        OR familia_id IN (
            SELECT familia_id FROM public.equipo_pai WHERE user_id = auth.uid()
        )
    );

-- Permitir registro/invitación
CREATE POLICY insert_equipo ON public.equipo_pai
    FOR INSERT
    WITH CHECK (
        -- Permitirse registrar a sí mismo en onboarding o invitar si es el propietario de la familia
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.familias 
            WHERE familias.id = equipo_pai.familia_id AND familias.propietario_id = auth.uid()
        )
    );

-- Permitir actualización de permisos o estado de invitación
CREATE POLICY update_equipo ON public.equipo_pai
    FOR UPDATE
    USING (
        user_id = auth.uid() -- Aceptar invitación
        OR EXISTS (
            SELECT 1 FROM public.familias 
            WHERE familias.id = equipo_pai.familia_id AND familias.propietario_id = auth.uid()
        )
    );

-- =====================================================================
-- 5. POLÍTICAS PARA LA TABLA: pai_goals
-- =====================================================================

-- Lectura para el equipo autorizado
CREATE POLICY select_goals ON public.pai_goals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.persona_autismo_id = pai_goals.persona_autismo_id 
              AND equipo_pai.user_id = auth.uid() 
              AND equipo_pai.puede_ver_objetivos = true
        )
    );

-- Inserción / Edición si tiene el permiso
CREATE POLICY write_goals ON public.pai_goals
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.persona_autismo_id = pai_goals.persona_autismo_id 
              AND equipo_pai.user_id = auth.uid() 
              AND equipo_pai.puede_editar_objetivos = true
        )
    );

-- =====================================================================
-- 6. POLÍTICAS PARA LA TABLA: observaciones
-- =====================================================================

-- Lectura si tiene permiso
CREATE POLICY select_observaciones ON public.observaciones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.persona_autismo_id = observaciones.persona_autismo_id 
              AND equipo_pai.user_id = auth.uid() 
              AND equipo_pai.puede_ver_observaciones = true
        )
    );

-- Creación si tiene permiso
CREATE POLICY insert_observaciones ON public.observaciones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.persona_autismo_id = observaciones.persona_autismo_id 
              AND equipo_pai.user_id = auth.uid() 
              AND equipo_pai.puede_crear_observaciones = true
        )
    );

-- =====================================================================
-- 7. POLÍTICAS PARA LA TABLA: alertas
-- =====================================================================

-- Lectura de alertas de la familia/persona
CREATE POLICY select_alertas ON public.alertas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.persona_autismo_id = alertas.persona_autismo_id 
              AND equipo_pai.user_id = auth.uid()
        )
    );

-- Inserción/Actualización de alertas
CREATE POLICY write_alertas ON public.alertas
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.equipo_pai 
            WHERE equipo_pai.persona_autismo_id = alertas.persona_autismo_id 
              AND equipo_pai.user_id = auth.uid()
        )
    );
