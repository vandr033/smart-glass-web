"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { QUERY_KEYS } from "@/lib/constants";
import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
} from "@/modules/auth/components/auth-shell";
import { type LoginValues, loginSchema } from "@/modules/auth/forms";
import { authService } from "@/services/auth-service";

const buttonClass =
  "inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export function LoginForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const invitedEmail = searchParams.get("email");

  const form = useForm<LoginValues>({
    defaultValues: {
      email: invitedEmail ?? "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!invitedEmail) {
      return;
    }

    form.setValue("email", invitedEmail, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form, invitedEmail]);

  const statusMessage =
    searchParams.get("verified") === "1"
      ? "Your email is verified. You can sign in now."
      : searchParams.get("registered") === "1"
        ? "Account created. Check your inbox to verify your email."
        : searchParams.get("invited") === "1"
          ? "Invitación aceptada. Inicie sesión con la contraseña que acaba de crear."
        : searchParams.get("reset") === "1"
          ? "Contraseña actualizada. Inicie sesión con su nueva contraseña."
          : null;

  const verificationError =
    searchParams.get("error") === "TOKEN_EXPIRED"
      ? "El enlace de verificación venció. Solicite uno nuevo a continuación."
      : searchParams.get("error") === "INVALID_TOKEN"
      ? "El enlace de verificación no es válido. Solicite uno nuevo a continuación."
        : null;

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authSession,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authorization,
      });
      router.push("/admin");
    },
  });

  const resendMutation = useMutation({
    mutationFn: authService.resendVerificationEmail,
    onSuccess: () => {
      setResendError(null);
      setResendMessage("A fresh verification email is on its way.");
    },
    onError: (error) => {
      setResendMessage(null);
      setResendError(error.message);
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setResendError(null);
    setResendMessage(null);
    await loginMutation.mutateAsync(values);
  });

  const handleResend = async () => {
    const email = form.getValues("email");

    if (!email) {
      form.setError("email", {
        message: "Enter your email first so we know where to send it.",
      });
      return;
    }

    await resendMutation.mutateAsync(email);
  };

  return (
    <AuthShell
      description="Inicie sesión con su correo y contraseña. La verificación y la sesión se gestionan de forma segura."
      footer={<AuthLinkRow href="/register" label="Need an account?" linkLabel="Register" />}
      title="Welcome back"
    >
      {statusMessage ? <AuthBanner tone="success">{statusMessage}</AuthBanner> : null}
      {verificationError ? <AuthBanner tone="info">{verificationError}</AuthBanner> : null}
      {loginMutation.error ? (
        <AuthBanner tone="error">{loginMutation.error.message}</AuthBanner>
      ) : null}
      {resendMessage ? <AuthBanner tone="success">{resendMessage}</AuthBanner> : null}
      {resendError ? <AuthBanner tone="error">{resendError}</AuthBanner> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Correo electrónico"
          placeholder="you@company.com"
          type="email"
          {...form.register("email")}
        />
        <AuthInput
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          label="Contraseña"
          placeholder="Enter your password"
          type="password"
          revealable
          {...form.register("password")}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <button
            className="font-medium text-stone-700 transition hover:text-stone-950"
            onClick={handleResend}
            type="button"
          >
            Resend verification email
          </button>
          <Link className="font-medium text-stone-700 transition hover:text-stone-950" href="/forgot-password">
            ¿Olvidó su contraseña?
          </Link>
        </div>

        <button className={buttonClass} disabled={loginMutation.isPending} type="submit">
          {loginMutation.isPending ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>
    </AuthShell>
  );
}
