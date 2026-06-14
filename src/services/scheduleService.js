// src/services/scheduleService.js
const supabaseClient = require('../config/supabase');   // Importação corrigida

async function getActiveServicesByIds(serviceIds) {
  try {
    if (!serviceIds || serviceIds.length === 0) {
      throw new Error('Nenhum service_id foi fornecido');
    }

    console.log('🔍 Buscando serviços com IDs:', serviceIds);

    const { data, error } = await supabaseClient
      .from('services')
      .select('id, name, duration_minutes, price_cents')
      .in('id', serviceIds);

    if (error) {
      console.error('❌ Erro Supabase:', error);
      throw new Error(`Falha ao consultar serviços: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`Nenhum serviço encontrado com os IDs informados`);
    }

    let totalDurationMinutes = 0;
    let totalPriceCents = 0;

    const items = data.map((service) => {
      totalDurationMinutes += service.duration_minutes || 30;
      totalPriceCents += service.price_cents || 0;
      return {
        service_id: service.id,
        service_name: service.name,
        duration_minutes: service.duration_minutes,
        price_cents: service.price_cents,
      };
    });

    console.log(`✅ ${data.length} serviço(s) encontrado(s)`);
    return { items, totalDurationMinutes, totalPriceCents };

  } catch (err) {
    console.error('Erro em getActiveServicesByIds:', err.message);
    throw err;
  }
}

module.exports = { getActiveServicesByIds };