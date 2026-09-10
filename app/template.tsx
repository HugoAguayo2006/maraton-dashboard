import { ViewTransition, type ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="route-enter" exit="route-exit" default="none">
      {children}
    </ViewTransition>
  );
}
