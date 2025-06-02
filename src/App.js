import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Seus estilos globais ou do App
// Importe suas futuras páginas aqui quando as criar:
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute'; // Ajuste o caminho se necessário


function HomePage() {
  return (
    <div>
      <h1>Bem-vindo ao Orkestre Agenda!</h1>
      <nav>
        <Link to="/login" className="text-blue-500 hover:text-blue-700 mr-2">Login</Link>
        <Link to="/cadastro" className="text-blue-500 hover:text-blue-700">Cadastro</Link>
        <Link to="/dashboard" className="text-green-500 hover:text-green-700 ml-2">Dashboard (Teste Protegido)</Link>
      </nav>
    </div>
  );
}

// Componentes de página placeholder (substitua pelos seus reais depois)
function LoginPagePlaceholder() { return <h2>Página de Login</h2>; }
function RegisterPagePlaceholder() { return <h2>Página de Cadastro</h2>; }
function DashboardPagePlaceholder() { return <h2>Dashboard</h2>; }


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />

          {/* Rota Protegida para o Dashboard */}
          <Route element={<ProtectedRoute />}> {/* Envolve as rotas que você quer proteger */}
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Você pode adicionar outras rotas protegidas aqui dentro no futuro */}
          </Route>

          {/* <Route path="*" element={<NotFoundPage />} />  // Para uma página 404 */}
        </Routes>
      </div>
    </Router>
  );
}


export default App;