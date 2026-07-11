"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { QUERY_KEYS } from "@/lib/constants";
import {
  AuthBanner,
  AuthInput,
  AuthLinkRow,
  AuthShell,
} from "@/modules/auth/components/auth-shell";
import {
  invitationAcceptSchema,
  type InvitationAcceptValues,
} from "@/modules/invitations/forms";
import { invitationService } from "@/services/invitation-service";

const buttonClass =
  "inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

const summaryCardClassName =
  "rounded-md border border-stone-200 bg-stone-50/85 px-4 py-3";

export function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const previewQuery = useQuery({
    enabled: Boolean(token),
    queryFn: () => invitationService.previewInvitation(token as string),
    queryKey: token
      ? QUERY_KEYS.invitationPreview(token)
      : ["invitations", "preview", "missing-token"],
    retry: false,
  });

  const form = useForm<InvitationAcceptValues>({
    defaultValues: {
      confirmPassword: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(invitationAcceptSchema),
  });

  const acceptMutation = useMutation({
    mutationFn: async (values: InvitationAcceptValues) => {
      if (!token) {
        throw new Error("Se necesita un token de invitación válido.");
      }

      return invitationService.acceptInvitation({
        name: values.name,
        password: values.password,
        token,
      });
    },
    onSuccess: (acceptedInvitation) => {
      const nextSearchParams = new URLSearchParams({
        email: acceptedInvitation.email,
        invited: "1",
      });

      router.push(`/login?${nextSearchParams.toString()}`);
    },
  });

  const invalidMessage = token
    ? null
    : "Se necesita un token de invitación válido para terminar de configurar tu cuenta.";

  const handleSubmit = form.handleSubmit(async (values) => {
    await acceptMutation.mutateAsync(values);
  });

  return (
    <AuthShell
      description="Confirma tu identidad, define tu contraseña y activa la cuenta asociada a este correo electrónico."
      footer={<AuthLinkRow href="/login" label="¿Ya tienes una cuenta?" linkLabel="Iniciar sesión" />}
      title="Aceptar invitación"
    >
      {invalidMessage ? <AuthBanner tone="info">{invalidMessage}</AuthBanner> : null}
      {previewQuery.error ? (
        <AuthBanner tone="error">{previewQuery.error.message}</AuthBanner>
      ) : null}
      {acceptMutation.error ? (
        <AuthBanner tone="error">{acceptMutation.error.message}</AuthBanner>
      ) : null}

      {previewQuery.data ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Correo electrónico
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {previewQuery.data.email}
            </p>
          </div>
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Rol
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {previewQuery.data.roleName}
            </p>
          </div>
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Invitado por
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {previewQuery.data.invitedByName}
            </p>
          </div>
          <div className={summaryCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Vence
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {new Date(previewQuery.data.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          autoComplete="name"
          error={form.formState.errors.name?.message}
          label="Nombre completo"
          placeholder="Tu nombre"
          type="text"
          {...form.register("name")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          label="Contraseña"
          placeholder="Cree una contraseña"
          type="password"
          {...form.register("password")}
        />
        <AuthInput
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          label="Confirmar contraseña"
          placeholder="Repite la contraseña"
          type="password"
          {...form.register("confirmPassword")}
        />

        <button
          className={buttonClass}
          disabled={!previewQuery.data || acceptMutation.isPending || previewQuery.isLoading}
          type="submit"
        >
          {acceptMutation.isPending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      {previewQuery.isLoading ? (
        <div className="rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
          Validando tu invitación…
        </div>
      ) : null}

      {(invalidMessage || previewQuery.error) ? (
        <div className="rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
          ¿Necesitas ayuda? Vuelve a{" "}
          <Link className="font-semibold text-stone-950 hover:text-[color:var(--color-primary)]" href="/login">
            la página de inicio de sesión
          </Link>
          .
        </div>
      ) : null}
    </AuthShell>
  );
}
