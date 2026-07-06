import { requirePermission } from "@/lib/server-auth";
import EditClientPage from "@/modules/clients/pages/edit";

type EditClientRoutePageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function EditClientRoutePage({
  params,
}: EditClientRoutePageProps) {
  await requirePermission("clients.update");

  const { clientId } = await params;

  return <EditClientPage clientId={clientId} />;
}
