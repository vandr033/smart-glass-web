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
        description="Update products details using the same schema contract and RBAC safeguards as the create flow."
        eyebrow="Edit Product"
        title="Edit Product"
      />

      <ProductForm mode="edit" productId={productId} />
    </main>
  );
}
