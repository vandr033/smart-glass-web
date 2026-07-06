"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
} from "@/modules/auth/components/auth-shell";
import {
  type ForgotPasswordValues,
  forgotPasswordSchema,
} from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

const buttonClass =
  "inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync(values);
  });

  return (
    <AuthShell
      description="We’ll send a secure reset link if the address exists in the system."
      footer={<AuthLinkRow href="/login" label="Remembered your password?" linkLabel="Back to sign in" />}
      title="Forgot your password?"
    >
      {submittedEmail ? (
        <AuthBanner tone="success">
          If {submittedEmail} exists in the system, a reset link has been sent.
        </AuthBanner>
      ) : null}
      {forgotPasswordMutation.error ? (
        <AuthBanner tone="error">{forgotPasswordMutation.error.message}</AuthBanner>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Email"
          placeholder="you@company.com"
          type="email"
          {...form.register("email")}
        />

        <button
          className={buttonClass}
          disabled={forgotPasswordMutation.isPending}
          type="submit"
        >
          {forgotPasswordMutation.isPending ? "Sending link..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
