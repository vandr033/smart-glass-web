"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailPlus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  invitationCreateSchema,
  type InvitationCreateValues,
} from "@/modules/invitations/forms";
import { invitationService } from "@/services/invitation-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

const inputClassName =
  "w-full rounded-md border border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white";

export function InvitationForm() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const rolesQuery = useQuery({
    queryFn: userService.getRoleOptions,
    queryKey: QUERY_KEYS.roleOptions,
    staleTime: 60_000,
  });

  const form = useForm<InvitationCreateValues>({
    defaultValues: {
      email: "",
      roleId: "",
    },
    resolver: zodResolver(invitationCreateSchema),
  });

  const createMutation = useMutation({
    mutationFn: invitationService.createInvitation,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.invitations,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roleOptions,
        }),
      ]);

      router.push("/invitations");
      router.refresh();
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

  const isBusy = createMutation.isPending || rolesQuery.isLoading;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await createMutation.mutateAsync(values);
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Create Invitation
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Invite a teammate
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              New invitations expire automatically after seven days, generate a
              fresh secure token, and send the onboarding email immediately.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href="/invitations"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to invitations
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              type="submit"
            >
              {createMutation.isPending ? (
                <Send className="h-4 w-4" />
              ) : (
                <MailPlus className="h-4 w-4" />
              )}
              {createMutation.isPending ? "Sending invitation..." : "Send invitation"}
            </button>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700" htmlFor="email">
                Invitee email
              </label>
              <input
                className={inputClassName}
                id="email"
                placeholder="teammate@company.com"
                type="email"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-rose-700">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700" htmlFor="roleId">
                Assigned role
              </label>
              <select
                className={inputClassName}
                id="roleId"
                {...form.register("roleId")}
              >
                <option value="">Seleccione un rol</option>
                {(rolesQuery.data ?? []).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.roleId ? (
                <p className="text-sm text-rose-700">
                  {form.formState.errors.roleId.message}
                </p>
              ) : null}
            </div>

            {createMutation.error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
                {getApiErrorMessage(createMutation.error)}
              </div>
            ) : null}
          </div>

          <aside className="rounded-lg border border-stone-200/90 bg-white/75 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Workflow
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
              <p>1. Choose the email address and role.</p>
              <p>2. The backend creates a secure token and seven-day expiry.</p>
              <p>3. The invitee receives an email and completes setup from the link.</p>
            </div>
          </aside>
        </div>
      </section>
    </form>
  );
}
