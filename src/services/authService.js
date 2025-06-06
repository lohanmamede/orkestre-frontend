import apiClient from './apiClient'; // Nosso cliente Axios configurado

const registerUser = async (userData) => {
  // userData deve ser um objeto como { email: "...", password: "..." }
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data; // Retorna os dados do usuário criado (id, email, etc.)
  } catch (error) {
    // É importante tratar os erros aqui ou onde a função for chamada
    console.error("Erro no registro:", error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Erro ao registrar usuário');
  }
};

const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    // response.data deve conter { access_token: "...", token_type: "bearer" }

    // REMOVA ou COMENTE a linha abaixo, pois o AuthContext cuidará disso:
    // if (response.data.access_token) {
    //   localStorage.setItem('orkestreToken', response.data.access_token);
    //   console.log("Token armazenado:", response.data.access_token);
    // }

    return response.data; // Apenas retorne os dados da resposta
  } catch (error) {
    console.error("Erro no login:", error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Erro ao fazer login');
  }
};

/*export (pode ser usado aqui também) antes do const*/ 
const getCurrentUserDetails = async () => {
  try {
    // O token JWT já será incluído automaticamente pelo interceptor no apiClient
    const response = await apiClient.get('/users/me'); 
    return response.data; // Espera-se um objeto UserMe com id, email, establishment, etc.
  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    // O interceptor de resposta no apiClient (se você o implementou)
    // já pode ter processado o error.response.data.
    // Se não, você pode querer extrair error.response.data aqui.
    // Por enquanto, relançamos o erro para ser tratado onde a função for chamada.
    throw error; 
  }
};

export { registerUser, loginUser, getCurrentUserDetails };

/*
Explicação da getCurrentUserDetails:
- Ela faz uma requisição GET para o endpoint /users/me usando nosso apiClient.
- Importante: O apiClient.js, com o interceptor de requisição que configuramos, automaticamente adicionará o token JWT (que deve estar no localStorage após o login) ao cabeçalho Authorization desta requisição. É por isso que não precisamos passar o token manualmente aqui.
- Se a requisição for bem-sucedida, ela retorna os dados do usuário (o objeto UserMe que o backend envia).
- Se houver um erro (ex: token inválido, expirado, ou o usuário não encontrado no backend), ela loga o erro e o relança para ser tratado pelo componente que a chamou (que será o nosso AuthContext).
*/


