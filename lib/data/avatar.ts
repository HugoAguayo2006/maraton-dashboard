import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DataAccessError } from "@/lib/data/errors";
import {
  AVATAR_MIME_TYPES,
  MAX_AVATAR_BYTES,
  PROFILE_IMAGE_BUCKET,
} from "@/lib/profile/avatar";
import type { Database } from "@/types/database";

const extensionByMimeType: Record<(typeof AVATAR_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getOptionalAvatarFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

export function validateAvatarFile(file: File | null): void {
  if (!file) return;

  if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
    throw new DataAccessError("Elige una imagen JPG, PNG o WebP.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new DataAccessError("La foto debe pesar menos de 4 MB.");
  }
}

export async function validateAvatarFileContents(file: File | null): Promise<void> {
  if (!file) return;

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = file.type === "image/jpeg"
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff;
  const isPng = file.type === "image/png"
    && matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isWebp = file.type === "image/webp"
    && matches(bytes, [0x52, 0x49, 0x46, 0x46])
    && matches(bytes, [0x57, 0x45, 0x42, 0x50], 8);

  if (!isJpeg && !isPng && !isWebp) {
    throw new DataAccessError("El contenido del archivo no coincide con una imagen JPG, PNG o WebP válida.");
  }
}

export async function replaceAvatarForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File | null,
  remove: boolean,
): Promise<string | null> {
  validateAvatarFile(file);
  await validateAvatarFileContents(file);

  const { data: profile, error: profileError } = await supabase
    .from("athlete_profiles")
    .select("avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new DataAccessError("Guarda primero tu perfil antes de agregar una foto.");
  }

  const previousPath = profile.avatar_url;

  if (!file) {
    if (!remove) return previousPath;

    const { error: updateError } = await supabase
      .from("athlete_profiles")
      .update({ avatar_url: null })
      .eq("user_id", userId);

    if (updateError) throw new DataAccessError("No pudimos quitar la foto de perfil.");
    await removeOwnedAvatar(supabase, userId, previousPath);
    return null;
  }

  const extension = extensionByMimeType[file.type as keyof typeof extensionByMimeType];
  const nextPath = `${userId}/avatar-${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(nextPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new DataAccessError("No pudimos subir la foto. Intenta nuevamente.");

  const { error: updateError } = await supabase
    .from("athlete_profiles")
    .update({ avatar_url: nextPath })
    .eq("user_id", userId);

  if (updateError) {
    await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([nextPath]);
    throw new DataAccessError("La foto subió, pero no pudimos guardarla en tu perfil.");
  }

  await removeOwnedAvatar(supabase, userId, previousPath);
  return nextPath;
}

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

async function removeOwnedAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: string | null,
) {
  if (!path || !path.startsWith(`${userId}/`)) return;
  await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([path]);
}
