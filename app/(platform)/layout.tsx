import { AppShell } from "@/components/layout/app-shell";
import { getShellRole } from "@/lib/admin-data";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userRole = await getShellRole();

  return <AppShell userRole={userRole}>{children}</AppShell>;
}
