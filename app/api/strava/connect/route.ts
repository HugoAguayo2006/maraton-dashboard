import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStravaConfig } from "@/lib/strava/config";

const STATE_COOKIE = "marathon_strava_oauth_state";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/settings/integrations", request.url));

  try {
    const config = getStravaConfig();
    const state = randomBytes(32).toString("base64url");
    const authorizeUrl = new URL("https://www.strava.com/oauth/authorize");
    authorizeUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      approval_prompt: "auto",
      scope: "read,activity:read_all",
      state,
    }).toString();

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/api/strava",
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings/integrations?error=configuration", request.url));
  }
}

