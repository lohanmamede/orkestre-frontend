// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import InputField from '../components/common/InputField'
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { getServicesByEstablishment, createServiceForEstablishment } from '../services/serviceService'; // Importe o serviço


const DashboardPage = () => {
  const { token, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [createServiceError, setCreateServiceError] = useState('');

  // Defina o ID do estabelecimento para teste por enquanto
  // No futuro, este ID virá do usuário logado/AuthContext
  const ESTABLISHMENT_ID_FOR_TESTING = 1; // <<-- COLOQUE AQUI O ID DO SEU ESTABELECIMENTO DE TESTE

  useEffect(() => {
    if (isAuthenticated && ESTABLISHMENT_ID_FOR_TESTING) {
      const fetchServices = async () => {
        setIsLoadingServices(true);
        setServicesError('');
        try {
          const data = await getServicesByEstablishment(ESTABLISHMENT_ID_FOR_TESTING);
          setServices(data);
        } catch (error) {
          console.error("Erro ao buscar serviços:", error);
          setServicesError(error.detail || error.message || 'Falha ao carregar serviços.');
        } finally {
          setIsLoadingServices(false);
        }
      };
      fetchServices();
    }
  }, [isAuthenticated]); // Dependência: re-busca se o estado de autenticação mudar

  const handleCreateService = async (event) => {
    event.preventDefault();
    setCreateServiceError('');
    setIsCreatingService(true);

    const serviceData = {
      name: newServiceName,
      description: newServiceDescription || null, // Envia null se a descrição for vazia
      price: parseFloat(newServicePrice), // Converte para float
      duration_minutes: parseInt(newServiceDuration, 10), // Converte para int
      is_active: true // Por padrão, criamos como ativo
    };

    // Validação básica no frontend (pode ser mais robusta)
    if (!serviceData.name || !serviceData.price || !serviceData.duration_minutes) {
      setCreateServiceError('Nome, preço e duração são obrigatórios.');
      setIsCreatingService(false);
      return;
    }
    if (isNaN(serviceData.price) || isNaN(serviceData.duration_minutes)) {
      setCreateServiceError('Preço e duração devem ser números.');
      setIsCreatingService(false);
      return;
    }

    console.log("Enviando para criar serviço:", serviceData);

    try {
      const newService = await createServiceForEstablishment(ESTABLISHMENT_ID_FOR_TESTING, serviceData);
      setServices(prevServices => [newService, ...prevServices]); // Adiciona o novo serviço no início da lista

      // Limpa os campos do formulário
      setNewServiceName('');
      setNewServiceDescription('');
      setNewServicePrice('');
      setNewServiceDuration('');
      alert('Serviço adicionado com sucesso!');

    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      setCreateServiceError(error.detail || error.message || 'Falha ao criar serviço.');
    } finally {
      setIsCreatingService(false);
    }
  };



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  console.log('Token no Dashboard (do AuthContext):', token);
  console.log('Autenticado no Dashboard (do AuthContext)?', isAuthenticated);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-700">
          Logout
        </Button>
      </div>

      {isAuthenticated ? (
        <div>
          <p className="mb-4">Bem-vindo! Você está logado.</p>

          {/* Seção de Serviços */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Seus Serviços</h2>
            {isLoadingServices && <p>Carregando serviços...</p>}
            {servicesError && <p className="text-red-500">Erro: {servicesError}</p>}
            {!isLoadingServices && !servicesError && services.length === 0 && (
              <p>Você ainda não cadastrou nenhum serviço.</p>
            )}


            {!isLoadingServices && !servicesError && services.length > 0 && (
              <ul className="list-disc pl-5 space-y-2">
                {services.map(service => (
                  <li key={service.id} className="p-2 border rounded shadow-sm">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    {service.description && <p className="text-sm text-gray-600">{service.description}</p>}
                    <p className="text-sm">Duração: {service.duration_minutes} minutos</p>
                    <p className="text-sm">Preço: R$ {service.price.toFixed(2)}</p>
                    <p className="text-sm">Status: {service.is_active ? 'Ativo' : 'Inativo'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Seção para Adicionar Novo Serviço */}
          <div className="mt-10 pt-6 border-t">
            <h2 className="text-2xl font-semibold mb-3">Adicionar Novo Serviço</h2>
            {createServiceError && <p className="text-red-500 text-sm mb-4">{createServiceError}</p>}
            <form onSubmit={handleCreateService} className="space-y-4">
              <InputField
                label="Nome do Serviço"
                type="text"
                name="newServiceName"
                placeholder="Ex: Banho e Tosa Completo"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                disabled={isCreatingService}
                required // Marca o campo como obrigatório no HTML5
              />
              <InputField
                label="Descrição (Opcional)"
                type="text" // Ou <textarea /> se preferir um campo maior
                name="newServiceDescription"
                placeholder="Detalhes do serviço"
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                disabled={isCreatingService}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Preço (R$)"
                  type="number"
                  name="newServicePrice"
                  placeholder="Ex: 75.50"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  disabled={isCreatingService}
                  step="0.01" // Para permitir decimais
                  required
                />
                <InputField
                  label="Duração (minutos)"
                  type="number"
                  name="newServiceDuration"
                  placeholder="Ex: 60"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  disabled={isCreatingService}
                  required
                />
              </div>
              <Button type="submit" className="bg-green-500 hover:bg-green-700" disabled={isCreatingService}>
                {isCreatingService ? 'Adicionando...' : 'Adicionar Serviço'}
              </Button>
            </form>
          </div>

        </div>
      ) : (
        // Este trecho não deveria ser alcançado se a rota estiver protegida corretamente
        <p>Você não está logado. Por favor, <a href="/login" className="text-blue-500 hover:text-blue-700">faça login</a>.</p>
      )}
    </div>
  );
};

export default DashboardPage;

/*
Lógica: handleCreateService
- Previne o comportamento padrão do formulário.
- Monta o objeto serviceData com os valores dos estados do formulário (convertendo preço e duração para números).
- Faz uma validação básica no frontend.
- Chama createServiceForEstablishment (do seu serviceService.js, que precisará ser importado) passando o ESTABLISHMENT_ID_FOR_TESTING e os serviceData.
- Se sucesso: Adiciona o novo serviço retornado pela API ao início da lista de services no estado (para atualização imediata da UI), limpa os campos do formulário e mostra um alerta.
- Se erro: Define a mensagem de erro.
- Controla o estado isCreatingService.

Resumo das Mudanças: Seção para Adicionar Novo Serviço 

- Adicionamos estados no DashboardPage para controlar os campos do formulário de novo serviço e o estado de carregamento/erro da criação.
- Criamos a função handleCreateService que monta o payload, faz validações básicas, chama o serviço da API e atualiza a UI.
- Adicionamos o JSX do formulário, usando seus componentes InputField e Button, e conectando-os aos novos estados e à função handleCreateService.

*/
