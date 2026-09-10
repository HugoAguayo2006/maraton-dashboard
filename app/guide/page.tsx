import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";
import { GuideTabs } from "@/components/guide/GuideTabs";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Guía" };

export default function GuidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Referencia del plan"
        title="Guía"
        description="Ritmos, sensaciones y fuerza explicados para tomar mejores decisiones antes de cada sesión."
        action={<span className="hidden size-12 place-items-center rounded-2xl bg-white text-accent shadow-sm sm:grid"><BookOpenText size={22} /></span>}
      />
      <GuideTabs />
    </>
  );
}
