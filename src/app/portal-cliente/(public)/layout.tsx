import type { ReactNode } from "react";

import { ClientPortalPublicLayout } from "@/layouts/client-portal-public-layout";
import { requirePortalGuest } from "@/lib/client-portal-server-auth";

export default async function PortalClientePublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePortalGuest();

  return <ClientPortalPublicLayout>{children}</ClientPortalPublicLayout>;
}
