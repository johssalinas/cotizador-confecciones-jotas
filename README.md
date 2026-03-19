# Cotizador Web - Confecciones Jotas

Aplicacion web minimalista y rapida para generar y administrar cotizaciones en un pequeno negocio.

## Stack

- Astro 6 (SSR server-side)
- SolidJS (componentes interactivos)
- TanStack Form (captura del formulario)
- TanStack Table (tabla editable de productos)
- shadcn/ui para Solid (`shadcn-solid` style components)
- Supabase (Database + Storage)
- `pdf-lib` para generacion de PDF

## Funcionalidades incluidas

- Inicio con listado de cotizaciones guardadas
- Crear nueva cotizacion
- Editar cotizacion existente
- Duplicar cotizacion
- Eliminar cotizacion
- Ver PDF en navegador
- Descargar PDF
- Número de cotizacion autoincrementable generado en DB

## Estructura principal

```text
src/
  components/
    FormularioCotizacion.tsx
    TablaProductos.tsx
    VistaPDF.tsx
    ListaCotizaciones.tsx
    ui/
  layouts/
    AppLayout.astro
  lib/
    cotizaciones/
    pdf/
    supabase/
  pages/
    index.astro
    cotizaciones/nueva.astro
    cotizaciones/[id].astro
    api/
supabase/
  migrations/20260319_init_cotizaciones.sql
```

## Variables de entorno

Usa `.env.local` (puedes copiar desde `.env.example`):

```bash
PUBLIC_SUPABASE_URL="https://TU-PROYECTO.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="TU_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
```

## Instalacion local

1. Instala dependencias:

```bash
npm install
```

1. Crea tu archivo de entorno:

```bash
cp .env.example .env.local
```

1. Ejecuta la migracion SQL en Supabase SQL Editor:

- `supabase/migrations/20260319_init_cotizaciones.sql`

1. Levanta el entorno local:

```bash
npm run dev
```

## Build y verificacion

```bash
npm run check
npm run build
```

## Despliegue en Vercel (recomendado)

1. Importa el repo en Vercel.
1. Configura variables de entorno:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

1. Build command:

```bash
npm run build
```

## Despliegue en Netlify (alternativo)

1. Instala y configura adapter de Netlify en Astro si quieres target nativo.
1. Usa las mismas variables de entorno.
1. Build command: `npm run build`.

## Notas sobre limites

- Tamano maximo por PDF: 2 MB (enforced en bucket Supabase)
- Bucket publico para PDFs: `cotizaciones`
- Diseñado para mantenerse dentro de free tier en uso de pequeno negocio

## Seguridad

- Esta version no implementa login por requerimiento.
- Para produccion abierta en internet, se recomienda agregar una clave operativa o control adicional en una siguiente fase.
