import { PageHeader } from "@/components/ui/page-header";

import { SupplierForm } from "../components/SupplierForm";

export default function CreateSupplierPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Crea un proveedor con contactos reutilizables, categorias y puntajes base listos para futuras compras."
        eyebrow="Crear proveedor"
        title="Nuevo proveedor"
      />

      <SupplierForm mode="create" />
    </main>
  );
}
