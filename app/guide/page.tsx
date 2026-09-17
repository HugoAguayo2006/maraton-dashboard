import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";
import { GuideTabs } from "@/components/guide/GuideTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { BoltPromptButton } from "@/components/bolt/BoltPromptButton";
import { isBoltConfigured } from "@/lib/ai/config";

export const metadata: Metadata = { title: "Guía" };

export default function GuidePage() {
  const boltEnabled = isBoltConfigured();
  return (
    <>
      <PageHeader
        eyebrow="Referencia del plan"
        title="Guía"
        description="Ritmos, sensaciones y fuerza explicados para tomar mejores decisiones antes de cada sesión."
        action={<div className="hidden items-center gap-2 sm:flex"><span className="grid size-12 place-items-center rounded-2xl bg-white text-accent shadow-sm"><BookOpenText size={22} /></span>{boltEnabled && <BoltPromptButton prompt="Ayúdame a interpretar los ritmos, RPE y reglas de esta guía para mi próxima sesión." contextType="guide" className="flex min-h-12 items-center rounded-2xl bg-ink px-4 text-xs font-bold text-white">Preguntar a Bolt AI</BoltPromptButton>}</div>}
      />
      <GuideTabs boltEnabled={boltEnabled} />
    </>
  );
}
