import { PageHeader } from "@/components/ui/page-header";

import { MaterialForm } from "../components/MaterialForm";

type EditMaterialPageProps = {
  materialId: string;
};

export default function EditMaterialPage({ materialId }: EditMaterialPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualiza el material usando el mismo flujo validado y auditado del alta."
        eyebrow="Editar material"
        title="Editar material"
      />

      <MaterialForm mode="edit" materialId={materialId} />
    </main>
  );
}
