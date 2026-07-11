import { z } from "zod";

export const userCreateSchema = z.object({
  email: z.email(),
  isActive: z.boolean(),
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  roleIds: z.array(z.string()).min(1, "Seleccione al menos un rol."),
});

export const userUpdateSchema = userCreateSchema.omit({
  password: true,
}).extend({
  password: z.string().default(""),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
});

export const profilePasswordSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirme su nueva contraseña."),
    currentPassword: z.string().min(8, "La contraseña actual debe tener al menos 8 caracteres."),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type ProfilePasswordValues = z.infer<typeof profilePasswordSchema>;
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
export type UserCreateValues = z.infer<typeof userCreateSchema>;
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
