import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/server-auth";

export default async function LegacySettingsPage() {
  await requireAuth();
  redirect("/admin/settings");
}
