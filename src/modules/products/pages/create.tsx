import { PageHeader } from "@/components/ui/page-header";

import { ProductForm } from "../components/ProductForm";

export default function CreateProductPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Create a product record with shared validation, logging, and permission-aware workflows."
        eyebrow="Create Product"
        title="New Product"
      />

      <ProductForm mode="create" />
    </main>
  );
}
