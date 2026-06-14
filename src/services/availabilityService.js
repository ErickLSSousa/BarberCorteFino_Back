const supabase = require("../config/supabase");
const { getActiveServicesByIds } = require("./scheduleService");

async function getAvailability({
  barber_id,
  date,
  service_ids,
}) {
  if (!barber_id) {
    throw new Error("barber_id é obrigatório");
  }

  if (!date) {
    throw new Error("date é obrigatório");
  }

  if (!service_ids?.length) {
    throw new Error("service_ids é obrigatório");
  }

  const servicesData =
    await getActiveServicesByIds(service_ids);

  const totalDuration =
    servicesData.totalDurationMinutes;

  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: appointments, error } =
    await supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("barber_id", barber_id)
      .in("status", ["scheduled", "confirmed"])
      .gte("starts_at", startOfDay)
      .lte("starts_at", endOfDay);

  if (error) {
    throw error;
  }

  const availableSlots = [];

  const startBusiness = 9 * 60;
  const endBusiness = 19 * 60;

  for (
    let current = startBusiness;
    current + totalDuration <= endBusiness;
    current += 30
  ) {
    const slotStart = new Date(
      `${date}T00:00:00`
    );

    slotStart.setMinutes(current);

    const slotEnd = new Date(
      slotStart.getTime() +
        totalDuration * 60000
    );

    const hasConflict =
      appointments?.some((appointment) => {
        const existingStart =
          new Date(appointment.starts_at);

        const existingEnd =
          new Date(appointment.ends_at);

        return (
          slotStart < existingEnd &&
          slotEnd > existingStart
        );
      }) || false;

    if (!hasConflict) {
      availableSlots.push(
        slotStart.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    }
  }

  return {
    availableSlots,
    totalDurationMinutes: totalDuration,
    items: servicesData.items,
  };
}

module.exports = {
  getAvailability,
};