"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRing, Send } from "lucide-react";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { QUERY_KEYS } from "@/lib/constants";
import {
  notificationComposerSchema,
  notificationTypeOptions,
  type NotificationComposerValues,
} from "@/modules/notifications/forms";
import { notificationService } from "@/services/notification-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

const panelClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

export function NotificationComposer() {
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const recipientsQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: QUERY_KEYS.userOptions,
    staleTime: 60_000,
  });

  const form = useForm<NotificationComposerValues>({
    defaultValues: {
      message: "",
      title: "",
      type: "info",
      userId: "",
    },
    resolver: zodResolver(notificationComposerSchema),
  });

  const createMutation = useMutation({
    mutationFn: notificationService.createNotification,
    onSuccess: async () => {
      form.reset({
        message: "",
        title: "",
        type: "info",
        userId: "",
      });
      setSubmitError(null);
      setSubmitMessage("Notification created.");
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
    onError: (error) => {
      setSubmitMessage(null);
      setSubmitError(getApiErrorMessage(error));
    },
  });

  if (recipientsQuery.isError) {
    return (
      <ErrorState
        description="The notification composer needs recipient options before it can send a message."
        title="Unable to load notification recipients"
      />
    );
  }

  const recipients = recipientsQuery.data ?? [];

  return (
    <section className={panelClassName}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-stone-200/80 bg-white/85 text-stone-700 shadow-[0_12px_30px_rgba(15,47,91,0.08)]">
          <BellRing className="h-5 w-5" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            Create notification
          </h2>
          <p className="text-sm leading-7 text-stone-700">
            Send a reusable in-app notification now. This API is the same foundation
            future email, SMS, and WhatsApp channels can build on.
          </p>
        </div>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          await createMutation.mutateAsync(values);
        })}
      >
        <div className="grid gap-5">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-800">Recipient</span>
            <select
              className="h-12 w-full rounded-md border border-stone-300/80 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-blue-200"
              {...form.register("userId")}
              disabled={createMutation.isPending || recipientsQuery.isLoading}
            >
              <option value="">Select a user</option>
              {recipients.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {form.formState.errors.userId ? (
              <p className="text-sm text-rose-600">{form.formState.errors.userId.message}</p>
            ) : null}
          </label>

          <div className="grid gap-5 md:grid-cols-[1fr_12rem]">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-800">Title</span>
              <input
                className="h-12 w-full rounded-md border border-stone-300/80 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-blue-200"
                placeholder="Role changed"
                {...form.register("title")}
                disabled={createMutation.isPending}
                type="text"
              />
              {form.formState.errors.title ? (
                <p className="text-sm text-rose-600">{form.formState.errors.title.message}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-stone-800">Type</span>
              <select
                className="h-12 w-full rounded-md border border-stone-300/80 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-blue-200"
                {...form.register("type")}
                disabled={createMutation.isPending}
              >
                {notificationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.type ? (
                <p className="text-sm text-rose-600">{form.formState.errors.type.message}</p>
              ) : null}
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-800">Message</span>
            <textarea
              className="min-h-36 w-full rounded-lg border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-blue-200"
              placeholder="Describe what happened and what the user should know next."
              {...form.register("message")}
              disabled={createMutation.isPending}
            />
            {form.formState.errors.message ? (
              <p className="text-sm text-rose-600">
                {form.formState.errors.message.message}
              </p>
            ) : null}
          </label>
        </div>

        {submitMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {submitMessage}
          </p>
        ) : null}

        {submitError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {submitError}
          </p>
        ) : null}

        <button
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={createMutation.isPending || recipients.length === 0}
          type="submit"
        >
          <Send className="h-4 w-4" />
          {createMutation.isPending ? "Sending..." : "Create notification"}
        </button>
      </form>
    </section>
  );
}
