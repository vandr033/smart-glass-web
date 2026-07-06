import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { primaryButtonClassName } from "@/modules/commercial/ui";

import { ProjectTable } from "../components/ProjectTable";
import { PROJECTS_ROUTES } from "../constants";

type ProjectsListPageProps = {
  canCreate: boolean;
};

export default function ProjectsListPage({ canCreate }: ProjectsListPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          canCreate ? (
            <Link className={primaryButtonClassName} href={PROJECTS_ROUTES.create}>
              Nuevo proyecto
            </Link>
          ) : null
        }
        description="Da seguimiento a trabajos comerciales desde el ingreso del prospecto hasta mediciones, notas y adjuntos."
        eyebrow="Comercial"
        title="Proyectos"
      />

      <ProjectTable />
    </main>
  );
}
