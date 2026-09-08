import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export default function WorkoutsLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
