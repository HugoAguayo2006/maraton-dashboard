import Image from "next/image";

interface AppLogoProps {
  className?: string;
  priority?: boolean;
}

export function AppLogo({ className = "size-16", priority = false }: AppLogoProps) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-2xl bg-white ${className}`}>
      <Image
        src="/logo_run_dashboard.png"
        alt=""
        fill
        priority={priority}
        sizes="80px"
        className="object-contain"
      />
    </span>
  );
}
