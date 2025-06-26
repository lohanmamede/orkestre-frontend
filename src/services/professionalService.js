import apiClient from './apiClient';

// Criar profissional
export const createProfessional = async (professionalData) => {
  try {
    const response = await apiClient.post('/professionals', professionalData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao criar profissional',
      message: errorData.message || error.message || 'Erro ao criar profissional'
    };
  }
};

// Buscar todos os profissionais do estabelecimento
export const getProfessionalsByEstablishment = async (establishmentId) => {
  try {
    const response = await apiClient.get(`/professionals/establishment/${establishmentId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao buscar profissionais',
      message: errorData.message || error.message || 'Erro ao buscar profissionais'
    };
  }
};

// Buscar profissional por ID
export const getProfessionalById = async (professionalId) => {
  try {
    const response = await apiClient.get(`/professionals/${professionalId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao buscar profissional',
      message: errorData.message || error.message || 'Erro ao buscar profissional'
    };
  }
};

// Atualizar profissional
export const updateProfessional = async (professionalId, professionalData) => {
  try {
    const response = await apiClient.put(`/professionals/${professionalId}`, professionalData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao atualizar profissional',
      message: errorData.message || error.message || 'Erro ao atualizar profissional'
    };
  }
};

// Excluir profissional
export const deleteProfessional = async (professionalId) => {
  try {
    const response = await apiClient.delete(`/professionals/${professionalId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao excluir profissional',
      message: errorData.message || error.message || 'Erro ao excluir profissional'
    };
  }
};

// Buscar serviços do profissional
export const getProfessionalServices = async (professionalId) => {
  try {
    const response = await apiClient.get(`/professionals/${professionalId}/services`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar serviços do profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao buscar serviços do profissional',
      message: errorData.message || error.message || 'Erro ao buscar serviços do profissional'
    };
  }
};

// Atualizar serviços do profissional
export const updateProfessionalServices = async (professionalId, serviceIds) => {
  try {
    const response = await apiClient.put(`/professionals/${professionalId}/services`, {
      service_ids: serviceIds
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar serviços do profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao atualizar serviços do profissional',
      message: errorData.message || error.message || 'Erro ao atualizar serviços do profissional'
    };
  }
};

// Buscar horários de trabalho do profissional
export const getProfessionalWorkingHours = async (professionalId) => {
  try {
    const response = await apiClient.get(`/professionals/${professionalId}/working-hours`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar horários do profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao buscar horários do profissional',
      message: errorData.message || error.message || 'Erro ao buscar horários do profissional'
    };
  }
};

// Atualizar horários de trabalho do profissional
export const updateProfessionalWorkingHours = async (professionalId, workingHours) => {
  try {
    const response = await apiClient.put(`/professionals/${professionalId}/working-hours`, workingHours);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar horários do profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao atualizar horários do profissional',
      message: errorData.message || error.message || 'Erro ao atualizar horários do profissional'
    };
  }
};

// Buscar agendamentos do profissional
export const getProfessionalAppointments = async (professionalId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.status) queryParams.append('status', filters.status);
    
    const url = `/professionals/${professionalId}/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos do profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao buscar agendamentos do profissional',
      message: errorData.message || error.message || 'Erro ao buscar agendamentos do profissional'
    };
  }
};

// Ativar/Desativar profissional
export const toggleProfessionalStatus = async (professionalId, isActive) => {
  try {
    const response = await apiClient.patch(`/professionals/${professionalId}/status`, {
      is_active: isActive
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar status do profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao alterar status do profissional',
      message: errorData.message || error.message || 'Erro ao alterar status do profissional'
    };
  }
};

// Buscar estatísticas do profissional
export const getProfessionalStats = async (professionalId, period = 'month') => {
  try {
    const response = await apiClient.get(`/professionals/${professionalId}/stats?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas do profissional:', error);
    // Estruturar erro para compatibilidade com o componente
    const errorData = error.response?.data || {};
    throw {
      detail: errorData.detail || errorData.message || error.message || 'Erro ao buscar estatísticas do profissional',
      message: errorData.message || error.message || 'Erro ao buscar estatísticas do profissional'
    };
  }
};
