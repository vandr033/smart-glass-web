import { z } from "zod";

export const notificationTypeOptions = [
  {
    label: "Info",
    value: "info",
  },
  {
    label: "Éxito",
    value: "success",
  },
  {
    label: "Advertencia",
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
    .min(1, "El mensaje es obligatorio.")
    .max(10_000, "El mensaje es demasiado largo."),
  title: z.string().trim().min(1, "El título es obligatorio.").max(191, "El título es demasiado largo."),
  type: z.enum(["info", "success", "warning", "error"]),
  userId: z.string().uuid("Seleccione un destinatario."),
});

export type NotificationComposerValues = z.infer<typeof notificationComposerSchema>;
