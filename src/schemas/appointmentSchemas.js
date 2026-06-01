const { z } = require("zod");

const appointmentSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_phone: z.string().trim().min(8).max(30),
  customer_email: z.string().trim().email().max(254),
  barber_id: z.string().uuid(),
  service_ids: z.array(z.string().uuid()).min(1).max(4),
  starts_at: z.string().trim(),
});

const availabilityQuerySchema = z.object({
  barber_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service_ids: z
    .string()
    .min(1)
    .transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(1).max(4)),
});

module.exports = {
  appointmentSchema,
  availabilityQuerySchema,
};
