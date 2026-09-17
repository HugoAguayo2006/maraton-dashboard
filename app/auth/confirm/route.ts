import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeRelativePath } from "@/lib/authUrl";
import { createClient } from "@/lib/supabase/server";

const emailOtpTypeSchema = z.enum([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = emailOtpTypeSchema.safeParse(url.searchParams.get("type"));
  const nextPath = getSafeRelativePath(url.searchParams.get("next"), "/dashboard");

  if (!tokenHash || !type.success) {
    return NextResponse.redirect(new URL("/login?confirmation=invalid", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type.data as EmailOtpType,
  });

  return NextResponse.redirect(
    new URL(error ? "/login?confirmation=invalid" : nextPath, request.url),
  );
}
