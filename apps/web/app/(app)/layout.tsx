import { AppShell } from "@/components/app-shell";
import { LmsShell } from "@/components/lms/shell";
import { IS_LMS } from "@/lib/portal";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return IS_LMS ? <LmsShell>{children}</LmsShell> : <AppShell>{children}</AppShell>;
}
