import { requirePermission } from "@/lib/server-auth";
import EditProjectPage from "@/modules/projects/pages/edit";

type EditProjectRoutePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function EditProjectRoutePage({
  params,
}: EditProjectRoutePageProps) {
  await requirePermission("projects.update");

  const { projectId } = await params;

  return <EditProjectPage projectId={projectId} />;
}
