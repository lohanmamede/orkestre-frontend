import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1', // A URL base da sua API backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Futuramente, aqui poderemos adicionar interceptors para incluir o token JWT
// automaticamente nos headers das requisições autenticadas.
// Exemplo:
// apiClient.interceptors.request.use(config => {
//   const token = localStorage.getItem('orkestreToken'); // Ou de onde você armazenar
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, error => {
//   return Promise.reject(error);
// });

export default apiClient;