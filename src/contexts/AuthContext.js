import React, { createContext, useState, useContext, useEffect } from 'react';
// import { jwtDecode } from 'jwt-decode'; // Instalaremos e usaremos depois para decodificar o token

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('orkestreToken'));
  // const [user, setUser] = useState(null); // Poderemos adicionar o objeto do usuário aqui depois

  useEffect(() => {
    // Este efeito sincroniza o estado do token com o localStorage
    // Se o token mudar no estado, atualiza o localStorage
    // Se o token for removido do estado (logout), remove do localStorage
    if (token) {
      localStorage.setItem('orkestreToken', token);
      // Aqui poderíamos decodificar o token para pegar infos do usuário se quiséssemos
      // Ex: const decodedToken = jwtDecode(token);
      //     setUser({ email: decodedToken.sub }); // Assumindo que 'sub' é o email
    } else {
      localStorage.removeItem('orkestreToken');
      // setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
    // Redirecionamento será feito no componente LoginPage
  };

  const logout = () => {
    setToken(null);
    // Redirecionamento será feito no componente que chamar o logout
  };

  // O valor fornecido pelo contexto: o token e as funções de login/logout
  // Adicionaremos 'user' aqui quando o implementarmos
  const value = {
    token,
    isAuthenticated: !!token, // Um booleano simples para verificar se há um token
    login,
    logout,
    // user, // Descomente quando 'user' for implementado
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) { // Ajustado para null também
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};