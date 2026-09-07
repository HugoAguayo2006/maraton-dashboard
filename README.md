# Marathon Dashboard

Aplicación web personal para administrar y visualizar la preparación de Hugo para el Maratón de Guadalajara del 8 de noviembre de 2026. La experiencia está diseñada mobile-first, con un dashboard diario, plan semanal, registro de sesiones y métricas de progreso.

## Stack

- Next.js con App Router
- React y TypeScript
- Tailwind CSS
- Supabase (PostgreSQL y Auth)
- Recharts
- Lucide Icons
- Vercel

## Instalación local

Requiere Node.js 20.9 o superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Mientras Supabase no esté configurado, todas las pantallas consumen datos tipados desde `data/mockDashboard.ts`; no se usa `localStorage` como persistencia.

Comandos disponibles:

```bash
npm run dev
npm run lint
npm run build
npm start
```

## Variables de entorno

Configura estas variables en `.env.local` y también en el proyecto de Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

La clave anónima es pública por diseño, pero las políticas Row Level Security siguen siendo obligatorias. Nunca agregues una `service_role` al frontend.

## Preparación de Supabase

Los adaptadores para navegador y servidor viven en `lib/supabase/client.ts` y `lib/supabase/server.ts`. La siguiente fase debe crear el esquema, sus políticas RLS y autenticación para un único atleta.

Tablas previstas:

- `athlete_profiles`: perfil, carrera y objetivo del atleta.
- `training_plan_items`: lo que estaba prescrito en el plan.
- `workout_logs`: lo que el atleta realizó realmente.
- `ai_recommendations`: recomendaciones futuras del asistente.

`training_plan_items` y `workout_logs` son conceptos distintos. Un registro real puede referenciar opcionalmente a una sesión del plan, pero nunca la reemplaza ni comparte su fuente de verdad.

## Deploy en Vercel

1. Sube el repositorio a tu proveedor Git.
2. Importa el proyecto en Vercel.
3. Agrega las dos variables públicas de Supabase.
4. Usa el comando de build `npm run build` y deja el directorio de salida predeterminado de Next.js.

El proyecto no depende del filesystem en runtime y está preparado para el entorno serverless de Vercel.
# maraton-dashboard
