import { PageHeader } from "@/components/ui/page-header";

import { MaterialForm } from "../components/MaterialForm";

export default function CreateMaterialPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Crea un nuevo material con reglas de comportamiento, unidades y metadatos de inventario."
        eyebrow="Crear material"
        title="Nuevo material"
      />

      <MaterialForm mode="create" />
    </main>
  );
}
