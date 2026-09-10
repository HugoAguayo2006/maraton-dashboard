import { getSupabaseConfig } from "@/lib/supabase/config";

export const PROFILE_IMAGE_BUCKET = "profile-images";
export const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function getAvatarPublicUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const { url } = getSupabaseConfig();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${PROFILE_IMAGE_BUCKET}/${encodedPath}`;
}
