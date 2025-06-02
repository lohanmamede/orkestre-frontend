import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Importe o hook useAuth
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button'; // Seu componente de botão

const DashboardPage = () => {
  const { token, logout, isAuthenticated } = useAuth(); // Pegue o token e a função logout
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Chama a função logout do AuthContext
    navigate('/login'); // Redireciona para a página de login
  };

  // Para "ver" o token e o estado de autenticação aqui:
  console.log('Token no Dashboard:', token);
  console.log('Autenticado no Dashboard?', isAuthenticated);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard - Orkestre Agenda</h1>
      {isAuthenticated && token ? (
        <div>
          <p className="mb-4">Bem-vindo! Você está logado.</p>
          <p className="text-sm text-gray-600 mb-2">Seu token (apenas para debug):</p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-4">{token}</pre>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-700">
            Logout
          </Button>
        </div>
      ) : (
        <p>Você não está logado. Por favor, <a href="/login" className="text-blue-500 hover:text-blue-700">faça login</a>.</p>
        // Idealmente, esta página não seria acessível sem login (ProtectedRoute)
      )}
    </div>
  );
};

export default DashboardPage;