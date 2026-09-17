# Production Checklist — Run Dashboard

Marca cada punto en el entorno que vas a publicar. No copies valores secretos a este archivo.

## Repositorio y Vercel

- [ ] Repositorio actualizado en GitHub.
- [ ] `.env.local`, `.next`, `node_modules`, `supabase/.temp` y archivos temporales no están versionados.
- [ ] Proyecto importado en Vercel como Next.js.
- [ ] Build command configurado como `npm run build`.
- [ ] Output directory predeterminado de Next.js.
- [ ] Node.js `22.x` seleccionado o reconocido desde `package.json`.
- [ ] Production deployment completado sin errores.
- [ ] Preview deployment comprobado.

## Variables de entorno

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada.
- [ ] `NEXT_PUBLIC_SITE_URL` configurada con la URL canónica de producción.
- [ ] Las variables `NEXT_PUBLIC_*` no contienen secretos.
- [ ] `STRAVA_CLIENT_ID` configurada si se usará Strava.
- [ ] `STRAVA_CLIENT_SECRET` configurada si se usará Strava.
- [ ] `STRAVA_REDIRECT_URI` coincide exactamente con el callback publicado.
- [ ] `INTEGRATION_ENCRYPTION_KEY` es estable, secreta y tiene al menos 24 caracteres.
- [ ] `AI_ENABLED=true` si Bolt AI estará habilitado.
- [ ] `GEMINI_API_KEY` configurada como variable privada.
- [ ] `GEMINI_MODEL` y `GEMINI_FALLBACK_MODEL` configurados con modelos disponibles.
- [ ] `GEMINI_PLAN_MODEL` y `GEMINI_PLAN_FALLBACK_MODEL` configurados.
- [ ] `AI_MAX_CHAT_REQUESTS` y `AI_MAX_PLAN_GENERATIONS` revisados.
- [ ] `SEED_EMAIL`, `SEED_PASSWORD` y `SEED_USER_ID` no están en Vercel.

## Supabase

- [ ] Todas las migraciones de `supabase/migrations/` fueron aplicadas en orden.
- [ ] RLS está habilitado en todas las tablas personales.
- [ ] Policies verificadas para perfil, plan, entrenamientos, fuerza, integraciones y Bolt AI.
- [ ] El bucket `profile-images` existe y es privado.
- [ ] Las policies de Storage restringen cada avatar a `auth.uid()`.
- [ ] Subir, reemplazar y eliminar avatar funciona.
- [ ] No existe una clave `service_role` en el frontend ni en Vercel.

## Supabase Auth

- [ ] Email/Password habilitado.
- [ ] Site URL apunta a la URL oficial de producción.
- [ ] `http://localhost:3000/**` está permitido para desarrollo.
- [ ] La URL exacta de producción está permitida.
- [ ] El wildcard Preview está limitado al slug del equipo o usuario de Vercel.
- [ ] La plantilla Confirm signup usa `{{ .RedirectTo }}/auth/confirm` con `TokenHash`.
- [ ] Signup y confirmación de correo funcionan.
- [ ] Login funciona.
- [ ] Logout funciona.
- [ ] Refresh conserva la sesión.
- [ ] Usuario no autenticado es redirigido a `/login`.
- [ ] Perfil incompleto es redirigido a `/onboarding`.
- [ ] Perfil completo llega a `/dashboard` sin loops.

## Strava

- [ ] Authorization Callback Domain configurado en Strava.
- [ ] OAuth state validado correctamente.
- [ ] Conectar y desconectar funcionan.
- [ ] Renovación de token funciona.
- [ ] Importación evita duplicados.
- [ ] RPE, dolor, fatiga y sueño se guardan al importar.

## Bolt AI

- [ ] API key válida y privada.
- [ ] Modelo principal disponible.
- [ ] Modelo fallback disponible y distinto cuando sea posible.
- [ ] Chat responde.
- [ ] Historial pertenece a la cuenta autenticada.
- [ ] Generación de vista previa funciona.
- [ ] Aplicar cambio exige confirmación explícita.
- [ ] Rate limit de mensajes funciona y muestra su reinicio.
- [ ] Rate limit de planes funciona y muestra su reinicio.
- [ ] Una API key inválida muestra el fallback amigable sin romper la aplicación.

## Funcionalidad

- [ ] Onboarding.
- [ ] Dashboard.
- [ ] Plan.
- [ ] Workouts.
- [ ] Registro manual.
- [ ] Importación Strava.
- [ ] Fuerza.
- [ ] Progress.
- [ ] Settings.
- [ ] Guide.
- [ ] Bolt AI.
- [ ] Mobile.
- [ ] Tablet.
- [ ] Desktop.

## Verificación técnica

- [ ] `npm run lint`.
- [ ] `npm test`.
- [ ] `npm run build`.
- [ ] `npm start` con el build de producción.
- [ ] Headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy` presentes.
- [ ] No hay secretos, stack traces ni errores internos en respuestas al navegador.
- [ ] No hay datos de un usuario visibles desde otra cuenta de prueba.
