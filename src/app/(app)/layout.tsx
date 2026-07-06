import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  buildAdminNavigationItems,
  buildAuthorizationSummary,
} from "@/lib/admin-navigation";
import { getServerCurrentUser, requireAuth } from "@/lib/server-auth";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();
  const currentUser = await getServerCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <AdminShell
      authorization={buildAuthorizationSummary(currentUser)}
      navigationItems={buildAdminNavigationItems(currentUser)}
      session={session}
    >
      {children}
    </AdminShell>
  );
}
