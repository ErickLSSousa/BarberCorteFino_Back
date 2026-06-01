function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateToLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSunday(date) {
  return date.getDay() === 0;
}

function parseLocalDateTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function toIso(date) {
  return date.toISOString();
}

function assertInsideBusinessHours(start, end, env) {
  if (isSunday(start)) {
    return "A barbearia funciona de segunda a sabado.";
  }

  if (dateToLocalDateKey(start) !== dateToLocalDateKey(end)) {
    return "O agendamento precisa terminar no mesmo dia em que comeca.";
  }

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const openMinutes = timeToMinutes(env.BUSINESS_OPEN_TIME);
  const closeMinutes = timeToMinutes(env.BUSINESS_CLOSE_TIME);

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return `Horario fora do funcionamento configurado (${env.BUSINESS_OPEN_TIME} as ${env.BUSINESS_CLOSE_TIME}).`;
  }

  return null;
}

module.exports = {
  addMinutes,
  assertInsideBusinessHours,
  parseLocalDateTime,
  toIso,
};

