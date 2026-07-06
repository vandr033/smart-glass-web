import { requirePermission } from "@/lib/server-auth";
import ProjectsListPage from "@/modules/projects/pages/list";

export default async function AdminProjectsPage() {
  const authorization = await requirePermission("projects.read");

  return (
    <ProjectsListPage
      canCreate={authorization.permissions.includes("projects.create")}
    />
  );
}
