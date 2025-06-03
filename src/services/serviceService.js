// Em src/services/serviceService.js

import apiClient from './apiClient';

// Função para buscar os serviços de um estabelecimento específico
export const getServicesByEstablishment = async (establishmentId) => {
  try {
    const response = await apiClient.get(`/establishments/${establishmentId}/services/`);
    return response.data; // Espera-se uma lista de serviços
  } catch (error) {
    console.error(`Erro ao buscar serviços para o estabelecimento ${establishmentId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Erro ao buscar serviços');
  }
};

// Função para criar um novo serviço para um estabelecimento
// userData aqui seria serviceData: { name, description, price, duration_minutes, is_active }
export const createServiceForEstablishment = async (establishmentId, serviceData) => {
  try {
    // O token JWT será adicionado automaticamente pelo interceptor do apiClient (quando o implementarmos)
    const response = await apiClient.post(`/establishments/${establishmentId}/services/`, serviceData);
    return response.data; // Retorna o serviço criado
  } catch (error) {
    console.error(`Erro ao criar serviço para o estabelecimento ${establishmentId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Erro ao criar serviço');
  }
};

// Função para buscar um serviço específico por ID (pode não ser usada diretamente no dashboard inicial)
export const getServiceById = async (serviceId) => {
  try {
    const response = await apiClient.get(`/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar serviço ${serviceId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Erro ao buscar serviço');
  }
};

// Função para atualizar um serviço
export const updateService = async (serviceId, serviceData) => {
  try {
    const response = await apiClient.put(`/services/${serviceId}`, serviceData);
    return response.data; // Retorna o serviço atualizado
  } catch (error) {
    console.error(`Erro ao atualizar serviço ${serviceId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Erro ao atualizar serviço');
  }
};

// Função para deletar um serviço
export const deleteService = async (serviceId) => {
  try {
    const response = await apiClient.delete(`/services/${serviceId}`);
    return response.data; // Retorna o serviço deletado (ou uma mensagem de sucesso)
  } catch (error) {
    console.error(`Erro ao deletar serviço ${serviceId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Erro ao deletar serviço');
  }
};