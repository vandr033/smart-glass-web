import { requirePermission } from "@/lib/server-auth";
import CreateClientPage from "@/modules/clients/pages/create";

export default async function NewClientRoutePage() {
  await requirePermission("clients.create");

  return <CreateClientPage />;
}
