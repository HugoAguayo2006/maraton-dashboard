# Marathon Dashboard

Aplicación personal, mobile-first, para administrar la preparación de Hugo para el Maratón de Guadalajara del 8 de noviembre de 2026. Incluye autenticación, plan prescrito, registro de entrenamientos reales, dashboard diario y métricas de progreso.

## Stack

- Next.js 16 con App Router, React y TypeScript estricto
- Tailwind CSS
- Supabase Auth y PostgreSQL
- Recharts y Lucide Icons
- Vercel

## Configuración completa

### 1. Crear el proyecto en Supabase

Crea un proyecto desde el dashboard de Supabase. En **Authentication → Providers**, comprueba que Email esté habilitado.

### 2. Configurar el entorno local

Instala dependencias y crea el archivo local de variables:

```bash
npm install
cp .env.example .env.local
```

En **Project Settings → API** copia la URL del proyecto y la clave anónima:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

La clave anónima puede estar en el cliente; la seguridad real está en las policies RLS. Nunca uses una clave `service_role` en esta aplicación.

### 3. Ejecutar las migraciones

La migración inicial está en `supabase/migrations/202609070001_initial_schema.sql`. Con Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

También puedes ejecutar el contenido de la migración desde **SQL Editor**. Esta crea:

- `athlete_profiles`
- `training_plan_items`
- `workout_logs`
- `ai_recommendations`
- constraints, índices y triggers de `updated_at`
- policies RLS de SELECT, INSERT, UPDATE y DELETE para cada propietario

`training_plan_items` representa lo que decía el plan. `workout_logs` representa lo que realmente ocurrió. La relación entre ambas es opcional y nunca sustituye una fuente por la otra.

### 4. Crear el usuario

Puedes crear la cuenta desde `/login` con **Crear cuenta** o desde **Authentication → Users** en Supabase. Si la confirmación de correo está habilitada, confirma la dirección antes de iniciar sesión.

### 5. Cargar el perfil y el plan

El seed se autentica como el usuario real y opera bajo RLS; no utiliza `service_role`. Agrega temporalmente estas variables a `.env.local`:

```bash
SEED_EMAIL=hugo@example.com
SEED_PASSWORD=your-password
# Opcional: evita sembrar accidentalmente otra cuenta.
SEED_USER_ID=authenticated-user-uuid
```

Después ejecuta:

```bash
npm run seed:plan
```

El proceso es idempotente: el perfil se actualiza por `user_id` y las sesiones por `user_id + date + title`. Los datos del perfil de Hugo ya están preparados. El arreglo de sesiones está vacío hasta recibir el plan real; las 9 semanas deben añadirse a `scripts/trainingPlan.seed.ts`.

No agregues `SEED_EMAIL`, `SEED_PASSWORD` ni `SEED_USER_ID` a Vercel.

### 6. Ejecutar localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Las rutas de la aplicación redirigen a `/login` cuando no existe una sesión válida.

## Comandos

```bash
npm run dev
npm run lint
npm run build
npm run seed:plan
npm start
```

## Arquitectura de datos

- `lib/supabase/client.ts`: cliente para Client Components.
- `lib/supabase/server.ts`: cliente SSR basado en cookies.
- `lib/supabase/proxy.ts` y `proxy.ts`: refresco de sesión y protección temprana de rutas.
- `lib/data/`: acceso centralizado a perfil, plan, entrenamientos y agregados.
- `types/database.ts`: tipos del esquema de Supabase.
- `data/mockDashboard.ts`: fixture visual de referencia; las rutas autenticadas ya no lo consumen.

Cada Server Action vuelve a comprobar la sesión. El navegador nunca proporciona un `user_id` confiable y todas las consultas quedan limitadas adicionalmente por RLS.

## Deploy en Vercel

1. Sube el repositorio a Git.
2. Importa el proyecto en Vercel.
3. Configura únicamente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Agrega la URL de producción a las Redirect URLs permitidas en Supabase Auth.
5. Despliega con `npm run build`.

No hay dependencias del filesystem en runtime. Gemini, Strava, Apple Health, notificaciones y ajustes automáticos del plan quedan fuera de esta fase.
