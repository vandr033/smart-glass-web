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
          Try again
        </button>
      }
      description="Something went wrong while preparing this admin area. Try the request again or navigate back to the dashboard."
      title="The admin shell hit an unexpected issue"
    />
  );
}
