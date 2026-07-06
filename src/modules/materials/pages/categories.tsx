import { PageHeader } from "@/components/ui/page-header";

import { MaterialCategoriesManager } from "../components/MaterialCategoriesManager";

export default function MaterialCategoriesPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Mantiene el arbol de categorias que organiza el catalogo maestro de materiales."
        eyebrow="Configuracion"
        title="Categorias de materiales"
      />

      <MaterialCategoriesManager />
    </main>
  );
}
