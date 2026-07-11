"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  PortalActionButton,
  PortalInput,
  PortalNotice,
  PortalPanel,
} from "@/modules/client-portal/portal-components";
import { formatPortalDateTime } from "@/modules/client-portal/ui";
import { clientPortalService } from "@/services/client-portal-service";

const shellClassName =
  "w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/88 p-6 shadow-[0_30px_90px_rgba(68,48,22,0.12)] backdrop-blur sm:p-8";

const footerLinkClassName =
  "font-semibold text-[#302016] transition hover:text-[#0f5bd7]";

const loginSchema = z.object({
  contrasena: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
  correo: z.email("Ingresa un correo valido."),
});

const olvideClaveSchema = z.object({
  correo: z.email("Ingresa un correo valido."),
});

const restablecerSchema = z
  .object({
    confirmarContrasena: z.string().min(8, "Confirma la contrasena."),
    contrasena: z
      .string()
      .min(8, "La contrasena debe tener al menos 8 caracteres."),
  })
  .refine((values) => values.contrasena === values.confirmarContrasena, {
    message: "Las contrasenas deben coincidir.",
    path: ["confirmarContrasena"],
  });

const aceptarInvitacionSchema = z.object({
  contrasena: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
  telefono: z
    .string()
    .max(50, "El telefono debe tener 50 caracteres o menos.")
    .optional()
    .or(z.literal("")),
});

function PortalPublicCard({
  children,
  description,
  footer,
  title,
}: {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
}) {
  return (
    <div className={shellClassName}>
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a5a1f]">
          Acceso seguro
        </p>
        <h2 className="font-[family:var(--font-display)] text-[2.2rem] font-semibold uppercase tracking-[0.04em] text-[#302016]">
          {title}
        </h2>
        <p className="text-sm leading-7 text-[#6f6256]">{description}</p>
      </div>

      <div className="mt-8 space-y-5">{children}</div>

      {footer ? <div className="mt-6 text-sm text-[#6f6256]">{footer}</div> : null}
    </div>
  );
}

export function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      contrasena: "",
      correo: searchParams.get("correo") ?? "",
    },
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: clientPortalService.login,
    onSuccess: () => {
      router.replace("/portal-cliente");
    },
  });

  const statusMessage =
    searchParams.get("invitacion") === "1"
      ? "Tu acceso ya esta activo. Ahora puedes ingresar al Portal del Cliente."
      : searchParams.get("restablecida") === "1"
        ? "Tu contrasena fue actualizada. Inicia sesion con la nueva clave."
        : null;

  const handleSubmit = form.handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
  });

  return (
    <PortalPublicCard
      description="Ingresa con el correo invitado y tu contrasena para revisar cotizaciones, proyectos, instalaciones, documentos y soporte."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className={footerLinkClassName} href="/portal-cliente/olvide-clave">
            Olvide mi contrasena
          </Link>
          <span>
            ¿Recibiste una invitacion?{" "}
            <Link className={footerLinkClassName} href="/portal-cliente/invitacion">
              Activar acceso
            </Link>
          </span>
        </div>
      }
      title="Iniciar sesion"
    >
      {statusMessage ? <PortalNotice tone="exito">{statusMessage}</PortalNotice> : null}
      {loginMutation.error ? (
        <PortalNotice tone="error">{loginMutation.error.message}</PortalNotice>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <PortalInput
          autoComplete="email"
          error={form.formState.errors.correo?.message}
          label="Correo"
          placeholder="cliente@empresa.com"
          type="email"
          {...form.register("correo")}
        />
        <PortalInput
          autoComplete="current-password"
          error={form.formState.errors.contrasena?.message}
          label="Contrasena"
          placeholder="Ingresa tu contrasena"
          type="password"
          {...form.register("contrasena")}
        />

        <PortalActionButton className="w-full" type="submit">
          {loginMutation.isPending ? "Ingresando..." : "Entrar al portal"}
        </PortalActionButton>
      </form>
    </PortalPublicCard>
  );
}

