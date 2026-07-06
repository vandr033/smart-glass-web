import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getServerModules, requireAuth } from "@/lib/server-auth";

export default async function AdminModulePlaceholderPage({
  params,
}: {
  params: Promise<{
    moduleKey: string;
  }>;
}) {
  await requireAuth();
  const { moduleKey } = await params;
  const enabledModules = await getServerModules();
  const moduleItem = enabledModules.find((moduleRecord) => moduleRecord.key === moduleKey);

  if (!moduleItem) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        description={
          moduleItem.description ||
          "Este modulo ya fue registrado en la base del ERP, pero sus flujos de negocio se dejaron intencionalmente para una fase posterior."
        }
        eyebrow="Modulo pendiente"
        title={moduleItem.label}
      />

      <EmptyState
        description="La navegacion, los permisos y el registro del modulo ya estan listos. La implementacion funcional de esta area todavia no ha comenzado."
        title={`${moduleItem.label} aun no esta implementado`}
      />
    </main>
  );
}
