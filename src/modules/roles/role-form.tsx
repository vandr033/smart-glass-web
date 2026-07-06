"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, ShieldPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { CRITICAL_ADMIN_PERMISSIONS } from "@/lib/permission-catalog";
import {
  roleFormSchema,
  type RoleFormValues,
} from "@/modules/roles/forms";
import { getRoleDescription } from "@/modules/roles/localization";
import { PermissionMatrix } from "@/modules/roles/permission-matrix";
import { roleService } from "@/services/role-service";
import type { RoleDetails } from "@/types";
import { getApiErrorMessage } from "@/utils";

type RoleFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      roleId: string;
    };

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

export function RoleForm(props: RoleFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const editingRoleId = props.mode === "edit" ? props.roleId : null;

  const roleQuery = useQuery({
    enabled: Boolean(editingRoleId),
    queryFn: () => roleService.getRoleById(editingRoleId as string),
    queryKey: editingRoleId ? QUERY_KEYS.roleDetails(editingRoleId) : ["roles", "draft"],
  });

  const form = useForm<RoleFormValues>({
    defaultValues: {
      description: "",
      name: "",
      permissionNames: [],
    },
    resolver: zodResolver(roleFormSchema) as Resolver<RoleFormValues>,
  });

  const watchedPermissionNames = useWatch({
    control: form.control,
    name: "permissionNames",
  });

  useEffect(() => {
    if (props.mode !== "edit" || !roleQuery.data) {
      return;
    }

    form.reset({
      description: getRoleDescription(roleQuery.data.name, roleQuery.data.description),
      name: roleQuery.data.name,
      permissionNames: roleQuery.data.permissions,
    });
  }, [form, props.mode, roleQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      const payload = {
        description: values.description.trim() || null,
        name: values.name.trim(),
        permissionNames: values.permissionNames,
      };

      if (props.mode === "create") {
        return roleService.createRole(payload);
      }

      return roleService.updateRole(props.roleId, payload);
    },
    onSuccess: async (role: RoleDetails) => {
      setSubmitError(null);
      setSubmitMessage(
        props.mode === "create"
          ? "El rol fue creado correctamente."
          : "El rol fue actualizado correctamente.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roles,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.authorization,
        }),
      ]);

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.roleDetails(role.id),
      });

      router.push(`/roles/${role.id}`);
      router.refresh();
    },
    onError: (error) => {
      setSubmitMessage(null);
      setSubmitError(getApiErrorMessage(error));
    },
  });

  if (props.mode === "edit" && roleQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void roleQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={roleQuery.error.message}
        title="No se pudieron cargar los detalles del rol"
      />
    );
  }

  const currentRole = roleQuery.data;
  const isAdminRole = currentRole?.isAdmin ?? false;
  const isBusy = saveMutation.isPending || roleQuery.isLoading;

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
              {props.mode === "create" ? "Crear rol" : "Editar rol"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create"
                ? "Crear definicion de rol"
                : `Actualizar ${currentRole?.name ?? "rol"}`}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Define paquetes de acceso reutilizables y manten las asignaciones de permisos explicitas en todo el espacio administrativo.
            </p>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            href={props.mode === "create" ? "/roles" : `/roles/${props.roleId}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </section>

      <section className={`${sectionClassName} grid gap-6 xl:grid-cols-[0.85fr_1.15fr]`}>
        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Nombre</span>
            <input
              className="w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isBusy || isAdminRole}
              placeholder="Ingresa el nombre del rol"
              {...form.register("name")}
            />
            {isAdminRole ? (
              <span className="text-xs text-stone-500">
                El nombre del rol administrador esta protegido para que el sistema conserve siempre un rol con acceso total.
              </span>
            ) : null}
            {form.formState.errors.name ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Descripcion</span>
            <textarea
              className="min-h-36 w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
              disabled={isBusy}
              placeholder={
                currentRole
                  ? getRoleDescription(currentRole.name, currentRole.description)
                  : "Describe para que debe usarse este rol"
              }
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.description.message}
              </span>
            ) : null}
          </label>
        </div>

        <PermissionMatrix
          disabled={isBusy}
          error={form.formState.errors.permissionNames?.message}
          helperText={
            isAdminRole
              ? "Los permisos criticos del administrador permanecen bloqueados para que la plataforma no pierda su rol de acceso total."
              : undefined
          }
          lockedPermissionNames={isAdminRole ? CRITICAL_ADMIN_PERMISSIONS : []}
          onChange={(permissionNames) => {
            form.setValue("permissionNames", permissionNames, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          permissionNames={watchedPermissionNames ?? []}
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
            <ShieldPlus className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isBusy
            ? props.mode === "create"
              ? "Creando rol..."
              : "Guardando cambios..."
            : props.mode === "create"
              ? "Crear rol"
              : "Guardar cambios"}
        </button>
        <Link
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
          href={props.mode === "create" ? "/roles" : `/roles/${props.roleId}`}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
