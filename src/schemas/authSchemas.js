const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

const clientRegisterSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
});

module.exports = {
  clientRegisterSchema,
  loginSchema,
};
