"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      action={
        <button
          className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          onClick={() => {
            reset();
          }}
          type="button"
        >
          Intentar nuevamente
        </button>
      }
      description="Ocurrió un problema al preparar esta área administrativa. Intenta nuevamente o vuelve al panel principal."
      title="Ocurrió un problema inesperado"
    />
  );
}
