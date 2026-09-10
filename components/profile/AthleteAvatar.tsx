import type { CSSProperties } from "react";

export function AthleteAvatar({
  name,
  src,
  className = "size-12",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "A";
  const style: CSSProperties | undefined = src
    ? { backgroundImage: `url("${src}")` }
    : undefined;

  return (
    <span
      role="img"
      aria-label={src ? `Foto de ${name}` : `Iniciales de ${name}`}
      style={style}
      className={`grid shrink-0 place-items-center rounded-full bg-ink bg-cover bg-center font-bold text-white ${className}`}
    >
      {!src && initials}
    </span>
  );
}
