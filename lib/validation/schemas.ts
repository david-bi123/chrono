import { z } from "zod";

export const emailSchema = z.string().email("Enter a valid email").max(254);
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** IANA timezone name. An invalid value saved here breaks every
 *  timezone-dependent endpoint for the whole organization, so reject it. */
export const timezoneSchema = z
  .string()
  .min(1, "Timezone is required")
  .max(80)
  .refine(isValidTimeZone, "Unknown timezone");

function isParseableDate(s: string) {
  return s.length > 0 && !Number.isNaN(Date.parse(s));
}

export const createOrgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  industry: z.string().trim().max(100).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "SUSPENDED"]).default("ACTIVE"),
  adminFirstName: z.string().trim().min(1).max(80),
  adminLastName: z.string().trim().min(1).max(80),
  adminEmail: emailSchema,
});

export const inviteStaffSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: emailSchema,
  employeeId: z.string().trim().min(1).max(40),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  position: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export const setupAccountSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(40).optional(),
});

export const attendanceSettingsSchema = z.object({
  timezone: timezoneSchema.default("Africa/Accra"),
  workStart: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  graceMinutes: z.coerce.number().int().min(0).max(120),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  requireClockOut: z.boolean(),
});

export const orgSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  industry: z.string().trim().max(100).optional().or(z.literal("")),
  timezone: timezoneSchema,
});

export const correctionSchema = z.object({
  clockIn: z
    .string()
    .min(1, "Clock-in is required")
    .refine(isParseableDate, "Clock-in is not a valid date"),
  clockOut: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((s) => !s || isParseableDate(s), "Clock-out is not a valid date"),
  reason: z.string().trim().min(5, "Provide a reason (min 5 chars)").max(500),
});
