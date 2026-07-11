import { z } from "zod";

export const invitationCreateSchema = z.object({
  email: z.email("Enter a valid email address."),
  roleId: z.uuid("Seleccione un rol válido."),
});

export const invitationAcceptSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirm your password."),
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type InvitationAcceptValues = z.infer<typeof invitationAcceptSchema>;
export type InvitationCreateValues = z.infer<typeof invitationCreateSchema>;
