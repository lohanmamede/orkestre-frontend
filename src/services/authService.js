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

export { registerUser, loginUser };