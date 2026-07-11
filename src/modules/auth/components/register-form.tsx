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
      description="Cree una cuenta con correo y contraseña. Enviaremos un enlace de verificación antes de permitir el acceso."
      footer={<AuthLinkRow href="/login" label="¿Ya tiene una cuenta?" linkLabel="Iniciar sesión" />}
      title="Cree su cuenta"
    >
      {submittedEmail ? (
        <AuthBanner tone="success">
          Enviamos la verificación a {submittedEmail}. Abra el correo para activar su cuenta.
        </AuthBanner>
      ) : null}
      {registerMutation.error ? (
        <AuthBanner tone="error">{registerMutation.error.message}</AuthBanner>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="name"
          error={form.formState.errors.name?.message}
          label="Nombre completo"
          placeholder="Administrador del sistema"
          type="text"
          {...form.register("name")}
        />
        <AuthInput
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Correo electrónico"
          placeholder="you@company.com"
          type="email"
          {...form.register("email")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          label="Contraseña"
          placeholder="Cree una contraseña segura"
          type="password"
          {...form.register("password")}
        />

        <button className={buttonClass} disabled={registerMutation.isPending} type="submit">
          {registerMutation.isPending ? "Creando cuenta…" : "Registrarse"}
        </button>
      </form>
    </AuthShell>
  );
}
