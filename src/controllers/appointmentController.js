// src/controllers/appointmentController.js
const { appointmentSchema } = require('../schemas/appointmentSchema');
const { getAvailability } = require('../services/availabilityService');
const { supabase } = require('../config/supabase');

async function createAppointment(req, res) {
  try {
    const validated = appointmentSchema.parse(req.body);

    // Upsert Cliente
    let { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({
        name: validated.client.name,
        phone: validated.client.phone,
        email: validated.client.email,
      }, { onConflict: 'phone' })
      .select()
      .single();

    if (clientError) throw clientError;

    // Calcular duração total
    const { data: services } = await supabase
      .from('services')
      .select('duration_minutes')
      .in('id', validated.service_ids);

    const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);

    // Criar agendamento
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .insert({
        client_id: client.id,
        customer_email: validated.client.email,
        barber_id: validated.barber_id,
        service_ids: validated.service_ids,
        date: validated.date,
        time: validated.time,
        duration_minutes: totalDuration,
        status: 'confirmed',
        notes: validated.notes,
      })
      .select()
      .single();

    if (appError) throw appError;

    res.status(201).json({ success: true, appointment, client });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
}

module.exports = { createAppointment /*, outras funções */ };