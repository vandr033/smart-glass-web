import { PageHeader } from "@/components/ui/page-header";

import { SupplierForm } from "../components/SupplierForm";

type EditSupplierPageProps = {
  supplierId: string;
};

export default function EditSupplierPage({ supplierId }: EditSupplierPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualiza los datos del proveedor usando el mismo flujo auditado y controlado por permisos."
        eyebrow="Editar proveedor"
        title="Editar proveedor"
      />

      <SupplierForm mode="edit" supplierId={supplierId} />
    </main>
  );
}
