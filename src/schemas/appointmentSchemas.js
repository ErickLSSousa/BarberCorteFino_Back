const { z } = require("zod");

const clientSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido (ex: 11987654321)"),
  email: z.string().email("Email inválido").optional(),
});

const appointmentSchema = z.object({
  client: clientSchema,
  barber_id: z.string().uuid("ID do barbeiro inválido"),
  service_ids: z.array(z.string().uuid()).min(1, "Selecione pelo menos um serviço"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:mm)"),
  notes: z.string().max(200).optional(),
}).strict();



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
  clientSchema, 
};
