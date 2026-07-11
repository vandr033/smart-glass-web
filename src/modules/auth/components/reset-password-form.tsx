"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
} from "@/modules/auth/components/auth-shell";
import { type ResetPasswordValues, resetPasswordSchema } from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

const buttonClass =
  "inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const invalidMessage =
    searchParams.get("error") === "INVALID_TOKEN"
      ? "Este enlace de restablecimiento no es válido o venció. Solicite uno nuevo."
      : token
        ? null
        : "A valid reset token is required to set a new password.";

  const form = useForm<ResetPasswordValues>({
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      router.push("/login?reset=1");
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      return;
    }

    await resetMutation.mutateAsync({
      newPassword: values.newPassword,
      token,
    });
  });

  return (
    <AuthShell
      description="Choose a new password for your account once your reset token is validated."
      footer={<AuthLinkRow href="/login" label="¿Volver a su cuenta?" linkLabel="Iniciar sesión" />}
      title="Reset password"
    >
      {invalidMessage ? <AuthBanner tone="info">{invalidMessage}</AuthBanner> : null}
      {resetMutation.error ? (
        <AuthBanner tone="error">{resetMutation.error.message}</AuthBanner>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.newPassword?.message}
          label="Nueva contraseña"
          placeholder="Cree una nueva contraseña"
          type="password"
          {...form.register("newPassword")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          label="Confirm password"
          placeholder="Repeat the new password"
          type="password"
          {...form.register("confirmPassword")}
        />

        <button className={buttonClass} disabled={!token || resetMutation.isPending} type="submit">
          {resetMutation.isPending ? "Updating password..." : "Set new password"}
        </button>
      </form>

      {invalidMessage ? (
        <div className="rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
          Need a new link?{" "}
          <Link className="font-semibold text-stone-950 hover:text-[color:var(--color-primary)]" href="/forgot-password">
            Request another reset email
          </Link>
          .
        </div>
      ) : null}
    </AuthShell>
  );
}
