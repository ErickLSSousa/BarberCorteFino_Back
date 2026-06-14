const env = require("../config/env");
const supabase = require("../config/supabase");
const HttpError = require("../utils/httpError");
const { addMinutes, assertInsideBusinessHours, parseLocalDateTime, toIso } = require("../utils/time");
const {
  assertActiveBarber,
  buildAppointmentPayload,
  getActiveServicesByIds,
  hasConflict,
} = require("../services/scheduleService");
const { getAvailability } = require("../services/availabilityService");
const { appointmentSchema, availabilityQuerySchema, clientSchema } = require("../schemas/appointmentSchemas");


async function publicServices(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) throw new HttpError(500, "Falha ao listar servicos.");

    return res.json({ services: data || [] });
  } catch (error) {
    return next(error);
  }
}

async function publicBarbers(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("barbers")
      .select("id, name")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) throw new HttpError(500, "Falha ao listar barbeiros.");

    return res.json({ barbers: data || [] });
  } catch (error) {
    return next(error);
  }
}

async function createAppointment(req, res) {
  try {
    const validated = appointmentSchema.parse(req.body);

    // Dados do cliente (salvando direto no agendamento, pois tabela clients não existe)
    const clientData = {
      name: validated.client.name,
      phone: validated.client.phone,
      email: validated.client.email || null,
    };

    // Busca duração dos serviços
    const servicesData = await getActiveServicesByIds(validated.service_ids);
    const totalDuration = servicesData.totalDurationMinutes;

    // Cria o agendamento
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .insert({
        barber_id: validated.barber_id,
        service_ids: validated.service_ids,
        date: validated.date,
        time: validated.time,
        duration_minutes: totalDuration,
        status: 'confirmed',
        notes: validated.notes || null,
        // Dados do cliente salvos diretamente nas colunas
        client_name: clientData.name,
        client_phone: clientData.phone,
        client_email: clientData.email,
      })
      .select()
      .single();

    if (appError) throw appError;

    res.status(201).json({
      success: true,
      message: "Agendamento criado com sucesso!",
      appointment,
      client: clientData
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(400).json({
      error: "Erro ao criar agendamento",
      message: error.message
    });
  }
}

async function availability(req, res) {
  try {
    const { barber_id, date, service_ids } = req.query;

    if (!barber_id || !date) {
      return res.status(400).json({ error: "barber_id e date são obrigatórios" });
    }

    // Converte service_ids para array
    let serviceIdsArray = [];
    if (service_ids) {
      serviceIdsArray = Array.isArray(service_ids) 
        ? service_ids 
        : service_ids.toString().split(',').map(id => id.trim());
    }

    console.log('📌 Requisição de disponibilidade:', { 
      barber_id, 
      date, 
      service_ids: serviceIdsArray 
    });

    const result = await getAvailability({ 
      barber_id, 
      date, 
      service_ids: serviceIdsArray 
    });

    res.json({
      success: true,
      barber_id,
      date,
      total_duration_minutes: result.totalDurationMinutes || 0,
      available_slots: result.availableSlots || [],
      services: result.items || []
    });

  } catch (error) {
    console.error('Erro na availability:', error);
    res.status(500).json({ 
      error: "Erro interno do servidor",
      message: error.message 
    });
  }
}



module.exports = {
  availability,
  createAppointment,
  publicBarbers,
  publicServices,
};
