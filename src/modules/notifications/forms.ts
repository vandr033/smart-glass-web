import { z } from "zod";

export const notificationTypeOptions = [
  {
    label: "Info",
    value: "info",
  },
  {
    label: "Success",
    value: "success",
  },
  {
    label: "Warning",
    value: "warning",
  },
  {
    label: "Error",
    value: "error",
  },
] as const;

export const notificationComposerSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(10_000, "Message is too long."),
  title: z.string().trim().min(1, "Title is required.").max(191, "Title is too long."),
  type: z.enum(["info", "success", "warning", "error"]),
  userId: z.string().uuid("Select a recipient."),
});

export type NotificationComposerValues = z.infer<typeof notificationComposerSchema>;
