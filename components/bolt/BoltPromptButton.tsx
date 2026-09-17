"use client";

import type { BoltContextType } from "@/lib/ai/types";

export function BoltPromptButton({
  prompt,
  contextType,
  contextRefId,
  children,
  className = "",
}: {
  prompt: string;
  contextType: BoltContextType;
  contextRefId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-bolt-ai", {
        detail: { prompt, contextType, contextRefId: contextRefId ?? null },
      }))}
      className={className}
    >
      {children}
    </button>
  );
}
