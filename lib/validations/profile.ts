import * as z from "zod";

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot be longer than 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers and underscore"
    ),
  display_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot be longer than 50 characters"),
});

export const completeProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot be longer than 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers and underscore"
    ),
  display_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot be longer than 50 characters"),
  avatar_seed: z.string(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.string().refine((val) => val === "delete my account", {
    message: 'Please type "delete my account" to confirm',
  }),
});
