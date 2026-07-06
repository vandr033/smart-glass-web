import { requirePermission } from "@/lib/server-auth";
import ClientViewPage from "@/modules/clients/pages/view";

type ClientRoutePageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function ClientRoutePage({ params }: ClientRoutePageProps) {
  await requirePermission("clients.read");

  const { clientId } = await params;

  return <ClientViewPage clientId={clientId} />;
}
