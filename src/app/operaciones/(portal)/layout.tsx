import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { hasAnyPermission } from "@/lib/permissions";
import { getServerAuthorization, getServerCurrentUser, getServerSession } from "@/lib/server-auth";
import { OperationalPortalShell } from "@/modules/operational-portal/portal-shell";
import { PORTAL_ACCESS_PERMISSIONS } from "@/modules/operational-portal/constants";

export default async function OperationalLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session?.session) redirect("/operaciones/iniciar-sesion");
  const authorization = await getServerAuthorization();
  if (!authorization) redirect("/operaciones/iniciar-sesion");
  if (!hasAnyPermission(authorization.permissions, [...PORTAL_ACCESS_PERMISSIONS])) redirect("/operaciones/sin-acceso");
  const currentUser = await getServerCurrentUser();
  if (!currentUser) redirect("/operaciones/iniciar-sesion");

  return <OperationalPortalShell permissions={authorization.permissions} user={currentUser.user}>{children}</OperationalPortalShell>;
}

