import { requirePermission } from "@/lib/server-auth";
import CreateProjectPage from "@/modules/projects/pages/create";

export default async function NewProjectRoutePage() {
  await requirePermission("projects.create");

  return <CreateProjectPage />;
}
