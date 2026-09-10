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

Las migraciones están en `supabase/migrations/`. La segunda migración agrega onboarding, fecha de nacimiento, categorías de esfuerzo, textos originales del Excel y el archivo privado de importaciones. Con Supabase CLI:

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
- `training_plan_imports`, que conserva una instantánea privada del Excel original
- constraints, índices y triggers de `updated_at`
- policies RLS de SELECT, INSERT, UPDATE y DELETE para cada propietario

`training_plan_items` representa lo que decía el plan. `workout_logs` representa lo que realmente ocurrió. La relación entre ambas es opcional y nunca sustituye una fuente por la otra.

## Athlete onboarding

Desde `/login`, **Crear cuenta** solicita nombre, fecha de nacimiento, peso, sexo, correo y confirmación de contraseña. Los datos personales viajan como metadata de Auth y un trigger validado crea `athlete_profiles` usando el `id` real de `auth.users`; el navegador nunca elige el `user_id`.

Si la confirmación de correo está habilitada, confirma la dirección antes de iniciar sesión. Los usuarios existentes sin `date_of_birth` son enviados a `/onboarding`; al completar el perfil regresan al dashboard y no vuelven a ver ese paso.

La edad no se edita ni se guarda como fuente de verdad. Se calcula dinámicamente desde `date_of_birth`, considerando si el cumpleaños ya ocurrió en el año actual. Nombre, fecha de nacimiento, peso y sexo se pueden actualizar en `/settings`.

## Training plan import

El plan original está en:

```text
data/imports/Plan_Maraton_GDL_2026_Hugo.xlsx
```

El Excel solo se lee desde un script local. Vercel y los componentes React nunca lo abren durante runtime; después de la importación, Supabase es la fuente de verdad.

El importador se autentica como el usuario real y opera bajo RLS, sin `service_role`. Agrega temporalmente estas variables a `.env.local`:

El seed se autentica como el usuario real y opera bajo RLS; no utiliza `service_role`. Agrega temporalmente estas variables a `.env.local`:

```bash
SEED_EMAIL=hugo@example.com
SEED_PASSWORD=your-password
# Opcional: evita sembrar accidentalmente otra cuenta.
SEED_USER_ID=authenticated-user-uuid
```

Primero valida todo el libro sin hacer escrituras:

```bash
npm run import:plan
```

Si el reporte muestra todas las filas válidas y cero errores, aplica la importación:

```bash
npm run import:plan:apply
```

El proceso es idempotente por `user_id + date + title`: vuelve a actualizar las mismas sesiones sin duplicarlas y nunca degrada una sesión completada a pendiente. Conserva los textos originales de pace/RPE, infiere `effort_type`, añade las rutinas detalladas de la hoja **Gimnasio**, archiva las cuatro hojas y vincula de forma exacta el workout real del 07/09/2026.

`npm run seed:plan` permanece disponible para futuras cargas programáticas, pero no sobrescribe nombre, nacimiento, peso ni sexo.

No agregues `SEED_EMAIL`, `SEED_PASSWORD` ni `SEED_USER_ID` a Vercel. Después de importar puedes dejar `SEED_PASSWORD` vacío en `.env.local`.

## Ejecutar localmente

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
npm run import:plan
npm run import:plan:apply
npm start
```

## Arquitectura de datos

- `lib/supabase/client.ts`: cliente para Client Components.
- `lib/supabase/server.ts`: cliente SSR basado en cookies.
- `lib/supabase/proxy.ts` y `proxy.ts`: refresco de sesión y protección temprana de rutas.
- `lib/data/`: acceso centralizado a perfil, plan, entrenamientos y agregados.
- `types/database.ts`: tipos del esquema de Supabase.
- `lib/profile/`: validación del perfil y cálculo dinámico de edad.
- `lib/training/`: pace, RPE, esfuerzo y cumplimiento centralizados.
- `scripts/importTrainingPlanFromExcel.ts`: validación e importación local del Excel.

Cada Server Action vuelve a comprobar la sesión. El navegador nunca proporciona un `user_id` confiable y todas las consultas quedan limitadas adicionalmente por RLS.

El cumplimiento excluye descanso. Las sesiones de carrera y fuerza sí son elegibles; únicamente `status = completed` cuenta como completada. Una sesión `modified` todavía queda pendiente hasta completarse.

## Deploy en Vercel

1. Sube el repositorio a Git.
2. Importa el proyecto en Vercel.
3. Configura únicamente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Agrega la URL de producción a las Redirect URLs permitidas en Supabase Auth.
5. Despliega con `npm run build`.

No hay dependencias del filesystem en runtime. Gemini, Strava, Apple Health, notificaciones y ajustes automáticos del plan quedan fuera de esta fase.