export function PortalForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<z.infer<typeof olvideClaveSchema>>({
    defaultValues: {
      correo: "",
    },
    resolver: zodResolver(olvideClaveSchema),
  });

  const mutation = useMutation({
    mutationFn: clientPortalService.requestPasswordReset,
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.correo);
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  return (
    <PortalPublicCard
      description="Si el correo esta registrado, te enviaremos un enlace seguro para restablecer tu acceso al portal."
      footer={
        <span>
          ¿Recordaste tu contrasena?{" "}
          <Link className={footerLinkClassName} href="/portal-cliente/iniciar-sesion">
            Volver a iniciar sesion
          </Link>
        </span>
      }
      title="Restablecer acceso"
    >
      {submittedEmail ? (
        <PortalNotice tone="exito">
          Si {submittedEmail} pertenece a una cuenta activa, ya enviamos un
          enlace de restablecimiento.
        </PortalNotice>
      ) : null}
      {mutation.error ? <PortalNotice tone="error">{mutation.error.message}</PortalNotice> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <PortalInput
          autoComplete="email"
          error={form.formState.errors.correo?.message}
          label="Correo"
          placeholder="cliente@empresa.com"
          type="email"
          {...form.register("correo")}
        />

        <PortalActionButton className="w-full" type="submit">
          {mutation.isPending ? "Enviando enlace..." : "Enviar enlace de acceso"}
        </PortalActionButton>
      </form>
    </PortalPublicCard>
  );
}

function PortalResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof restablecerSchema>>({
    defaultValues: {
      confirmarContrasena: "",
      contrasena: "",
    },
    resolver: zodResolver(restablecerSchema),
  });

  const mutation = useMutation({
    mutationFn: clientPortalService.resetPassword,
    onSuccess: () => {
      router.replace("/portal-cliente/iniciar-sesion?restablecida=1");
    },
  });

  const invalidMessage = token
    ? null
    : "El enlace de restablecimiento no es valido o ya no esta disponible.";

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      return;
    }

    await mutation.mutateAsync({
      contrasena: values.contrasena,
      token,
    });
  });

  return (
    <PortalPublicCard
      description="Crea una nueva contrasena para volver a ingresar al Portal del Cliente."
      footer={
        <span>
          ¿Necesitas otro enlace?{" "}
          <Link className={footerLinkClassName} href="/portal-cliente/olvide-clave">
            Solicitar nuevamente
          </Link>
        </span>
      }
      title="Nueva contrasena"
    >
      {invalidMessage ? <PortalNotice tone="error">{invalidMessage}</PortalNotice> : null}
      {mutation.error ? <PortalNotice tone="error">{mutation.error.message}</PortalNotice> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <PortalInput
          autoComplete="new-password"
          error={form.formState.errors.contrasena?.message}
          label="Nueva contrasena"
          placeholder="Crea una contrasena segura"
          type="password"
          {...form.register("contrasena")}
        />
        <PortalInput
          autoComplete="new-password"
          error={form.formState.errors.confirmarContrasena?.message}
          label="Confirmar contrasena"
          placeholder="Repite tu nueva contrasena"
          type="password"
          {...form.register("confirmarContrasena")}
        />

        <PortalActionButton className="w-full" type="submit">
          {mutation.isPending ? "Actualizando..." : "Guardar nueva contrasena"}
        </PortalActionButton>
      </form>
    </PortalPublicCard>
  );
}

function PortalInvitationFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const previewQuery = useQuery({
    enabled: Boolean(token),
    queryFn: () => clientPortalService.previewInvitation(token!),
    queryKey: ["portal-cliente", "invitacion", token],
  });

  const form = useForm<z.infer<typeof aceptarInvitacionSchema>>({
    defaultValues: {
      contrasena: "",
      telefono: "",
    },
    resolver: zodResolver(aceptarInvitacionSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof aceptarInvitacionSchema>) =>
      clientPortalService.acceptInvitation(token!, {
        contrasena: values.contrasena,
        telefono: values.telefono?.trim() ? values.telefono : null,
      }),
    onSuccess: () => {
      router.replace("/portal-cliente");
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      return;
    }

    await mutation.mutateAsync(values);
  });

  return (
    <PortalPublicCard
      description="Activa tu acceso para revisar tus proyectos, documentos y seguimiento postventa en un entorno seguro."
      footer={
        <span>
          ¿Ya activaste tu cuenta?{" "}
          <Link className={footerLinkClassName} href="/portal-cliente/iniciar-sesion">
            Iniciar sesion
          </Link>
        </span>
      }
      title="Activar acceso"
    >
      {!token ? (
        <PortalNotice tone="error">
          Falta el token de invitacion. Abre el enlace que recibiste por correo.
        </PortalNotice>
      ) : null}
      {previewQuery.isError ? (
        <PortalNotice tone="error">{previewQuery.error.message}</PortalNotice>
      ) : null}
      {mutation.error ? <PortalNotice tone="error">{mutation.error.message}</PortalNotice> : null}

      {previewQuery.data ? (
        <PortalPanel className="bg-[#fff9f0]" title="Invitacion disponible">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#6f6256]">Cliente</p>
              <p className="mt-1 font-semibold text-[#302016]">
                {previewQuery.data.client.displayName}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6f6256]">Correo invitado</p>
              <p className="mt-1 font-semibold text-[#302016]">{previewQuery.data.email}</p>
            </div>
            <div>
              <p className="text-sm text-[#6f6256]">Nombre</p>
              <p className="mt-1 font-semibold text-[#302016]">{previewQuery.data.name}</p>
            </div>
            <div>
              <p className="text-sm text-[#6f6256]">Vence</p>
              <p className="mt-1 font-semibold text-[#302016]">
                {formatPortalDateTime(previewQuery.data.expiresAt)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-[#6f6256]">Proyectos habilitados</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {previewQuery.data.projectAccesses.map((project) => (
                <span
                  className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#302016]"
                  key={project.id}
                >
                  {project.code} · {project.title}
                </span>
              ))}
            </div>
          </div>
        </PortalPanel>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <PortalInput
          error={form.formState.errors.telefono?.message}
          label="Telefono"
          placeholder="Numero de contacto"
          type="tel"
          {...form.register("telefono")}
        />
        <PortalInput
          autoComplete="new-password"
          error={form.formState.errors.contrasena?.message}
          label="Contrasena"
          placeholder="Crea tu contrasena de acceso"
          type="password"
          {...form.register("contrasena")}
        />

        <PortalActionButton className="w-full" type="submit">
          {mutation.isPending ? "Activando acceso..." : "Activar e ingresar"}
        </PortalActionButton>
      </form>
    </PortalPublicCard>
  );
}

export function PortalResetPasswordForm() {
  return (
    <Suspense>
      <PortalResetPasswordFormInner />
    </Suspense>
  );
}

export function PortalInvitationForm() {
  return (
    <Suspense>
      <PortalInvitationFormInner />
    </Suspense>
  );
}
