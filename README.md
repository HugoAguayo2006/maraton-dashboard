# Run Dashboard

Aplicación mobile-first para administrar una preparación de carrera. Incluye autenticación, perfil y evento objetivo, plan prescrito, registro avanzado de carrera y fuerza, importación desde Strava, dashboard diario, guía, métricas de progreso y Bolt AI como entrenador inteligente contextual.

## Stack

- Next.js 16 con App Router, React y TypeScript estricto
- Tailwind CSS
- Supabase Auth y PostgreSQL
- Recharts y Lucide Icons
- Leaflet y OpenStreetMap
- Google Gen AI SDK en servidor, detrás de una interfaz de proveedor propia
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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
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
- `connected_integrations`, credenciales OAuth cifradas y privadas
- `run_splits` y `activity_routes`, parciales, polyline y perfil de elevación
- `ai_conversations` y `ai_messages`, historial privado de Bolt AI
- `athlete_ai_preferences`, disponibilidad y preferencias de entrenamiento
- `ai_plan_changes`, propuestas pendientes o aplicadas con su auditoría
- `training_plan_versions`, instantáneas versionadas de cada plan confirmado
- `ai_usage_events`, control de uso sin guardar prompts ni secretos en logs
- bucket `profile-images`, con límite de 4 MB y soporte para JPG, PNG y WebP
- constraints, índices y triggers de `updated_at`
- policies RLS de SELECT, INSERT, UPDATE y DELETE para cada propietario

`training_plan_items` representa lo que decía el plan. `workout_logs` representa lo que realmente ocurrió. La relación entre ambas es opcional y nunca sustituye una fuente por la otra.

## Autenticación y athlete onboarding

`/login` contiene únicamente correo y contraseña. `/signup` es un flujo dedicado que solicita datos personales, evento objetivo, credenciales y una foto opcional. Los datos estructurados viajan como metadata de Auth y un trigger validado crea `athlete_profiles` usando el `id` real de `auth.users`; el navegador nunca elige el `user_id`.

Si la confirmación de correo está habilitada, el perfil ya queda creado y completo antes de confirmar. Al iniciar sesión por primera vez, el usuario entra al Dashboard sin repetir onboarding. La foto debe agregarse desde Configuración después de confirmar el correo porque todavía no existe una sesión autenticada para Storage.

`/onboarding` se mantiene como fallback para usuarios históricos o metadata incompleta. Solicita los datos personales y del evento que falten. Cuando Bolt AI está configurado y la cuenta todavía no tiene un plan, el siguiente paso es `/plan/generate`; en cualquier otro caso continúa a `/dashboard`.

## Bolt AI

Bolt AI aparece como un widget flotante dentro de Dashboard, Plan, Entrenamientos, Progreso y Guía. Construye un contexto compacto con perfil, carrera objetivo, próximas sesiones, registros reales, RPE, dolor, fuerza, carga reciente y reglas de la guía. No envía correo, UUID de usuario, credenciales de integraciones ni secretos al proveedor.

El modelo externo está encapsulado en `lib/ai/`. La interfaz nunca muestra el nombre del proveedor o del modelo: para el atleta siempre es **Bolt AI**. Los prompts, esquemas de salida y configuración están centralizados, por lo que el proveedor puede sustituirse sin reescribir la experiencia ni el acceso a datos.

Las herramientas de lectura controlada incluyen `get_athlete_profile`, `get_goal_event`, `get_current_plan`, `get_upcoming_workouts`, `get_recent_workouts`, `get_weekly_volume`, `get_latest_workout`, `get_training_load`, `get_today_workout`, `get_next_long_run`, `get_progress_summary`, `get_strength_history`, `get_workout_detail` y `get_guide`. Las escrituras viven en un registro separado: proponer, aplicar o rechazar cambios, proponer un plan completo y guardar una recomendación. Todas se ejecutan en servidor, vuelven a derivar el usuario desde Auth y no ofrecen SQL al modelo.

Para activarlo en local, crea una API key de servidor en Google AI Studio y agrega a `.env.local`:

```bash
AI_ENABLED=true
GEMINI_API_KEY=your-server-api-key
GEMINI_MODEL=gemini-3.6-flash
GEMINI_PLAN_MODEL=gemini-3.1-flash-lite
GEMINI_PLAN_FALLBACK_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.5-flash
AI_MAX_CHAT_REQUESTS=30
AI_MAX_PLAN_GENERATIONS=4
```

`GEMINI_API_KEY` nunca debe usar el prefijo `NEXT_PUBLIC_`, incluirse en el repositorio o exponerse desde un Client Component. `GEMINI_PLAN_MODEL` y `GEMINI_PLAN_FALLBACK_MODEL` usan modelos rápidos para la salida estructurada extensa del plan; `GEMINI_FALLBACK_MODEL` corresponde al chat. Si `AI_ENABLED` no es exactamente `true` o falta la key, todo Run Dashboard continúa funcionando y la interfaz de Bolt se mantiene oculta.

