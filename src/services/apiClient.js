// Este arquivo configura um cliente Axios para interagir com a API do backend
// e adiciona um interceptor para incluir o token JWT em cada requisição. 

// Importa o axios para fazer requisições HTTP
import axios from 'axios'; 

// Cria uma instância do axios com a URL base da API
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1', // A URL base da sua API backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT ao cabeçalho de cada requisição
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('orkestreToken'); // Pega o token do localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Adiciona ao cabeçalho
    }
    return config; // Retorna a configuração para a requisição prosseguir
  },
  (error) => {
    return Promise.reject(error); // Trata erros na configuração da requisição
  }
);

// Interceptor para tratar respostas de erro
apiClient.interceptors.response.use(
  (response) => {
    return response; // Retorna a resposta se tudo estiver ok
  },
  (error) => {
    // Trata erros de resposta
    if (error.response) {
      // Se a resposta do servidor contiver um erro
      console.error('Erro na resposta da API:', error.response.data);
      return Promise.reject(error.response.data); // Rejeita a promessa com os dados do erro
    } else if (error.request) {
      // Se não houve resposta do servidor
      console.error('Nenhuma resposta recebida:', error.request);
      return Promise.reject(new Error('Nenhuma resposta recebida do servidor'));
    } else {
      // Se ocorreu um erro ao configurar a requisição
      console.error('Erro ao configurar a requisição:', error.message);
      return Promise.reject(new Error('Erro ao configurar a requisição'));
    }
  }
);

// Exporta o cliente API para ser usado em outros módulos
export default apiClient;