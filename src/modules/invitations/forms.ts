import { z } from "zod";

export const invitationCreateSchema = z.object({
    email: z.email("Ingresa un correo electrónico válido."),
  roleId: z.uuid("Seleccione un rol válido."),
});

export const invitationAcceptSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirma tu contraseña."),
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type InvitationAcceptValues = z.infer<typeof invitationAcceptSchema>;
export type InvitationCreateValues = z.infer<typeof invitationCreateSchema>;
