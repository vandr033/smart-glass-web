"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, KeyRound, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  profilePasswordSchema,
  profileUpdateSchema,
  type ProfilePasswordValues,
  type ProfileUpdateValues,
} from "@/modules/users/forms";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

const panelClassName =
  "rounded-lg border border-[color:var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-muted)_100%)] p-6 shadow-[0_20px_50px_rgba(30,64,175,0.08)]";
const secondaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";
const fieldClassName =
  "w-full rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-text)] outline-none transition focus:border-[color:var(--color-primary)] focus:bg-white";
const detailCardClassName =
  "rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-4";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryFn: userService.getProfile,
    queryKey: QUERY_KEYS.profile,
  });

  const profileForm = useForm<ProfileUpdateValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(profileUpdateSchema),
  });

  const passwordForm = useForm<ProfilePasswordValues>({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(profilePasswordSchema),
  });

  const refreshShell = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile,
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authSession,
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.authorization,
      }),
    ]);

    router.refresh();
  };

  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: async (profile) => {
      profileForm.reset({
        name: profile.name,
      });
      setProfileError(null);
      setProfileMessage("Detalles de perfil actualizados correctamente.");
      await refreshShell();
    },
    onError: (error) => {
      setProfileMessage(null);
      setProfileError(getApiErrorMessage(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      passwordForm.reset();
      setPasswordError(null);
      setPasswordMessage("Contraseña actualizada correctamente.");
    },
    onError: (error) => {
      setPasswordMessage(null);
      setPasswordError(getApiErrorMessage(error));
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: async () => {
      setProfileError(null);
      setProfileMessage("Avatar actualizado.");
      await refreshShell();
    },
    onError: (error) => {
      setProfileMessage(null);
      setProfileError(getApiErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!profileQuery.data || profileForm.formState.isDirty) {
      return;
    }

    profileForm.reset({
      name: profileQuery.data.name,
    });
  }, [profileForm, profileForm.formState.isDirty, profileQuery.data]);

  if (profileQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void profileQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={profileQuery.error.message}
        title="Tu perfil no pudo ser cargado"
      />
    );
  }

  const profile = profileQuery.data;

  if (!profile) {
    return (
      <section className={panelClassName}>
        <p className="text-sm text-[color:var(--color-text-muted)]">Cargando perfil…</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${panelClassName} grid gap-6 xl:grid-cols-[0.75fr_1.25fr]`}>
        <div className="space-y-4">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-hover))] text-2xl font-semibold text-[color:var(--color-primary-contrast)] shadow-[0_18px_36px_rgba(30,64,175,0.2)]">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={profile.name}
                className="h-full w-full object-cover"
                src={profile.avatar}
              />
            ) : (
              profile.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")
            )}
          </div>

          <label className={`${secondaryButtonClassName} cursor-pointer`}>
            <Camera className="h-4 w-4" />
            {uploadAvatarMutation.isPending ? "Subiendo..." : "Cambiar avatar"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploadAvatarMutation.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                uploadAvatarMutation.mutate(file);
                event.target.value = "";
              }}
              type="file"
            />
          </label>

          <div className={`${detailCardClassName} text-sm text-[color:var(--color-text-muted)]`}>
              Subir un avatar en WEBP, PNG o JPEG. Tamaño máximo de archivo: 2 MB. Se recomienda un tamaño de 256x256 píxeles.
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Perfil
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">
              {profile.name}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
              Maneja la informacion mostrada en el shell compartido, superficies de sesion y modulos futuros.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={detailCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Email
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--color-text)]">{profile.email}</p>
            </div>
            <div className={detailCardClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Ultimo inicio de sesion
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--color-text)]">
                {formatDate(profile.lastLoginAt)}
              </p>
            </div>
          </div>

          <div className={detailCardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              Roles
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary-soft-text)]"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${panelClassName} grid gap-6 xl:grid-cols-2`}>
        <form
          className="space-y-4"
          onSubmit={profileForm.handleSubmit(async (values) => {
            await updateProfileMutation.mutateAsync(values);
          })}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Actualizar Perfil
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--color-text)]">
              Detalles de la cuenta 
            </h3>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--color-text)]">Nombre</span>
            <input
              className={fieldClassName}
              disabled={updateProfileMutation.isPending}
              {...profileForm.register("name")}
            />
            {profileForm.formState.errors.name ? (
              <span className="text-sm text-rose-700">
                {profileForm.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          {profileError ? (
            <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {profileError}
            </div>
          ) : null}

          {profileMessage ? (
            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {profileMessage}
            </div>
          ) : null}

          <button
            className={primaryButtonClassName}
            disabled={updateProfileMutation.isPending}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {updateProfileMutation.isPending ? "Actualizando perfil..." : "Actualizar perfil"}
          </button>
        </form>

        <form
          className="space-y-4"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            await changePasswordMutation.mutateAsync({
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            });
          })}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Cambiar Contraseña
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--color-text)]">
              Credenciales
            </h3>
          </div>

          {[
            {
              field: "currentPassword",
              label: "Contraseña actual",
            },
            {
              field: "newPassword",
              label: "Contraseña nueva",
            },
            {
              field: "confirmPassword",
              label: "Confirmar Contraseña",
            },
          ].map((field) => (
            <label key={field.field} className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--color-text)]">{field.label}</span>
              <input
                className={fieldClassName}
                disabled={changePasswordMutation.isPending}
                type="password"
                {...passwordForm.register(
                  field.field as "currentPassword" | "newPassword" | "confirmPassword",
                )}
              />
              {passwordForm.formState.errors[
                field.field as "currentPassword" | "newPassword" | "confirmPassword"
              ] ? (
                <span className="text-sm text-rose-700">
                  {
                    passwordForm.formState.errors[
                      field.field as "currentPassword" | "newPassword" | "confirmPassword"
                    ]?.message
                  }
                </span>
              ) : null}
            </label>
          ))}

          {passwordError ? (
            <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {passwordError}
            </div>
          ) : null}

          {passwordMessage ? (
            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {passwordMessage}
            </div>
          ) : null}

          <button
            className={primaryButtonClassName}
            disabled={changePasswordMutation.isPending}
            type="submit"
          >
            <KeyRound className="h-4 w-4" />
            {changePasswordMutation.isPending ? "Actualizando contraseña..." : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}
