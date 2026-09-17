import "server-only";

import { headers } from "next/headers";

export async function getAuthRedirectOrigin(): Promise<string | undefined> {
  const configuredUrl = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const vercelUrl = normalizeOrigin(process.env.VERCEL_URL);
  const headerStore = await headers();
  const requestOrigin = normalizeOrigin(headerStore.get("origin"));

  if (process.env.VERCEL_ENV === "production" && configuredUrl) {
    return configuredUrl;
  }

  return requestOrigin ?? vercelUrl ?? configuredUrl;
}

export function getSafeRelativePath(value: string | null, fallback: string): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}

function normalizeOrigin(value: string | null | undefined): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}
