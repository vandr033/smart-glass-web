import { z } from "zod";

export const userCreateSchema = z.object({
  email: z.email(),
  isActive: z.boolean(),
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  roleIds: z.array(z.string()).min(1, "Select at least one role."),
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
    confirmPassword: z.string().min(8, "Confirm your new password."),
    currentPassword: z.string().min(8, "Current password must be at least 8 characters."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ProfilePasswordValues = z.infer<typeof profilePasswordSchema>;
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
export type UserCreateValues = z.infer<typeof userCreateSchema>;
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
