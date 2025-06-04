// Este serviço lida com as operações relacionadas a estabelecimentos,
// como buscar detalhes e atualizar horários de funcionamento.
import apiClient from './apiClient'; // Nosso cliente Axios configurado

// Função para buscar os detalhes de um estabelecimento (incluindo horários)
export const getEstablishmentDetails = async (establishmentId) => {
  try {
    const response = await apiClient.get(`/establishments/${establishmentId}`);
    return response.data; // Espera-se o objeto do estabelecimento com working_hours_config
  } catch (error) {
    console.error(`Erro ao buscar detalhes do estabelecimento ${establishmentId}:`, error);
    // O interceptor de resposta no apiClient já deve ter rejeitado com error.response.data ou um new Error
    throw error; 
  }
};

// Função para atualizar a configuração de horários de um estabelecimento
// workingHoursData deve ser um objeto no formato do schema WorkingHoursConfig
export const updateEstablishmentWorkingHours = async (establishmentId, workingHoursData) => {
  try {
    // O token JWT será adicionado automaticamente pelo interceptor do apiClient
    const response = await apiClient.put(`/establishments/${establishmentId}/working-hours`, workingHoursData);
    return response.data; // Retorna o estabelecimento atualizado
  } catch (error) {
    console.error(`Erro ao atualizar horários do estabelecimento ${establishmentId}:`, error);
    throw error;
  }
};

/*
Explicação:

- getEstablishmentDetails(establishmentId):
    - Faz uma requisição GET para o endpoint /establishments/{establishment_id} que você criou no backend.
    - Esperamos que a resposta contenha todos os dados do estabelecimento, incluindo o campo working_hours_config (se já estiver definido).
- updateEstablishmentWorkingHours(establishmentId, workingHoursData):
    - Faz uma requisição PUT para o endpoint /establishments/{establishment_id}/working-hours.
    - Envia o objeto workingHoursData (que deverá estar no formato do nosso schema Pydantic WorkingHoursConfig) no corpo da requisição.
    - O token JWT para autenticar o usuário (e permitir que o backend verifique se ele é o dono do estabelecimento) será adicionado automaticamente pelo interceptor que configuramos no apiClient.js.
- Tratamento de Erro: Ambas as funções usam um try...catch. Se você implementou o interceptor de resposta no apiClient.js (como o Copilot sugeriu e você considerou), o error aqui já virá "tratado" por ele (geralmente sendo error.response.data ou um objeto Error). Se não implementou o interceptor de resposta ainda, o catch aqui pegará o erro bruto do Axios. Por enquanto, estamos apenas logando e relançando.
*/