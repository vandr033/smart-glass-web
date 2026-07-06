import { PageHeader } from "@/components/ui/page-header";

import { ProjectForm } from "../components/ProjectForm";

export default function CreateProjectPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Abre un nuevo proyecto y define cliente, tipo de trabajo, ubicacion, fechas y responsables antes de ejecutar."
        eyebrow="Crear proyecto"
        title="Nuevo proyecto"
      />

      <ProjectForm mode="create" />
    </main>
  );
}
