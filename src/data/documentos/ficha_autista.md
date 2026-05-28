# Diccionario de Datos: Ficha Integral PAI

Este documento contiene la estructura detallada de los campos necesarios para replicar la Ficha Integral del Plan de Acción Integral (PAI) en una base de datos relacional (PostgreSQL/MySQL).

## 1. Tabla Principal: `personas_autismo`
Almacena la información base, hitos del desarrollo y contexto educativo.

| Campo | Tipo | Descripción / Valores |
| :--- | :--- | :--- |
| `id` | UUID / PK | Identificador único del paciente |
| `full_name` | VARCHAR(255)| Nombres y apellidos completos |
| `birth_date` | DATE | Fecha de nacimiento |
| `sexo_nacimiento` | ENUM | 'hombre', 'mujer', 'intersexual' |
| `identidad_genero` | VARCHAR(100)| Identidad de género auto-percibida |
| `nacionalidad` | VARCHAR(100)| Nacionalidad (Ej: Ecuatoriana) |
| `ciudad_provincia` | VARCHAR(255)| Ubicación geográfica |
| `idiomas_casa` | TEXT[] | Lista de idiomas (JSON o Array) |
| `nombre_madre` | VARCHAR(255)| Nombre de la madre/cuidadora |
| `telefono_madre` | VARCHAR(50) | Teléfono de la madre |
| `nombre_padre` | VARCHAR(255)| Nombre del padre/cuidador |
| `telefono_padre` | VARCHAR(50) | Teléfono del padre |
| `tipo_escolaridad` | ENUM | 'regular', 'inclusiva', 'especial', 'casa' |
| `anio_escolar` | VARCHAR(100)| Grado actual (Ej: 3ro EGB) |
| `nombre_establecimiento`| VARCHAR(255)| Institución educativa |
| `nombre_profesor` | VARCHAR(255)| Tutor/a académico |
| `telefono_profesor` | VARCHAR(50) | Contacto del tutor/a |
| `profesor_sombra` | BOOLEAN | ¿Usa apoyo de profesor sombra? |
| `diagnostico_tea` | BOOLEAN | ¿Tiene diagnóstico confirmado? |
| `fecha_diagnostico` | DATE | Fecha del diagnóstico clínico |
| `nivel_apoyo` | ENUM | 'nivel_1', 'nivel_2', 'nivel_3' |
| `edad_primera_palabra` | VARCHAR(50) | Hito de lenguaje (Ej: 14 meses) |
| `edad_caminar` | VARCHAR(50) | Hito motor (Ej: 12 meses) |
| `regresion` | BOOLEAN | ¿Hubo pérdida de habilidades? |
| `edad_regresion` | VARCHAR(50) | Edad cuando ocurrió la regresion |
| `detalle_regresion` | TEXT | Descripción de habilidades perdidas |
| `intereses_especiales` | TEXT | Pasiones y temas de interés |
| `refuerzos_preferidos` | TEXT | Incentivos y premios efectivos |
| `actividades_favoritas` | TEXT | Actividades de ocio preferidas |
| `talentos_destacados` | TEXT | Habilidades sobresalientes |
| `practica_deportes` | BOOLEAN | ¿Realiza deporte? |
| `deportes_practicados` | TEXT | Lista de deportes |
| `created_at` | TIMESTAMP | Fecha de creación del registro |

---

## 2. Tabla: `perfil_escalas`
Valores numéricos (1-5) para medir sensibilidad y autonomía.
**Relación:** Múltiples registros por `persona_autismo_id`.

| Campo | Tipo | Categoría / Items Posibles |
| :--- | :--- | :--- |
| `id` | UUID / PK | Identificador único |
| `persona_id` | UUID / FK | ID de la persona (Tabla 1) |
| `categoria` | ENUM | 'sensorial', 'motor', 'adaptativo' |
| `item` | VARCHAR(100)| Ver lista de items abajo |
| `valor` | INT (1-5) | 1: Sin problema, 5: Problema mayor |

**Items por Categoría:**
- **Sensorial:** `auditiva`, `visual`.
- **Motor:** `coordinacion`, `equilibrio`, `pinza`, `escritura`, `utensilios`, `actividad_fisica`.
- **Adaptativo:** `autocuidado`, `alimentacion`, `esfinteres`, `seguridad`, `dinero`, `transporte`, `rutinas`.

---

## 3. Tabla: `conductas_desafiantes`
Seguimiento de conductas que requieren intervención.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID / PK | Identificador único |
| `persona_id` | UUID / FK | ID de la persona |
| `tipo_conducta` | ENUM | 'agresion', 'autoagresion', 'berrinche', 'fuga', 'destruccion' |
| `intensidad` | INT (1-5) | Severidad de la conducta |
| `frecuencia_semanal` | INT | Veces por semana |
| `duracion_minutos` | INT | Tiempo promedio por episodio |

---

## 4. Tabla: `intervenciones_terapias`
Registro de apoyos terapéuticos actuales.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID / PK | Identificador único |
| `persona_id` | UUID / FK | ID de la persona |
| `tipo_terapia` | VARCHAR(100)| 'ABA', 'TCC', 'Lenguaje', 'Ocupacional', 'Social' |
| `frecuencia_semanal` | INT | Sesiones por semana |
| `duracion_minutos` | INT | Tiempo por sesión |
| `generaliza_casa` | BOOLEAN | ¿Aplica actividades en casa? |
| `generaliza_escuela` | BOOLEAN | ¿Aplica actividades en escuela? |

---

## 5. Tabla: `perfil_etiquetas`
Almacena selecciones múltiples (etiquetas) para categorías variadas.

| Campo | Tipo | Categorías Posibles |
| :--- | :--- | :--- |
| `id` | UUID / PK | Identificador único |
| `persona_id` | UUID / FK | ID de la persona |
| `categoria` | ENUM | 'perfil_social', 'emocion', 'comorbilidad', 'materia_dificil', 'competencia' |
| `etiqueta` | VARCHAR(255)| Nombre de la etiqueta |

**Valores sugeridos para `etiqueta`:**
- **Emociones:** 'Alegria', 'Tristeza', 'Enojo', 'Miedo', 'Frustracion', 'Calma'.
- **Perfil Social:** 'Respuesta al nombre', 'Atencion conjunta', 'Juego simbolico', 'Juego cooperativo'.
- **Comorbilidad:** 'TDAH', 'Epilepsia', 'Ansiedad', 'Discapacidad intelectual'.
- **Materias Difíciles:** 'Matematica', 'Ciencias', 'Artes', 'Tecnologia'.
- **Competencias:** 'Memoria excepcional', 'Calculo', 'Pensamiento visual', 'Musical', 'Hiperenfoque'.
