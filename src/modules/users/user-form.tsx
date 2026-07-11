"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateValues,
  type UserUpdateValues,
} from "@/modules/users/forms";
import { userService } from "@/services/user-service";
import type { UserDetails } from "@/types";
import { getApiErrorMessage } from "@/utils";

type UserFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      userId: string;
    };

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

function RoleSelector({
  disabled = false,
  error,
  onChange,
  roleIds,
  roles,
}: {
  disabled?: boolean;
  error?: string;
  onChange: (roleIds: string[]) => void;
  roleIds: string[];
  roles: Array<{
    description?: string | null;
    id: string;
    name: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-stone-700">Asignación de roles</p>
        <p className="text-xs text-stone-500">
          Select the roles this user should inherit across the admin workspace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => {
          const checked = roleIds.includes(role.id);

          return (
            <label
              key={role.id}
              className="flex items-start gap-3 rounded-md border border-stone-200/90 bg-white/80 px-4 py-4 transition hover:border-stone-300"
            >
              <input
                checked={checked}
                className="mt-1 h-4 w-4 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                disabled={disabled}
                onChange={(event) => {
                  const nextValues = event.target.checked
                    ? [...roleIds, role.id]
                    : roleIds.filter((value) => value !== role.id);

                  onChange(nextValues);
                }}
                type="checkbox"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-stone-900">
                  {role.name}
                </span>
                <span className="block text-xs leading-5 text-stone-500">
                  {role.description || "No additional description available."}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

export function UserForm(props: UserFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const editingUserId = props.mode === "edit" ? props.userId : null;

  const rolesQuery = useQuery({
    queryFn: userService.getRoleOptions,
    queryKey: QUERY_KEYS.roleOptions,
    staleTime: 60_000,
  });

  const userQuery = useQuery({
    enabled: Boolean(editingUserId),
    queryFn: () => userService.getUserById(editingUserId as string),
    queryKey: editingUserId ? QUERY_KEYS.userDetails(editingUserId) : ["users", "draft"],
  });

  const initialValues = useMemo(
    () => ({
      email: "",
      isActive: true,
      name: "",
      password: "",
      roleIds: [] as string[],
    }),
    [],
  );

  const resolver: Resolver<UserCreateValues> =
    props.mode === "create"
      ? zodResolver(userCreateSchema)
      : (zodResolver(userUpdateSchema) as unknown as Resolver<UserCreateValues>);

  const form = useForm<UserCreateValues>({
    defaultValues: initialValues,
    resolver,
  });

  const watchedRoleIds = useWatch({
    control: form.control,
    name: "roleIds",
  });

  useEffect(() => {
    if (props.mode !== "edit" || !userQuery.data) {
      return;
    }

    form.reset({
      email: userQuery.data.email,
      isActive: userQuery.data.isActive,
      name: userQuery.data.name,
      password: "",
      roleIds: userQuery.data.roleIds,
    });
  }, [form, props.mode, userQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: UserCreateValues) => {
      if (props.mode === "create") {
        return userService.createUser(values);
      }

      const { password: _password, ...payload } = values;
      void _password;
      return userService.updateUser(props.userId, payload as UserUpdateValues);
    },
    onSuccess: async (user: UserDetails) => {
      setSubmitError(null);
      setSubmitMessage(
        props.mode === "create"
          ? "User account created successfully."
          : "User account updated successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roleOptions,
        }),
      ]);

      router.push(`/users/${user.id}`);
      router.refresh();
    },
    onError: (error) => {
      setSubmitMessage(null);
      setSubmitError(getApiErrorMessage(error));
    },
  });

  if (rolesQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void rolesQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={rolesQuery.error.message}
        title="No se pudieron cargar los roles"
      />
    );
  }

  if (props.mode === "edit" && userQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void userQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={userQuery.error.message}
        title="No se pudo cargar el detalle del usuario"
      />
    );
  }

  const isBusy = saveMutation.isPending || rolesQuery.isLoading || userQuery.isLoading;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await saveMutation.mutateAsync(values);
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              {props.mode === "create" ? "Crear usuario" : "Editar usuario"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create"
                ? "Add a user account"
                : `Update ${userQuery.data?.name ?? "user account"}`}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Keep the workflow consistent across modules with the same field structure,
              validation rules, and permission-aware actions.
            </p>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            href={props.mode === "create" ? "/users" : `/users/${props.userId}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </section>

      <section className={`${sectionClassName} grid gap-6 xl:grid-cols-[1.1fr_0.9fr]`}>
        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Name</span>
            <input
              className="w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
              disabled={isBusy}
              placeholder="Ingrese el nombre completo del usuario"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Correo electrónico</span>
            <input
              className="w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
              disabled={isBusy}
              placeholder="name@example.com"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.email.message}
              </span>
            ) : null}
          </label>

          {props.mode === "create" ? (
            <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Contraseña</span>
              <input
                className="w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                disabled={isBusy}
              placeholder="Cree una contraseña segura"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <span className="text-sm text-rose-700">
                  {form.formState.errors.password.message}
                </span>
              ) : null}
            </label>
          ) : null}

          <label className="flex items-start gap-3 rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
            <input
              className="mt-1 h-4 w-4 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
              disabled={isBusy}
              type="checkbox"
              {...form.register("isActive")}
            />
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-stone-900">
                Cuenta activa
              </span>
              <span className="block text-xs leading-5 text-stone-500">
                Los usuarios inactivos permanecen en el sistema, pero pierden acceso hasta reactivarse.
              </span>
            </span>
          </label>
        </div>

        <RoleSelector
          disabled={isBusy}
          error={form.formState.errors.roleIds?.message}
          onChange={(roleIds) => {
            form.setValue("roleIds", roleIds, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          roleIds={watchedRoleIds ?? []}
          roles={rolesQuery.data ?? []}
        />
      </section>

      {submitError ? (
        <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {props.mode === "create" ? (
            <UserPlus className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isBusy
            ? props.mode === "create"
              ? "Creating user..."
              : "Saving changes..."
            : props.mode === "create"
              ? "Crear usuario"
              : "Guardar cambios"}
        </button>
        <Link
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
          href={props.mode === "create" ? "/users" : `/users/${props.userId}`}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
