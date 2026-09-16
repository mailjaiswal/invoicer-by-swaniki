import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppSplash } from "@/components/layout/app-splash";
import { InstallPrompt } from "@/components/layout/install-prompt";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
      <InstallPrompt />
      <AppSplash />
    </AppShell>
  );
}