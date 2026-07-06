import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/server-auth";

export default async function LegacyRolesPage() {
  await requireAuth();
  redirect("/admin/roles");
}
