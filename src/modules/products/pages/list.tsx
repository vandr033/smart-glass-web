import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";

import {
  PRODUCTS_ROUTES,
} from "../constants";
import { ProductTable } from "../components/ProductTable";

type ProductsListPageProps = {
  canCreate: boolean;
};

export default function ProductsListPage({
  canCreate,
}: ProductsListPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          canCreate ? (
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href={PRODUCTS_ROUTES.create}
            >
              Create product
            </Link>
          ) : null
        }
        description="Manage products with the shared DataTable foundation, including search, filters, pagination, and row actions."
        eyebrow="Directory"
        title="Products"
      />

      <ProductTable />
    </main>
  );
}
