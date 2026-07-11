import { requirePermission } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function ProductionPage() {
  await requirePermission("production.read");
  redirect("/production/tablero");
}
