import { z } from "zod";

export const WeeklyChallengeSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z.string()
    .max(400, "Description cannot exceed 400 characters")
    .optional(),
  tiktok_link: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  week: z.number()
    .min(1, "Week must be greater than 0")
    .max(53, "Week cannot be greater than 53"),
  year: z.number()
    .min(2024, "Year must be 2024 or later"),
});

export const ChallengeSubmissionSchema = z.object({
  id: z.string().uuid().optional(),
  challenge_id: z.string().uuid(),
  user_id: z.string().uuid(),
  social_link: z.string().url().optional(),
  comment: z.string().optional(),
  contact_method: z.string(),
  is_winner: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type WeeklyChallengeInput = z.infer<typeof WeeklyChallengeSchema>;
export type ChallengeSubmission = z.infer<typeof ChallengeSubmissionSchema>;
