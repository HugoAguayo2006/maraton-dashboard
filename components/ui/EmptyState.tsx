import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className = "",
}: EmptyStateProps) {
  return (
    <section className={`app-card grid min-h-52 place-items-center p-6 text-center ${className}`}>
      <div className="max-w-sm">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-surface-subtle text-muted">
          <Icon size={20} />
        </span>
        <h2 className="mt-4 text-base font-bold">{title}</h2>
        <p className="mt-1.5 text-xs leading-5 text-muted">{description}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-ink px-4 text-xs font-bold text-white">
            {actionLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
