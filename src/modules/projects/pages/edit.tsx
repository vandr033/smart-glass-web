import { PageHeader } from "@/components/ui/page-header";

import { ProjectForm } from "../components/ProjectForm";

type EditProjectPageProps = {
  projectId: string;
};

export default function EditProjectPage({ projectId }: EditProjectPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualiza el proyecto manteniendo intacto su flujo de estados y trazabilidad."
        eyebrow="Editar proyecto"
        title="Editar proyecto"
      />

      <ProjectForm mode="edit" projectId={projectId} />
    </main>
  );
}
