# Marathon Dashboard

Aplicación personal, mobile-first, para administrar una preparación de carrera. Incluye autenticación, perfil y evento objetivo, plan prescrito, registro de carrera y fuerza, dashboard diario, guía de entrenamiento y métricas de progreso.

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

Las migraciones están en `supabase/migrations/`. Además del esquema inicial, agregan onboarding, categorías de esfuerzo, el archivo privado de importaciones, el modelo genérico de evento objetivo y Storage para avatares. Con Supabase CLI:

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
- `exercise_library`, catálogo global de ejercicios de solo lectura
- `strength_routines` y `routine_exercises`, rutinas privadas del atleta
- `strength_sessions`, `strength_session_exercises` y `strength_sets`, historial real de fuerza
- bucket `profile-images`, con límite de 4 MB y soporte para JPG, PNG y WebP
- constraints, índices y triggers de `updated_at`
- policies RLS de SELECT, INSERT, UPDATE y DELETE para cada propietario

`training_plan_items` representa lo que decía el plan. `workout_logs` representa lo que realmente ocurrió. La relación entre ambas es opcional y nunca sustituye una fuente por la otra.

## Autenticación y athlete onboarding

`/login` contiene únicamente correo y contraseña. `/signup` es un flujo dedicado que solicita datos personales, evento objetivo, credenciales y una foto opcional. Los datos estructurados viajan como metadata de Auth y un trigger validado crea `athlete_profiles` usando el `id` real de `auth.users`; el navegador nunca elige el `user_id`.

Si la confirmación de correo está habilitada, el perfil ya queda creado y completo antes de confirmar. Al iniciar sesión por primera vez, el usuario entra al Dashboard sin repetir onboarding. La foto debe agregarse desde Configuración después de confirmar el correo porque todavía no existe una sesión autenticada para Storage.

`/onboarding` se mantiene como fallback para usuarios históricos o metadata incompleta. Solicita los datos personales y del evento que falten; los perfiles completos se redirigen inmediatamente a `/dashboard`, evitando ciclos y pasos redundantes.

La edad no se edita ni se guarda como fuente de verdad. Se calcula dinámicamente desde `date_of_birth`, considerando si el cumpleaños ya ocurrió en el año actual. `/settings` permite editar nombre, nacimiento, peso, sexo, avatar, nombre/distancia/fecha/lugar del evento y objetivo personal.

## Evento objetivo

El modelo generaliza los campos históricos de maratón mediante:

- `goal_event_name`
- `goal_event_distance_km`
- `goal_event_date`
- `goal_event_location`
- `goal_event_objective`

Los campos `marathon_name`, `marathon_date` y `goal` se mantienen por compatibilidad y se sincronizan al guardar. La migración rellena el evento existente desde esos campos sin borrar información. Dashboard y Settings consumen preferentemente el nuevo modelo.

## Foto de perfil

La foto se guarda en Supabase Storage dentro de `profile-images/<auth.uid()>/`. `avatar_url` conserva la ruta del objeto y la aplicación genera la URL pública al mostrarla. Si no hay imagen, se usan las iniciales del atleta.

El bucket es público para poder renderizar el avatar sin URLs firmadas, pero las policies solo permiten que cada usuario autenticado liste, suba, reemplace o elimine objetos dentro de su propia carpeta. La acción de servidor valida nuevamente tipo y tamaño y nunca recibe un `user_id` confiable desde el navegador.

Next.js permite hasta 4.25 MB en el cuerpo multipart de estas Server Actions para dejar margen de transporte; la imagen en sí está limitada a 4 MB tanto en la aplicación como en Supabase Storage. Esto mantiene la petición debajo del límite de 4.5 MB de Vercel Functions.

La migración crea y configura automáticamente el bucket y sus policies; no hay pasos manuales en Supabase. La foto aparece en sidebar, header y Configuración.

## Módulo de fuerza

`/strength` es el centro de entrenamiento de gimnasio orientado al corredor. Desde ahí se puede:

- crear una rutina desde cero o partir de las plantillas Fuerza A, B y Ligera;
- buscar ejercicios por nombre y filtrar por grupo muscular o equipamiento;
- ordenar ejercicios y guardar notas específicas de la rutina;
- iniciar una sesión libre o basada en una rutina;
- capturar peso, repeticiones, RIR y notas de cada serie;
- marcar series como completadas y guardar únicamente el trabajo realizado;
- consultar historial, volumen y progresión por ejercicio;
- trabajar en kilogramos o libras según la preferencia guardada en Configuración.

Los días `gym` o `strength` del plan muestran **Registrar sesión de fuerza**. El registro queda enlazado mediante `training_plan_item_id` y, al guardarse correctamente, marca esa sesión prescrita como completada sin crear un `workout_log` de carrera.

El catálogo inicial contiene 83 ejercicios. La migración lo carga automáticamente; también puede verificarse o reconstruirse de forma idempotente con una sesión normal bajo RLS:

```bash
npm run seed:exercises
```

El script utiliza `SEED_EMAIL`, `SEED_PASSWORD` y el `SEED_USER_ID` opcional de `.env.local`. No requiere ni acepta una clave `service_role`. Los usuarios autenticados pueden leer el catálogo global, pero no insertar ejercicios arbitrarios. La función del seed únicamente vuelve a procesar el catálogo fijo incluido en la migración.

Todas las tablas personales de fuerza están protegidas por RLS. `strength_routines` y `strength_sessions` verifican directamente `auth.uid() = user_id`; las tablas hijas comprueban la propiedad a través de su rutina o sesión. El navegador nunca define el propietario.

## Guía de entrenamiento

`/guide` ofrece tres secciones responsive:

- ritmos y esfuerzo;
- rutinas A, B y Ligera de gimnasio;
- reglas prácticas para interpretar el plan.

Los datos derivados de **Guía de ritmos** y **Gimnasio** viven tipados en `lib/guide/data.ts`. El XLSX no se lee durante el runtime de Next.js. La guía está disponible desde el sidebar, la navegación móvil, Dashboard y Plan.

Las rutas usan View Transitions de React/Next.js y las pestañas una animación CSS de 190 ms. Ambas respetan `prefers-reduced-motion` y no requieren una librería de animación adicional.

## Training plan import

El plan original está en:

```text
data/imports/Plan_Maraton_GDL_2026_Hugo.xlsx
```

El Excel solo se lee desde un script local. Vercel y los componentes React nunca lo abren durante runtime; después de la importación, Supabase es la fuente de verdad.

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
npm run seed:exercises
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
- `lib/profile/avatar.ts` y `lib/data/avatar.ts`: URL pública, validación y reemplazo seguro de avatar.
- `lib/guide/data.ts`: contenido tipado de la guía, derivado del Excel.
- `lib/data/strength.ts`: consultas y agregados privados de rutinas, sesiones y progresión.
- `lib/strength/`: unidades, filtros y plantillas de fuerza.
- `components/strength/`: selector, constructor, registrador, historial y gráficas.
- `scripts/seedExercises.ts`: seed idempotente del catálogo global.
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

No hay dependencias del filesystem en runtime. El bucket y sus policies se crean con la migración, así que Vercel no requiere variables adicionales. Gemini, Strava, Apple Health, notificaciones y ajustes automáticos del plan quedan fuera de esta fase.
