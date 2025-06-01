import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Seus estilos globais ou do App
// Importe suas futuras páginas aqui quando as criar:
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// import DashboardPage from './pages/DashboardPage';

function HomePage() {
  return (
    <div>
      <h1>Bem-vindo ao Orkestre Agenda!</h1>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/cadastro">Cadastro</Link>
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
        {/* Você pode ter um Navbar aqui no futuro */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} /> {/* Substitua por <LoginPage /> */}
          <Route path="/cadastro" element={<RegisterPage />} /> {/* Substitua por <RegisterPage /> */}
          <Route path="/dashboard" element={<DashboardPagePlaceholder />} /> {/* Substitua por <DashboardPage /> */}
          {/* Adicione uma rota para NotFoundPage se desejar */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;