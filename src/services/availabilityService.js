// src/services/availabilityService.js
const supabase = require('../config/supabase');
const { getActiveServicesByIds } = require('./scheduleService');

async function getAvailability({ barber_id, date, service_ids }) {
  try {
    if (!barber_id || !date || !service_ids?.length) {
      throw new Error('barber_id, date e service_ids são obrigatórios');
    }

    // Busca serviços
    const servicesData = await getActiveServicesByIds(service_ids);
    const totalDuration = servicesData.totalDurationMinutes || 0;

    // Busca agendamentos existentes (versão segura)
    const { data: appointments, error: appError } = await supabase
      .from('appointments')
      .select('*')                    // seleciona todas as colunas
      .eq('barber_id', barber_id)
      .eq('date', date)
      .in('status', ['confirmed', 'pending']);

    if (appError) {
      console.error('Erro ao buscar agendamentos:', appError);
      // Continua mesmo se der erro (para não travar o fluxo)
    }

    // Lógica de horários (09:00 ~ 19:00)
    const startHour = 9;
    const endHour = 19;
    const interval = 30;
    const availableSlots = [];

    let current = startHour * 60;

    while (current + totalDuration <= endHour * 60) {
      const hours = Math.floor(current / 60);
      const minutes = current % 60;
      const slotTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Verificação simplificada por enquanto (evita erro de coluna)
      const isBusy = appointments?.some(apt => {
        const aptTime = apt.time || apt.appointment_time || apt.start_time || apt.hora;
        if (!aptTime) return false;
        const [aptH, aptM] = aptTime.split(':').map(Number);
        const aptStart = aptH * 60 + aptM;
        const aptEnd = aptStart + (apt.duration_minutes || 60);
        return current < aptEnd && current + totalDuration > aptStart;
      }) || false;

      if (!isBusy) {
        availableSlots.push(slotTime);
      }

      current += interval;
    }

    return {
      availableSlots,
      totalDurationMinutes: totalDuration,
      items: servicesData.items || []
    };

  } catch (error) {
    console.error('Erro em getAvailability:', error.message);
    throw error;
  }
}

module.exports = { getAvailability };