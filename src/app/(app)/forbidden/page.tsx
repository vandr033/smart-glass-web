"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";

export default function ForbiddenPage() {
  const searchParams = useSearchParams();
  const missingPermission = searchParams.get("missing");

  return (
    <ErrorState
      action={
        <Link
          className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
          href="/admin"
        >
          Volver al panel principal
        </Link>
      }
      description={
        missingPermission
          ? `No tienes permiso para ver esta página. Permiso faltante: ${missingPermission}.`
          : "No tienes permiso para ver esta página. Tu cuenta está autenticada, pero esta ruta está fuera de los accesos asignados."
      }
      title="SIN ACCESO"
    />
  );
}
