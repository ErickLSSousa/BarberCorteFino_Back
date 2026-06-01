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

async function createAppointment(req, res, next) {
  try {
    const payload = await buildAppointmentPayload(req.body);

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert(payload.appointment)
      .select("id, starts_at, ends_at, total_duration_minutes, total_price_cents, status")
      .single();

    if (error) {
      if (error.code === "23P01") {
        throw new HttpError(409, "Este horario conflita com outro agendamento do barbeiro.");
      }

      throw new HttpError(500, "Falha ao salvar agendamento.");
    }

    const rows = payload.services.items.map((item) => ({
      appointment_id: appointment.id,
      ...item,
    }));

    const { error: servicesError } = await supabase.from("appointment_services").insert(rows);

    if (servicesError) {
      await supabase.from("appointments").delete().eq("id", appointment.id);
      throw new HttpError(500, "Falha ao salvar servicos do agendamento.");
    }

    return res.status(201).json({
      appointment: {
        ...appointment,
        services: payload.services.items,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function availability(req, res, next) {
  try {
    await assertActiveBarber(req.query.barber_id);
    const services = await getActiveServicesByIds(req.query.service_ids);
    const slots = [];
    const openHour = Number(env.BUSINESS_OPEN_TIME.slice(0, 2));
    const openMinute = Number(env.BUSINESS_OPEN_TIME.slice(3, 5));
    const closeHour = Number(env.BUSINESS_CLOSE_TIME.slice(0, 2));
    const closeMinute = Number(env.BUSINESS_CLOSE_TIME.slice(3, 5));

    const dayStart = parseLocalDateTime(`${req.query.date}T${String(openHour).padStart(2, "0")}:${String(openMinute).padStart(2, "0")}`);
    const dayClose = parseLocalDateTime(`${req.query.date}T${String(closeHour).padStart(2, "0")}:${String(closeMinute).padStart(2, "0")}`);

    if (!dayStart || !dayClose) {
      throw new HttpError(400, "Data invalida.");
    }

    if (assertInsideBusinessHours(dayStart, addMinutes(dayStart, 1), env)) {
      return res.json({ slots: [] });
    }

    for (let cursor = dayStart; addMinutes(cursor, services.totalDurationMinutes) <= dayClose; cursor = addMinutes(cursor, 5)) {
      if (cursor.getTime() <= Date.now()) {
        continue;
      }

      const end = addMinutes(cursor, services.totalDurationMinutes);
      if (!(await hasConflict(req.query.barber_id, toIso(cursor), toIso(end)))) {
        slots.push({
          starts_at: `${req.query.date}T${String(cursor.getHours()).padStart(2, "0")}:${String(cursor.getMinutes()).padStart(2, "0")}`,
          ends_at: `${req.query.date}T${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
          total_duration_minutes: services.totalDurationMinutes,
          total_price_cents: services.totalPriceCents,
        });
      }
    }

    return res.json({ slots });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  availability,
  createAppointment,
  publicBarbers,
  publicServices,
};
