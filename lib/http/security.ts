import "server-only";

export function isTrustedJsonMutation(request: Request): boolean {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === getRequestOrigin(request);
  } catch {
    return false;
  }
}

function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestUrl = new URL(request.url);
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}