### Generación y cambios de plan

`/plan/generate` solicita experiencia, días disponibles, día de tirada larga, carga reciente y restricciones. Bolt AI devuelve datos estructurados que se validan nuevamente en el servidor: fechas, disponibilidad, distancias positivas, ausencia de intensidad consecutiva, duplicados y aumentos bruscos de volumen.

El resultado siempre es una propuesta. El atleta ve el plan semanal completo antes de guardarlo; regenerar descarta la propuesta pendiente anterior. Ningún mensaje del chat ni generación modifica `training_plan_items` directamente. Para aplicar se exige `{ "confirmed": true }` y una función transaccional de PostgreSQL vuelve a comprobar propietario y estado, conserva sesiones completadas, crea una nueva versión y registra la confirmación. Si algo falla, la transacción completa se revierte.

El chat puede proponer ajustes con comparación antes/después, motivo y botones **Aplicar cambio** / **No cambiar**. Bolt AI no diagnostica lesiones; ante dolor relevante orienta a detener o reducir y consultar a un profesional de salud.

Los límites predeterminados son 30 solicitudes de chat/análisis por usuario por hora y 4 generaciones completas por 24 horas. Se pueden ajustar con las variables anteriores. La reserva del límite es atómica en PostgreSQL; el usuario puede consultar sus eventos, pero no insertarlos, editarlos ni borrarlos directamente. Los logs operativos contienen solamente request id, tipo de operación, resultado, duración y estimación de tokens.

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

La foto se guarda en Supabase Storage dentro de `profile-images/<auth.uid()>/`. `avatar_url` conserva solamente la ruta del objeto y el servidor genera una URL firmada de una hora al mostrarla. Si no hay imagen, se usan las iniciales del atleta.

El bucket es privado. Las policies solo permiten que cada usuario autenticado lea, suba, reemplace o elimine objetos dentro de su propia carpeta. La acción de servidor valida tamaño, MIME y firma binaria; nunca recibe un `user_id` confiable desde el navegador.

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

## Integración con Strava

Crea una aplicación desde el panel de API de Strava y configura el callback local como:

```text
http://localhost:3000/api/strava/callback
```

Agrega estas variables privadas a `.env.local`:

```bash
STRAVA_CLIENT_ID=your-client-id
STRAVA_CLIENT_SECRET=your-client-secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
INTEGRATION_ENCRYPTION_KEY=replace-with-a-random-key
```

Puedes generar la última variable con `openssl rand -base64 32`. Debe conservar el mismo valor: cambiarla invalida el descifrado de las conexiones existentes. Reinicia `npm run dev`, abre **Configuración → Integraciones** y autoriza Strava.

El OAuth, el intercambio y la renovación de tokens se ejecutan únicamente en el servidor. Los tokens de acceso y renovación se cifran con AES-256-GCM antes de guardarse; la interfaz y los endpoints de actividades nunca los devuelven. Cada importación usa `strava_activity_id` para evitar duplicados y puede enlazarse con una sesión del plan.

`/workouts/new` permite elegir entre captura manual avanzada e importación. El registro manual incluye tipo de carrera, sensaciones, ubicación, desnivel y parciales opcionales. `/workouts/[id]` reúne métricas, splits, mapa OpenStreetMap y gráfica de elevación cuando existen esos datos.

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
npm test
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
- `lib/strava/`: OAuth, renovación de tokens y cliente de la API de Strava, solo servidor.
- `lib/ai/`: proveedor, prompts, contexto, herramientas de lectura, validación, rate limit y flujo seguro de propuestas.
- `components/bolt/`: widget global, accesos contextuales y generador visual del plan.
- `lib/integrations/crypto.ts`: cifrado autenticado de credenciales externas.
- `lib/maps/polyline.ts`: decodificación local de recorridos para Leaflet.
- `lib/strength/`: unidades, filtros y plantillas de fuerza.
- `components/strength/`: selector, constructor, registrador, historial y gráficas.
- `scripts/seedExercises.ts`: seed idempotente del catálogo global.
- `lib/training/`: pace, RPE, esfuerzo y cumplimiento centralizados.
- `scripts/importTrainingPlanFromExcel.ts`: validación e importación local del Excel.

Cada Server Action vuelve a comprobar la sesión. El navegador nunca proporciona un `user_id` confiable y todas las consultas quedan limitadas adicionalmente por RLS.

El cumplimiento excluye descanso. Las sesiones de carrera y fuerza sí son elegibles; únicamente `status = completed` cuenta como completada. Una sesión `modified` todavía queda pendiente hasta completarse.

## Deployment

### 1. Preparar GitHub y Supabase

1. Sube el repositorio a GitHub sin `.env.local`, `.next`, `node_modules`, `supabase/.temp` ni archivos temporales de Office.
2. Vincula el proyecto de Supabase y ejecuta todas las migraciones versionadas:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. Confirma en Supabase que las tablas tienen RLS activo y que `profile-images` existe como bucket privado. No agregues una clave `service_role` a Vercel.

