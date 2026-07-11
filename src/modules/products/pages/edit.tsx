import { PageHeader } from "@/components/ui/page-header";

import { ProductForm } from "../components/ProductForm";

type EditProductPageProps = {
  productId: string;
};

export default function EditProductPage({
  productId,
}: EditProductPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualice los datos del producto con las mismas validaciones y salvaguardas de permisos del alta."
        eyebrow="Editar producto"
        title="Editar producto"
      />

      <ProductForm mode="edit" productId={productId} />
    </main>
  );
}
