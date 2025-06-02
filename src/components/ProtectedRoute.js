import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Nosso hook de autenticação

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Se o usuário não estiver autenticado, redireciona para a página de login
    // Você pode passar o local atual para redirecionar de volta após o login, se desejar:
    // return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, renderiza o componente filho da rota (ou o <Outlet /> para rotas aninhadas)
  return <Outlet />; 
  // Se você não estiver usando rotas filhas aninhadas e quiser passar o componente diretamente:
  // const { component: Component } = props; // Se você passar 'component' como prop
  // return <Component />;
  // Mas usar <Outlet /> é mais comum com a v6 do react-router-dom para rotas aninhadas ou encapsuladas
};

export default ProtectedRoute;