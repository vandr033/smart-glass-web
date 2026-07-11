import type { ReactNode } from "react";

import { requirePortalAuth } from "@/lib/client-portal-server-auth";
import { PortalShell } from "@/modules/client-portal/portal-shell";

export default async function PortalClientePrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePortalAuth();

  return <PortalShell session={session}>{children}</PortalShell>;
}
