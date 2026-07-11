import { PageHeader } from "@/components/ui/page-header";

import { ProductForm } from "../components/ProductForm";

export default function CreateProductPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Cree el registro del producto con validaciones, trazabilidad y permisos integrados."
        eyebrow="Crear producto"
        title="Nuevo producto"
      />

      <ProductForm mode="create" />
    </main>
  );
}
