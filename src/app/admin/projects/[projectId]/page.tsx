import { requirePermission } from "@/lib/server-auth";
import ProjectViewPage from "@/modules/projects/pages/view";

type ProjectRoutePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectRoutePage({ params }: ProjectRoutePageProps) {
  await requirePermission("projects.read");

  const { projectId } = await params;

  return <ProjectViewPage projectId={projectId} />;
}
