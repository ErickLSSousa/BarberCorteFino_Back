const supabase = require("../config/supabase");
const { getActiveServicesByIds } = require("../services/scheduleService");
const { getAvailability } = require("../services/availabilityService");
const {
  appointmentSchema,
} = require("../schemas/appointmentSchemas");

async function publicServices(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents")
      .eq("active", true)
      .order("name");

    if (error) throw error;

    return res.json({ services: data || [] });
  } catch (error) {
    next(error);
  }
}

async function publicBarbers(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("barbers")
      .select("id, name")
      .eq("active", true)
      .order("name");

    if (error) throw error;

    return res.json({ barbers: data || [] });
  } catch (error) {
    next(error);
  }
}

async function createAppointment(req, res) {
  try {
    const validated = appointmentSchema.parse(req.body);

    const servicesData = await getActiveServicesByIds(
      validated.service_ids
    );

    const totalDuration =
      servicesData.totalDurationMinutes;

    const totalPrice =
      servicesData.totalPriceCents;

    const startsAt = new Date(
      `${validated.date}T${validated.time}:00`
    );

    const endsAt = new Date(
      startsAt.getTime() + totalDuration * 60000
    );

    const { data: appointment, error: appointmentError } =
      await supabase
        .from("appointments")
        .insert({
          customer_name: validated.client.name,
          customer_phone: validated.client.phone,
          customer_email: validated.client.email,

          barber_id: validated.barber_id,

          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),

          total_duration_minutes: totalDuration,
          total_price_cents: totalPrice,

          status: "confirmed",
        })
        .select()
        .single();

    if (appointmentError) {
      throw appointmentError;
    }

    const appointmentServices =
      servicesData.items.map((service) => ({
        appointment_id: appointment.id,
        service_id: service.service_id,
        service_name: service.service_name,
        duration_minutes: service.duration_minutes,
        price_cents: service.price_cents,
      }));

    const { error: servicesError } = await supabase
      .from("appointment_services")
      .insert(appointmentServices);

    if (servicesError) {
      throw servicesError;
    }

    return res.status(201).json({
      success: true,
      message: "Agendamento criado com sucesso",
      appointment,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      error: "Erro ao criar agendamento",
      message: error.message,
    });
  }
}

async function availability(req, res) {
  try {
    const { barber_id, date, service_ids } = req.query;

    let serviceIdsArray = [];

    if (service_ids) {
      serviceIdsArray = Array.isArray(service_ids)
        ? service_ids
        : service_ids.split(",");
    }

    const result = await getAvailability({
      barber_id,
      date,
      service_ids: serviceIdsArray,
    });

    return res.json({
      success: true,
      barber_id,
      date,
      total_duration_minutes:
        result.totalDurationMinutes,
      available_slots: result.availableSlots,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

module.exports = {
  publicServices,
  publicBarbers,
  createAppointment,
  availability,
};