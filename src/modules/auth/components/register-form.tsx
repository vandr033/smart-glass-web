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
import { type RegisterValues, registerSchema } from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

const buttonClass =
  "inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export function RegisterForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
      form.reset({
        email: variables.email,
        name: variables.name,
        password: "",
      });
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
  });

  return (
    <AuthShell
      description="Create an email and password account. We’ll send a verification link before sign-in is allowed."
      footer={<AuthLinkRow href="/login" label="Already have an account?" linkLabel="Sign in" />}
      title="Create your account"
    >
      {submittedEmail ? (
        <AuthBanner tone="success">
          Verification sent to {submittedEmail}. Open the email to activate your account.
        </AuthBanner>
      ) : null}
      {registerMutation.error ? (
        <AuthBanner tone="error">{registerMutation.error.message}</AuthBanner>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="name"
          error={form.formState.errors.name?.message}
          label="Full name"
          placeholder="System Administrator"
          type="text"
          {...form.register("name")}
        />
        <AuthInput
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Email"
          placeholder="you@company.com"
          type="email"
          {...form.register("email")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          label="Password"
          placeholder="Create a strong password"
          type="password"
          {...form.register("password")}
        />

        <button className={buttonClass} disabled={registerMutation.isPending} type="submit">
          {registerMutation.isPending ? "Creating account..." : "Register"}
        </button>
      </form>
    </AuthShell>
  );
}
