// src/services/appointmentService.js
import apiClient from './apiClient';

/**
 * Busca os horários disponíveis para um serviço específico em uma data.
 * @param {number|string} establishmentId - O ID do estabelecimento.
 * @param {number|string} serviceId - O ID do serviço.
 * @param {string} date - A data no formato 'YYYY-MM-DD'.
 * @returns {Promise<Array<string>>} - Uma promessa que resolve para uma lista de horários (ex: ["09:00:00", "09:30:00"]).
 */
export const getAvailableSlotsForService = async (establishmentId, serviceId, date) => {
  try {
    const response = await apiClient.get(
      `/establishments/${establishmentId}/services/${serviceId}/available-slots`,
      {
        params: {
          appointment_date: date,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    // O interceptor de resposta (se implementado) pode já ter formatado o erro.
    // Relançamos para que o componente possa tratar.
    throw error;
  }
};

/**
 * Cria um novo agendamento.
 * @param {number|string} establishmentId - O ID do estabelecimento onde o agendamento será criado.
 * @param {object} appointmentData - Os dados do agendamento.
 * @param {string} appointmentData.start_time - A data e hora de início no formato ISO 8601.
 * @param {number} appointmentData.service_id - O ID do serviço agendado.
 * @param {string} appointmentData.customer_name - O nome do cliente.
 * @param {string} appointmentData.customer_phone - O telefone do cliente.
 * @param {string|null} [appointmentData.customer_email] - O email opcional do cliente.
 * @param {string|null} [appointmentData.notes_by_customer] - As notas opcionais do cliente.
 * @returns {Promise<object>} - Uma promessa que resolve para o objeto do agendamento criado.
 */
export const createAppointment = async (establishmentId, appointmentData) => {
  try {
    const response = await apiClient.post(`/establishments/${establishmentId}/appointments/`, appointmentData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    throw error;
  }
};

// Futuramente, podemos adicionar mais funções aqui:
// - getAppointmentDetails(appointmentId)
// - cancelAppointment(appointmentId, cancelToken)