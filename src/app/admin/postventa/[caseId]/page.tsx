import { requirePermission } from "@/lib/server-auth";
import PostventaDetailPage from "@/modules/postventa/pages/detail";

type PostventaDetailRoutePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function PostventaDetailRoutePage({
  params,
}: PostventaDetailRoutePageProps) {
  await requirePermission("postventa.ver");

  const { caseId } = await params;

  return <PostventaDetailPage caseId={caseId} />;
}
