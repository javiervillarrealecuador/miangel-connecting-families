# Sistema de Diseño y Jerarquía Visual - mIAngel

Este documento establece las reglas visuales y arquitectónicas para el desarrollo de la interfaz de usuario (UI) en la aplicación **mIAngel**, con el fin de evitar la degradación estética, prevenir el antipatrón de "Cards sobre Cards" y asegurar la mantenibilidad a largo plazo del código.

---

## 1. Directrices de Jerarquía Visual

### Contraste Tipográfico vs. Contenedores
Para estructurar la información en pantalla, se debe priorizar la **jerarquía tipográfica** (pesos, tamaños y colores de fuente) por encima de la creación de múltiples bordes o cajas sombreadas.

* **Títulos Principales (`h1`)**: Grande, negrita, color de contraste máximo (`text-slate-900` / `dark:text-white`).
* **Subtítulos/Categorías (`h2`, `h3`)**: Tamaño medio, tracking-wide (espaciado entre letras), mayúsculas para etiquetas de sistema.
* **Cuerpo de texto (`p`)**: Color intermedio (`text-slate-600` / `dark:text-slate-350`), tipografía legible y leading adecuado.
* **Texto Secundario/Metadatos**: Color suave (`text-slate-400` / `dark:text-slate-500`).

### Separadores Planos
En lugar de encerrar bloques de texto dentro de sub-tarjetas con bordes, se deben usar:
* **Bordes inferiores sutiles**: `border-b border-slate-100` o `dark:border-slate-900`.
* **Divisores de Tailwind**: `divide-y divide-slate-100`.
* **Bordes laterales de acento**: Para destacar citas, recomendaciones clínicas o razonamientos, usar un borde izquierdo de color (`border-l-4 border-primary/20`) con relleno de margen izquierdo (`pl-4`).

---

## 2. Regla de Profundidad Máxima (Límite 3-4 Niveles)

Ningún componente visual del DOM debe superar los **3 o 4 niveles de anidación estructural**.

```
[Nivel 1: Contenedor de Página] (bg-background)
 └── [Nivel 2: Tarjeta Principal / Fila] (bg-card border rounded-3xl)
      └── [Nivel 3: Contenido / Lista Directa] (divide-y)
           └── [Nivel 4: Elemento Plano / Texto / Badge] (py-2)
```

Si se requiere mayor nivel de detalle, la información debe presentarse mediante navegación (subpáginas), pestañas (`Tabs`) o ventanas modales (`Dialog`), nunca anidando tarjetas dentro de tarjetas.

---

## 3. Principio de Responsabilidad Única (SRP) en UI

Cada componente de React debe encargarse de **una sola tarea visual** o lógica:
* **Páginas (`src/pages/`)**: Coordinan la obtención de datos de la base de datos (Supabase), manejan la lógica de estado general y organizan el layout global.
* **Componentes (`src/components/`)**: Se encargan exclusivamente de la presentación visual y las interacciones locales de un elemento (e.g. renderizar una tarjeta de observación o un ítem de alerta) a partir de propiedades (`props`) que reciben desde la página.

**Regla**: Si un mapeo en una página excede las 20 líneas de JSX, debe ser extraído a su propio archivo en `src/components/`.

---

## 4. Uso Estricto de Shadcn/ui y Primitivas

* **Consistencia**: Utilizar los componentes primitivos provistos en `src/components/ui/` (`Button`, `Dialog`, `Input`, `Switch`, `Badge`, `Slider`) para mantener los mismos radios de curvatura (`rounded-xl`, `rounded-2xl`, `rounded-[32px]`) y animaciones en toda la aplicación.
* **Estilos personalizados**: Evitar el uso de utilidades ad-hoc no estándar en Tailwind que rompan con la escala visual del proyecto.
