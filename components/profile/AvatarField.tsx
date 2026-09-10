"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { AthleteAvatar } from "@/components/profile/AthleteAvatar";
import { MAX_AVATAR_BYTES } from "@/lib/profile/avatar";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function AvatarField({
  name,
  initialUrl,
  showRemove = false,
}: {
  name: string;
  initialUrl?: string | null;
  showRemove?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  function selectFile(file: File | undefined) {
    setError(null);
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
      setPreviewUrl(initialUrl ?? null);
      setRemove(false);
      setError("Elige una imagen JPG, PNG o WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
      setPreviewUrl(initialUrl ?? null);
      setRemove(false);
      setError("La foto debe pesar menos de 4 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const nextObjectUrl = URL.createObjectURL(file);
    setObjectUrl(nextObjectUrl);
    setPreviewUrl(nextObjectUrl);
    setRemove(false);
  }

  function removePhoto() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setPreviewUrl(null);
    setRemove(true);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-[22px] border border-line bg-surface-subtle p-4">
      <input type="hidden" name="remove_avatar" value={remove ? "true" : "false"} />
      <div className="flex items-center gap-4">
        <AthleteAvatar name={name || "Atleta"} src={previewUrl} className="size-16 text-base shadow-sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Foto de perfil <span className="font-medium text-muted">· opcional</span></p>
          <p className="mt-1 text-[11px] leading-5 text-muted">JPG, PNG o WebP. Máximo 4 MB.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label htmlFor="avatar" className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-ink shadow-sm transition-colors hover:bg-accent-soft hover:text-accent-dark">
              <Camera size={15} /> {previewUrl ? "Cambiar foto" : "Elegir foto"}
            </label>
            {showRemove && previewUrl && (
              <button type="button" onClick={removePhoto} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-danger transition-colors hover:bg-danger-soft">
                <Trash2 size={14} /> Quitar
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        id="avatar"
        name="avatar"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
