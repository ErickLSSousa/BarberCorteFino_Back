const env = require("../config/env");
const supabase = require("../config/supabase");
const HttpError = require("../utils/httpError");
const { addMinutes, assertInsideBusinessHours, parseLocalDateTime, toIso } = require("../utils/time");

const SERVICE_DURATIONS = {
  corte: 60,
  barba: 20,
  tintura: 120,
  sobrancelha: 5,
};

function normalizeServices(services, requestedIds) {
  const uniqueRequested = [...new Set(requestedIds)];

  if (services.length !== uniqueRequested.length) {
    throw new HttpError(400, "Um ou mais servicos informados nao existem ou estao inativos.");
  }

  let totalDurationMinutes = 0;
  let totalPriceCents = 0;

  const items = services.map((service) => {
    const duration = SERVICE_DURATIONS[service.name];
    if (!duration) {
      throw new HttpError(500, `Servico sem duracao configurada: ${service.name}`);
    }

    totalDurationMinutes += duration;
    totalPriceCents += service.price_cents;

    return {
      service_id: service.id,
      service_name: service.name,
      duration_minutes: duration,
      price_cents: service.price_cents,
    };
  });

  return { items, totalDurationMinutes, totalPriceCents };
}

async function getActiveServicesByIds(serviceIds) {
  const uniqueIds = [...new Set(serviceIds)];
  const { data, error } = await supabase
    .from("services")
    .select("id, name, price_cents, active")
    .in("id", uniqueIds)
    .eq("active", true);

  if (error) {
    throw new HttpError(500, "Falha ao consultar servicos.");
  }

  return normalizeServices(data || [], uniqueIds);
}

async function assertActiveBarber(barberId) {
  const { data, error } = await supabase
    .from("barbers")
    .select("id, active")
    .eq("id", barberId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Falha ao consultar barbeiro.");
  }

  if (!data) {
    throw new HttpError(400, "Barbeiro inexistente ou inativo.");
  }
}

async function hasConflict(barberId, startsAtIso, endsAtIso, ignoredAppointmentId = null) {
  let query = supabase
    .from("appointments")
    .select("id")
    .eq("barber_id", barberId)
    .in("status", ["scheduled", "confirmed"])
    .lt("starts_at", endsAtIso)
    .gt("ends_at", startsAtIso)
    .limit(1);

  if (ignoredAppointmentId) {
    query = query.neq("id", ignoredAppointmentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, "Falha ao verificar disponibilidade.");
  }

  return (data || []).length > 0;
}

async function buildAppointmentPayload(input) {
  const startsAt = parseLocalDateTime(input.starts_at);
  if (!startsAt) {
    throw new HttpError(400, "Data e horario devem estar no formato YYYY-MM-DDTHH:mm.");
  }

  if (startsAt.getTime() <= Date.now()) {
    throw new HttpError(400, "Nao e permitido agendar no passado.");
  }

  await assertActiveBarber(input.barber_id);
  const services = await getActiveServicesByIds(input.service_ids);
  const endsAt = addMinutes(startsAt, services.totalDurationMinutes);
  const businessError = assertInsideBusinessHours(startsAt, endsAt, env);

  if (businessError) {
    throw new HttpError(400, businessError);
  }

  const startsAtIso = toIso(startsAt);
  const endsAtIso = toIso(endsAt);

  if (await hasConflict(input.barber_id, startsAtIso, endsAtIso)) {
    throw new HttpError(409, "Este horario conflita com outro agendamento do barbeiro.");
  }

  return {
    appointment: {
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: input.customer_email,
      barber_id: input.barber_id,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      total_duration_minutes: services.totalDurationMinutes,
      total_price_cents: services.totalPriceCents,
      status: "scheduled",
    },
    services,
  };
}

module.exports = {
  SERVICE_DURATIONS,
  assertActiveBarber,
  buildAppointmentPayload,
  getActiveServicesByIds,
  hasConflict,
};
