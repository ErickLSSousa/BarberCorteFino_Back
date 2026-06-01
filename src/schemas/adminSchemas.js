const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

const barberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  active: z.boolean().optional(),
});

const serviceSchema = z.object({
  name: z.enum(["corte", "barba", "sobrancelha", "tintura"]),
  price_cents: z.number().int().min(0).max(1000000),
  active: z.boolean().optional(),
});

module.exports = {
  barberSchema,
  loginSchema,
  serviceSchema,
};