Las migraciones no se ejecutan durante `npm run build` ni al desplegar. Deben aplicarse manualmente antes de probar la versión publicada.

### 2. Configurar Supabase Auth

En **Authentication → URL Configuration** configura:

- **Site URL:** `https://<tu-proyecto>.vercel.app`
- **Redirect URLs:**
  - `http://localhost:3000/**`
  - `https://<tu-proyecto>.vercel.app/**`
  - `https://*-<tu-team-o-usuario>.vercel.app/**` solamente si usarás Vercel Preview.

En **Authentication → Email Templates → Confirm signup**, utiliza un enlace SSR basado en el hash del token:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirmar correo
</a>
```

El alta envía como `RedirectTo` el origen de la petición. Producción utiliza `NEXT_PUBLIC_SITE_URL`; los deployments Preview utilizan su propio origen de Vercel. El endpoint `/auth/confirm` verifica el token, escribe la sesión en cookies y redirige al Dashboard u onboarding.

No uses un wildcard general como `https://**`; limita el patrón Preview al slug de tu cuenta o equipo.

### 3. Importar en Vercel

1. En Vercel selecciona **Add New → Project** e importa el repositorio de GitHub.
2. Framework: **Next.js**.
3. Build command: `npm run build`.
4. Output directory: valor predeterminado de Next.js; no uses `out` ni static export.
5. Node.js: `22.x`, también declarado en `package.json`.

### 4. Variables de entorno de Vercel

Variables públicas necesarias para la aplicación:

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Sí | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Sí | Sí |
| `NEXT_PUBLIC_SITE_URL` | URL canónica | Opcional; se usa el origen Preview | `http://localhost:3000` |

Variables privadas de Strava, si habilitarás la integración:

| Variable | Alcance recomendado |
| --- | --- |
| `STRAVA_CLIENT_ID` | Production y Development |
| `STRAVA_CLIENT_SECRET` | Production y Development |
| `STRAVA_REDIRECT_URI` | URL exacta terminada en `/api/strava/callback` |
| `INTEGRATION_ENCRYPTION_KEY` | Production y Development; valor estable y distinto por entorno |

Variables privadas de Bolt AI:

| Variable | Uso |
| --- | --- |
| `AI_ENABLED` | `true` para mostrar y habilitar Bolt AI |
| `GEMINI_API_KEY` | API key del servidor |
| `GEMINI_MODEL` | Modelo Flash principal para chat |
| `GEMINI_FALLBACK_MODEL` | Modelo Flash alterno para chat |
| `GEMINI_PLAN_MODEL` | Modelo principal para generación estructurada |
| `GEMINI_PLAN_FALLBACK_MODEL` | Modelo alterno para planes |
| `AI_MAX_CHAT_REQUESTS` | Límite por usuario y hora |
| `AI_MAX_PLAN_GENERATIONS` | Límite por usuario cada 24 horas |

`GEMINI_API_KEY`, secretos de Strava e `INTEGRATION_ENCRYPTION_KEY` nunca deben llevar el prefijo `NEXT_PUBLIC_`. `SEED_EMAIL`, `SEED_PASSWORD` y `SEED_USER_ID` son exclusivamente locales y no se agregan a Vercel.

Configura las variables por separado para **Production**, **Preview** y **Development**. Si Preview usa la misma base de datos que Production, sus usuarios y datos también serán reales; para pruebas destructivas utiliza otro proyecto de Supabase.

### 5. Configurar Strava

En la aplicación de Strava permite el dominio de producción y configura:

```text
STRAVA_REDIRECT_URI=https://<tu-proyecto>.vercel.app/api/strava/callback
```

Strava debe aceptar exactamente ese callback. La aplicación funciona en Preview aunque Strava no esté configurado, pero el flujo OAuth de Strava solamente funcionará en los dominios permitidos por la aplicación de Strava.

### 6. Desplegar y verificar

1. Ejecuta localmente `npm run lint`, `npm test` y `npm run build`.
2. Haz push a GitHub y ejecuta el deployment en Vercel.
3. Crea un usuario nuevo y confirma el correo.
4. Prueba login, logout, refresh y acceso directo a una ruta privada.
5. Completa onboarding y verifica Dashboard, Plan, Entrenamientos, Progreso, Configuración y Guía.
6. Sube, reemplaza y elimina un avatar para comprobar Storage privado.
7. Conecta Strava e importa una carrera si habilitaste la integración.
8. Abre Bolt AI, envía un mensaje, genera una vista previa y confirma un cambio de plan.
9. Revisa `PRODUCTION_CHECKLIST.md` antes de considerar terminado el lanzamiento.

No hay dependencias del filesystem en runtime, procesos persistentes, cron local ni estado en memoria como fuente de verdad. Supabase es la fuente de verdad; Bolt AI funciona bajo demanda y sus fallas no impiden usar las demás secciones.
