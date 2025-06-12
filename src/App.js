import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import BookingPage from './pages/BookingPage';
import Container from './components/common/Container';
import Button from './components/common/Button';
import Card from './components/common/Card';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="border-b border-secondary-200 bg-white/80 backdrop-blur-sm">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-display font-bold text-secondary-900">Orkestre</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/cadastro">
                <Button variant="primary" size="sm">Criar Conta</Button>
              </Link>
            </nav>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <Container>
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-secondary-900 mb-6">
              Simplifique seus
              <span className="text-primary-600 block">Agendamentos</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
              A plataforma completa para gerenciar agendamentos do seu negócio. 
              Seus clientes agendam online e você controla tudo em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button variant="primary" size="xl" className="w-full sm:w-auto">
                  Começar Grátis
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-secondary-900 mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Funcionalidades pensadas para facilitar sua rotina e melhorar a experiência dos seus clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card hover={true} className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Agendamento Online</h3>
              <p className="text-secondary-600">Seus clientes agendam direto pelo link, 24/7, sem precisar ligar.</p>
            </Card>

            <Card hover={true} className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Gestão de Horários</h3>
              <p className="text-secondary-600">Configure seus horários de funcionamento e intervalos facilmente.</p>
            </Card>

            <Card hover={true} className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3M9 17h6m-6-10v10a2 2 0 002 2h3m-5-12V5a2 2 0 012-2h3m-5 4h6m-6 6h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Notificações</h3>
              <p className="text-secondary-600">Lembretes automáticos por WhatsApp para você e seus clientes.</p>
            </Card>

            <Card hover={true} className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Relatórios</h3>
              <p className="text-secondary-600">Acompanhe seus agendamentos e performance do negócio.</p>
            </Card>

            <Card hover={true} className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Mobile First</h3>
              <p className="text-secondary-600">Interface otimizada para celular, tablet e desktop.</p>
            </Card>

            <Card hover={true} className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Fácil de Usar</h3>
              <p className="text-secondary-600">Interface intuitiva que qualquer pessoa consegue usar.</p>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <Card className="text-center bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <h2 className="text-3xl font-display font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de profissionais que já simplificaram seus agendamentos com o Orkestre
            </p>
            <Link to="/cadastro">
              <Button variant="secondary" size="lg">
                Criar Conta Grátis
              </Button>
            </Link>
          </Card>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary-200 bg-white py-8">
        <Container>
          <div className="text-center text-secondary-500 text-sm">
            © 2024 Orkestre Agenda. Todos os direitos reservados.
          </div>
        </Container>
      </footer>
    </div>
  );
}

// Componentes de página placeholder (substitua pelos seus reais depois)
/* function LoginPagePlaceholder() { return <h2>Página de Login</h2>; }
function RegisterPagePlaceholder() { return <h2>Página de Cadastro</h2>; }
function DashboardPagePlaceholder() { return <h2>Dashboard</h2>; } */


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/agendar/:establishmentId" element={<BookingPage />} /> {/* <<<--- NOVA ROTA PÚBLICA */}

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