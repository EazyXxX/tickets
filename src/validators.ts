import { z } from "zod";

// User schemas
const userRoleEnum = z.enum(["USER", "ADMIN"]);

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: userRoleEnum.optional().default("USER"),
});

const signupInputSchema = userSchema.pick({
  email: true,
  password: true,
  name: true,
});
const signinInputSchema = userSchema.pick({ email: true, password: true });

// Ticket schemas
const ticketStatusEnum = z.enum([
  "NEW",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

const ticketSchema = z.object({
  subject: z.string().min(1),
  content: z.string().min(1),
  status: ticketStatusEnum.optional().default("NEW"),
  resolution: z.string().optional(),
  cancelReason: z.string().optional(),
});

const createTicketInputSchema = ticketSchema.pick({
  subject: true,
  content: true,
});
const updateTicketInputSchema = ticketSchema
  .pick({ resolution: true, cancelReason: true })
  .partial();

// Validation functions
export function validateSignupInput(data: unknown): any {
  return signupInputSchema.parse(data);
}

export function validateSigninInput(data: unknown): any {
  return signinInputSchema.parse(data);
}

export function validateCreateTicketInput(data: unknown): any {
  return createTicketInputSchema.parse(data);
}

export function validateUpdateTicketInput(data: unknown): any {
  return updateTicketInputSchema.parse(data);
}

export function validateTicketStatus(status: unknown): any {
  return ticketStatusEnum.parse(status);
}
