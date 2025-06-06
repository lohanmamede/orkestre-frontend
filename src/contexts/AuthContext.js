import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// Importe a função do seu serviço de autenticação
import { getCurrentUserDetails } from '../services/authService'; 
// import { jwtDecode } from 'jwt-decode'; // Poderemos usar para pegar o 'sub' (email) do token se necessário

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('orkestreToken'));
  const [currentUser, setCurrentUser] = useState(null); // Novo estado para os dados do usuário
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Para saber quando os dados do usuário estão sendo carregados

  const fetchCurrentUserDetails = useCallback(async (currentToken) => {
    if (currentToken) {
      setIsLoadingUser(true);
      try {
        const userData = await getCurrentUserDetails(); // O token já é enviado pelo interceptor do apiClient
        setCurrentUser(userData); // userData deve ser o objeto UserMe do backend
        console.log("Dados do usuário carregados:", userData);
      } catch (error) {
        console.error("Falha ao buscar dados do usuário, possivelmente token inválido:", error);
        // Se falhar ao buscar dados do usuário (ex: token expirado), deslogamos
        setToken(null); // Isso também removerá do localStorage via o outro useEffect
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    } else {
      setCurrentUser(null); // Garante que não há usuário se não há token
      setIsLoadingUser(false); // Terminou de "carregar" (não havia usuário)
    }
  }, []); // useCallback para evitar recriações desnecessárias da função

  // Efeito para buscar dados do usuário quando o token mudar ou na carga inicial
  useEffect(() => {
    fetchCurrentUserDetails(token);
  }, [token, fetchCurrentUserDetails]);


  // Efeito para sincronizar o token com o localStorage (este você já tinha)
  useEffect(() => {
    if (token) {
      localStorage.setItem('orkestreToken', token);
    } else {
      localStorage.removeItem('orkestreToken');
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
    // O useEffect acima já buscará os dados do usuário quando o token for setado
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null); // Limpa também os dados do usuário
    // O redirecionamento é feito no componente que chama o logout
  };

  const value = {
    token,
    currentUser, // Disponibiliza o usuário atual
    isAuthenticated: !!token && !!currentUser, // Autenticado se tiver token E dados do usuário
    isLoadingUser, // Para o App saber se ainda está carregando os dados do usuário
    login,
    logout,
  };

  // Não renderiza os filhos até que o carregamento inicial do usuário esteja completo
  // Isso evita que ProtectedRoute ou outros componentes tentem acessar currentUser antes dele estar pronto
  if (isLoadingUser && token) { // Se temos um token, esperamos carregar o usuário
      return <p>Carregando sessão...</p>; // Ou um spinner/tela de loading mais elaborada
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

/*
Principais Mudanças no AuthContext.js: Depois de fazer essas alterações, seu AuthContext estará muito mais robusto. Ele não apenas gerenciará o token, mas também os dados do usuário logado e terá um estado de carregamento inicial.

- import { getCurrentUserDetails } from '../services/authService';: Importamos a nova função.
- useState(null) para currentUser: Um novo estado para armazenar o objeto do usuário que virá da API (que inclui id, email, e o objeto establishment com id e name).
- useState(true) para isLoadingUser: Um estado para sabermos se ainda estamos tentando carregar os dados do usuário na inicialização da aplicação (se um token existir).
- fetchCurrentUserDetails com useCallback:
  - Esta nova função é responsável por chamar getCurrentUserDetails().
  - Ela é async e usa try...catch.
  - Se a busca for bem-sucedida, atualiza setCurrentUser(userData).
  - Se falhar (ex: token expirado ou inválido), ela limpa o token e o usuário (setToken(null); setCurrentUser(null);), efetivamente deslogando o usuário.
  - useCallback é usado para memorizar a função e evitar recriações desnecessárias, o que é bom quando ela é usada em listas de dependência de useEffect.
- Novo useEffect para Chamar fetchCurrentUserDetails:
  - Este useEffect roda quando o componente AuthProvider monta pela primeira vez e sempre que o token (ou a própria função fetchCurrentUserDetails memorizada) mudar.
  - Seu objetivo é buscar os dados do usuário se um token existir.
- Atualização da Função login(newToken):
  - Agora ela apenas faz setToken(newToken). O useEffect que "escuta" por mudanças no token se encarregará de chamar fetchCurrentUserDetails.
- Atualização da Função logout():
  - Além de setToken(null), agora também faz setCurrentUser(null).
- Atualização do value do Contexto:
  - Adicionamos currentUser e isLoadingUser ao objeto value.
  - Mudamos isAuthenticated: agora só é true se tivermos um token E um currentUser (garantindo que os dados do usuário foram carregados com sucesso).
- Lógica de "Carregando Sessão...":
  - Adicionamos uma verificação: if (isLoadingUser && token) { return <p>Carregando sessão...</p>; }.
  - Isso é importante para que, se houver um token no localStorage na inicialização, a aplicação espere o fetchCurrentUserDetails terminar antes de renderizar o restante dos componentes filhos (children). Isso evita que, por exemplo, um ProtectedRoute tente acessar currentUser enquanto ele ainda é null e isLoadingUser é true, o que poderia causar um redirecionamento indevido para a página de login.
*/