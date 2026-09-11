import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { exchangeStravaCode, saveStravaConnection } from "@/lib/strava/client";

const STATE_COOKIE = "marathon_strava_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/settings/integrations", request.url));

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const state = url.searchParams.get("state");
  cookieStore.delete({ name: STATE_COOKIE, path: "/api/strava" });

  if (!expectedState || !state || !statesMatch(expectedState, state)) {
    return NextResponse.redirect(new URL("/settings/integrations?error=state", request.url));
  }
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/settings/integrations?error=denied", request.url));
  }

  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/settings/integrations?error=missing_code", request.url));

  try {
    const tokens = await exchangeStravaCode(code);
    const scopes = (url.searchParams.get("scope") ?? tokens.scope ?? "")
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);
    if (!scopes.includes("activity:read") && !scopes.includes("activity:read_all")) {
      return NextResponse.redirect(new URL("/settings/integrations?error=scope", request.url));
    }
    await saveStravaConnection(tokens, scopes);
    return NextResponse.redirect(new URL("/settings/integrations?connected=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/settings/integrations?error=exchange", request.url));
  }
}

function statesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

