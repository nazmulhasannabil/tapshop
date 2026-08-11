import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "Tell us your name.").max(100, "That's a bit long."),
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(8, "At least 8 characters.").max(128),
});
export type RegisterValues = z.infer<typeof registerSchema>;
