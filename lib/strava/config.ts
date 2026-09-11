import "server-only";

export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function isStravaConfigured(): boolean {
  return Boolean(
    process.env.STRAVA_CLIENT_ID
      && process.env.STRAVA_CLIENT_SECRET
      && process.env.STRAVA_REDIRECT_URI
      && process.env.INTEGRATION_ENCRYPTION_KEY,
  );
}

export function getStravaConfig(): StravaConfig {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri || !process.env.INTEGRATION_ENCRYPTION_KEY) {
    throw new Error("La integración con Strava todavía no está configurada en el servidor.");
  }

  return { clientId, clientSecret, redirectUri };
}
