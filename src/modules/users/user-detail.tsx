"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Pencil, Power, ShieldCheck, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

import { useState } from "react";

type UserDetailProps = {
  userId: string;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function UserDetail({ userId }: UserDetailProps) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<"delete" | "disable" | "enable" | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const userQuery = useQuery({
    queryFn: () => userService.getUserById(userId),
    queryKey: QUERY_KEYS.userDetails(userId),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (userQuery.data?.isActive) {
        return userService.disableUser(userId);
      }

      return userService.enableUser(userId);
    },
    onSuccess: async () => {
      setActionError(null);
      setPendingAction(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userDetails(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users,
        }),
      ]);
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => userService.deleteUser(userId),
    onSuccess: async () => {
      setActionError(null);
      setPendingAction(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.users,
      });
      window.location.assign("/users");
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error));
    },
  });

  if (userQuery.isError) {
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
        title="This user record could not be loaded"
      />
    );
  }

  const user = userQuery.data;

  if (!user) {
    return (
      <section className="rounded-lg border border-stone-300/70 bg-white/90 p-6 text-sm text-stone-600 shadow-[0_18px_44px_rgba(15,47,91,0.06)]">
        Loading user details...
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-primary)] text-lg font-semibold text-blue-100">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={user.name}
                  className="h-full w-full object-cover"
                  src={user.avatar}
                />
              ) : (
                user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join("")
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  User Record
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                  {user.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    user.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    user.emailVerified
                      ? "bg-blue-100 text-blue-900"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {user.emailVerified ? "Email verified" : "Email unverified"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href="/users"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to users
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-primary-hover)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href={`/users/${user.id}/edit`}
            >
              <Pencil className="h-4 w-4" />
              Edit user
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Access Overview
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {user.roles.map((role) => (
              <div
                key={role.id}
                className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-[1rem] bg-[var(--color-primary)] p-2 text-blue-100">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-stone-950">{role.name}</p>
                    <p className="text-xs leading-5 text-stone-500">
                      {role.description || "No description available."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Record Metadata
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Last login
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(user.lastLoginAt)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Created at
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Updated at
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(user.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              onClick={() => {
                setPendingAction(user.isActive ? "disable" : "enable");
              }}
              type="button"
            >
              <Power className="h-4 w-4" />
              {user.isActive ? "Disable user" : "Enable user"}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-error)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
              onClick={() => {
                setPendingAction("delete");
              }}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Delete user
            </button>
          </div>

          {actionError ? (
            <div className="mt-4 rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
        </section>
      </section>

      <ConfirmDialog
        confirmLabel={
          pendingAction === "delete"
            ? "Delete user"
            : pendingAction === "disable"
              ? "Disable user"
              : "Enable user"
        }
        description={
          pendingAction === "delete"
            ? `Soft-delete ${user.name} from active records. Their audit trail remains intact.`
            : pendingAction === "disable"
              ? `${user.name} will lose active access until re-enabled.`
              : `${user.name} will regain active access immediately.`
        }
        isLoading={deleteMutation.isPending || deactivateMutation.isPending}
        onConfirm={() => {
          if (pendingAction === "delete") {
            deleteMutation.mutate();
            return;
          }

          deactivateMutation.mutate();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        open={Boolean(pendingAction)}
        title={
          pendingAction === "delete"
            ? "Delete this user?"
            : pendingAction === "disable"
              ? "Disable this user?"
              : "Enable this user?"
        }
        tone={pendingAction === "delete" ? "danger" : "default"}
      />
    </div>
  );
}
