const supabase = require("../config/supabase");
const HttpError = require("../utils/httpError");

async function listBarbers(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("barbers")
      .select("id, name, phone, active, created_at")
      .order("name", { ascending: true });

    if (error) throw new HttpError(500, "Falha ao listar barbeiros.");

    return res.json({ barbers: data || [] });
  } catch (error) {
    return next(error);
  }
}

async function createBarber(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("barbers")
      .insert({
        name: req.body.name,
        phone: req.body.phone || null,
        active: req.body.active ?? true,
      })
      .select("id, name, phone, active, created_at")
      .single();

    if (error) throw new HttpError(500, "Falha ao cadastrar barbeiro.");

    return res.status(201).json({ barber: data });
  } catch (error) {
    return next(error);
  }
}

async function listServices(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents, active, created_at")
      .order("name", { ascending: true });

    if (error) throw new HttpError(500, "Falha ao listar servicos.");

    return res.json({ services: data || [] });
  } catch (error) {
    return next(error);
  }
}

async function upsertService(req, res, next) {
  try {
    const durations = {
      corte: 60,
      barba: 20,
      tintura: 120,
      sobrancelha: 5,
    };

    const { data, error } = await supabase
      .from("services")
      .upsert(
        {
          name: req.body.name,
          duration_minutes: durations[req.body.name],
          price_cents: req.body.price_cents,
          active: req.body.active ?? true,
        },
        { onConflict: "name" },
      )
      .select("id, name, duration_minutes, price_cents, active, created_at")
      .single();

    if (error) throw new HttpError(500, "Falha ao salvar servico.");

    return res.status(201).json({ service: data });
  } catch (error) {
    return next(error);
  }
}

async function listAppointments(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        customer_name,
        customer_phone,
        customer_email,
        starts_at,
        ends_at,
        total_duration_minutes,
        total_price_cents,
        status,
        barber:barbers(id, name),
        appointment_services(service_id, service_name, duration_minutes, price_cents)
      `)
      .order("starts_at", { ascending: true })
      .limit(200);

    if (error) throw new HttpError(500, "Falha ao listar agendamentos.");

    return res.json({ appointments: data || [] });
  } catch (error) {
    return next(error);
  }
}

async function updateAppointmentStatus(req, res, next) {
  try {
    const allowed = ["scheduled", "confirmed", "cancelled", "completed", "no_show"];
    const { status } = req.body;

    if (!allowed.includes(status)) {
      throw new HttpError(400, "Status invalido.");
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", req.params.id)
      .select("id, status")
      .single();

    if (error) throw new HttpError(500, "Falha ao atualizar agendamento.");

    return res.json({ appointment: data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBarber,
  listAppointments,
  listBarbers,
  listServices,
  updateAppointmentStatus,
  upsertService,
};

