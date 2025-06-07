// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import InputField from '../components/common/InputField'
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { getServicesByEstablishment, createServiceForEstablishment, updateService, deleteService } from '../services/serviceService';
import WorkingHoursForm from '../components/dashboard/WorkingHoursFrom'; // Importe o novo componente
import { getEstablishmentDetails, updateEstablishmentWorkingHours } from '../services/establishmentService'; // Importe as novas funções

// Definindo os dias da semana e o estado inicial para os dias
// Estes dados serão usados tanto no formulário de horários de funcionamento quanto na lógica de criação/edição de serviços
const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

// Estado inicial para um dia de funcionamento
// Este estado será usado para inicializar os dias no formulário de horários de funcionamento
const initialDayState = {
  is_active: false,
  start_time: '',
  end_time: '',
  lunch_break_start_time: '',
  lunch_break_end_time: '',
};


const DashboardPage = () => {
  const { token, logout, isAuthenticated, currentUser, isLoadingUser } = useAuth();
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
  // Novos estados para controle de edição
  const [isEditing, setIsEditing] = useState(false); // Novo estado: true se estivermos editando, false se adicionando
  const [editingServiceId, setEditingServiceId] = useState(null); // Novo estado: ID do serviço que está sendo editado
  // Estados para controle de exclusão
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [deleteServiceError, setDeleteServiceError] = useState('');
  // Novos estados para controle de horários de funcionamento
  // Estes estados serão usados para buscar e salvar a configuração de horários de funcionamento do estabelecimento
  const [workingHoursConfig, setWorkingHoursConfig] = useState(null); // Para guardar a config de horários
  const [isLoadingWorkingHours, setIsLoadingWorkingHours] = useState(false); // Para o loading da busca de horários
  const [workingHoursError, setWorkingHoursError] = useState(''); // Para erros na busca/salvamento de horários
  const [isSavingHours, setIsSavingHours] = useState(false); // Para o loading do salvamento de horários
  // Defina o ID do estabelecimento para teste por enquanto
  // No futuro, este ID virá do usuário logado/AuthContext


  useEffect(() => {
    const fetchData = async () => {
      // Só busca os dados se estiver autenticado, o usuário estiver carregado, e tiver um ID de estabelecimento
      if (isAuthenticated && currentUser && currentUser.establishment?.id) {
        const establishmentId = currentUser.establishment.id;

        // Buscar Serviços
        setIsLoadingServices(true);
        setServicesError('');
        try {
          const servicesData = await getServicesByEstablishment(establishmentId);
          setServices(servicesData);
        } catch (error) {
          console.error("Erro ao buscar serviços:", error);
          setServicesError(error.detail || error.message || 'Falha ao carregar serviços.');
        } finally {
          setIsLoadingServices(false);
        }

        // Buscar Configuração de Horários do Estabelecimento
        setIsLoadingWorkingHours(true);
        setWorkingHoursError('');
        try {
          // Se getEstablishmentDetails retorna o objeto completo, já temos working_hours_config
          // Se não, podemos pegar de currentUser.establishment se o backend já o populou
          // Assumindo que currentUser.establishment tem a estrutura completa
          // ou que getEstablishmentDetails ainda é necessário se currentUser.establishment só tem id/name.
          // Para simplificar, se currentUser.establishment já tiver working_hours_config:
          if (currentUser.establishment.working_hours_config) {
            setWorkingHoursConfig(currentUser.establishment.working_hours_config);
          } else {
            // Se não, podemos buscar ou usar um default.
            // Se o endpoint /users/me já retorna working_hours_config dentro de establishment, melhor ainda.
            // Vamos assumir por enquanto que o objeto currentUser.establishment já contém working_hours_config
            // Se não, precisaríamos de getEstablishmentDetails(establishmentId) aqui.
            // Vou ajustar o AuthContext para guardar o establishment inteiro ou apenas o id.
            // Para agora, vamos supor que working_hours_config está em currentUser.establishment.

            // Caso o working_hours_config não venha populado em currentUser.establishment:
            const establishmentData = await getEstablishmentDetails(establishmentId);
            if (establishmentData && establishmentData.working_hours_config) {
              setWorkingHoursConfig(establishmentData.working_hours_config);
            } else {
              const defaultConfig = {};
              daysOfWeek.forEach(day => {
                defaultConfig[day.key] = { ...initialDayState };
              });
              defaultConfig.appointment_interval_minutes = 30;
              setWorkingHoursConfig(defaultConfig);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar/configurar horários:", error);
          setWorkingHoursError(error.detail || error.message || 'Falha ao carregar/configurar horários.');
        } finally {
          setIsLoadingWorkingHours(false);
        }
      }
    };

    if (!isLoadingUser) { // Só roda fetchData depois que tentamos carregar o usuário
      fetchData();
    }
    // Adicionamos currentUser e isLoadingUser como dependências
  }, [isAuthenticated, currentUser, isLoadingUser]);


  // Em DashboardPage.js
  const handleCreateService = async (event) => {
    event.preventDefault();
    setCreateServiceError('');
    if (!newServiceName || !newServicePrice || !newServiceDuration) {
      setCreateServiceError('Nome, preço e duração são obrigatórios.');
      return;
    }
    if (!currentUser?.establishment?.id) {
      setCreateServiceError("Não foi possível identificar o estabelecimento do usuário.");
      return;
    }

    setIsCreatingService(true);
    const serviceData = {
      name: newServiceName,
      description: newServiceDescription || null,
      price: parseFloat(newServicePrice),
      duration_minutes: parseInt(newServiceDuration, 10),
      is_active: true
    };

    try {
      const establishmentId = currentUser.establishment.id; // Agora establishmentId está sendo usado
      const newService = await createServiceForEstablishment(establishmentId, serviceData);
      setServices(prevServices => [newService, ...prevServices]);
      handleCancelEdit(); // Usamos para limpar o formulário e resetar
      alert('Serviço adicionado com sucesso!');
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      setCreateServiceError(error.detail || error.message || 'Falha ao criar serviço.');
    } finally {
      setIsCreatingService(false);
    }
  };

  // Função para iniciar a edição de um serviço
  // Esta função será chamada quando o usuário clicar em "Editar" em um serviço
  const handleStartEdit = (serviceToEdit) => {
    setIsEditing(true); // Entra no modo de edição
    setEditingServiceId(serviceToEdit.id); // Guarda o ID do serviço

    // Preenche os campos do formulário com os dados do serviço selecionado
    setNewServiceName(serviceToEdit.name);
    setNewServiceDescription(serviceToEdit.description || ''); // Garante que não seja null
    setNewServicePrice(serviceToEdit.price.toString()); // Converte para string para o input number
    setNewServiceDuration(serviceToEdit.duration_minutes.toString()); // Converte para string
    // Você pode querer limpar o createServiceError aqui também
    setCreateServiceError('');

    // Opcional: rolar a tela para o formulário, se ele estiver longe
    // window.scrollTo({ top: document.getElementById('service-form-section').offsetTop, behavior: 'smooth' });
  };

  // Função para atualizar um serviço
  // Esta função será chamada quando o usuário submeter o formulário de edição
  // Ela reutiliza a lógica de criação, mas com o ID do serviço a ser atualizado
  // Lógica: Similar ao handleCreateService, mas chama updateService e atualiza o serviço existente na lista do estado services.
  // A função handleCancelEdit é útil para limpar o formulário e voltar ao modo de adição.
  const handleUpdateService = async (event) => {
    event.preventDefault();
    if (!editingServiceId) return; // Não deveria acontecer, mas por segurança

    setCreateServiceError(''); // Reutilizando o estado de erro
    setIsCreatingService(true); // Reutilizando o estado de loading

    const updatedServiceData = {
      name: newServiceName,
      description: newServiceDescription || null,
      price: parseFloat(newServicePrice),
      duration_minutes: parseInt(newServiceDuration, 10),
      // is_active: você pode querer adicionar um campo para isso no formulário também
    };

    // Validação básica
    if (!updatedServiceData.name || !updatedServiceData.price || !updatedServiceData.duration_minutes) {
      setCreateServiceError('Nome, preço e duração são obrigatórios.');
      setIsCreatingService(false);
      return;
    }
    if (isNaN(updatedServiceData.price) || isNaN(updatedServiceData.duration_minutes)) {
      setCreateServiceError('Preço e duração devem ser números.');
      setIsCreatingService(false);
      return;
    }

    try {
      const updatedService = await updateService(editingServiceId, updatedServiceData);
      // Atualiza a lista de serviços no estado
      setServices(prevServices =>
        prevServices.map(s => (s.id === editingServiceId ? updatedService : s))
      );

      alert('Serviço atualizado com sucesso!');
      handleCancelEdit(); // Limpa o formulário e sai do modo de edição

    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      setCreateServiceError(error.detail || error.message || 'Falha ao atualizar serviço.');
    } finally {
      setIsCreatingService(false);
    }
  };

  // Função para cancelar a edição e limpar o formulário
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServiceDescription('');
    setNewServicePrice('');
    setNewServiceDuration('');
    setCreateServiceError('');
  };

  const handleAttemptDelete = (serviceId) => {
    setDeletingServiceId(serviceId);
    setShowDeleteConfirmModal(true);
    setDeleteServiceError(''); // Limpa erros anteriores
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setDeletingServiceId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingServiceId) return;

    setIsDeletingService(true);
    setDeleteServiceError('');

    try {
      await deleteService(deletingServiceId); // Chama a API para deletar
      // Atualiza a lista de serviços no estado, removendo o serviço deletado
      setServices(prevServices =>
        prevServices.filter(s => s.id !== deletingServiceId)
      );
      alert('Serviço excluído com sucesso!');
      handleCancelDelete(); // Fecha o modal e reseta os IDs

    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      setDeleteServiceError(error.detail || error.message || 'Falha ao excluir serviço.');
      // Poderia mostrar o erro no modal ou como um alerta geral
      alert(`Erro ao excluir: ${error.detail || error.message || 'Falha ao excluir serviço.'}`);
    } finally {
      setIsDeletingService(false);
    }
  };

  // Função para salvar a configuração de horários de funcionamento
  // Esta função será chamada pelo WorkingHoursForm quando o usuário clicar em "Salvar"
  // Em DashboardPage.js
  const handleSaveWorkingHours = async (configDataToSave) => {
    if (!currentUser?.establishment?.id) {
      setWorkingHoursError("Não foi possível identificar o estabelecimento do usuário para salvar horários.");
      return;
    }

    setIsSavingHours(true); // Agora setIsSavingHours está sendo usado
    setWorkingHoursError('');

    try {
      const establishmentId = currentUser.establishment.id; // Agora establishmentId está sendo usado
      const updatedEstablishment = await updateEstablishmentWorkingHours(
        establishmentId,
        configDataToSave
      );
      setWorkingHoursConfig(updatedEstablishment.working_hours_config);
      alert('Horários de atendimento salvos com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar horários:", error);
      setWorkingHoursError(error.detail || error.message || 'Falha ao salvar horários.');
      alert(`Erro ao salvar horários: ${error.detail || error.message || 'Falha ao salvar horários.'}`);
    } finally {
      setIsSavingHours(false); // E aqui também
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
                    <Button
                      onClick={() => handleStartEdit(service)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded mt-2"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleAttemptDelete(service.id)}
                      className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded mt-2 ml-2" // Adicionei ml-2 para espaçamento
                    >
                      Excluir
                    </Button>
                  </li>


                ))}
              </ul>
            )}
          </div>

          {/* Seção para Adicionar Novo Serviço */}
          <div id="service-form-section" className="mt-10 pt-6 border-t">
            <div className="mt-10 pt-6 border-t">
              <h2 className="text-2xl font-semibold mb-3">
                {isEditing ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
              </h2>
              {createServiceError && <p className="text-red-500 text-sm mb-4">{createServiceError}</p>}
              <form onSubmit={isEditing ? handleUpdateService : handleCreateService} className="space-y-4">
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
                <Button type="submit" className={isEditing ? "bg-orange-500 hover:bg-orange-700" : "bg-green-500 hover:bg-green-700"} disabled={isCreatingService}>
                  {isCreatingService ? (isEditing ? 'Salvando...' : 'Adicionando...') : (isEditing ? 'Salvar Alterações' : 'Adicionar Serviço')}
                </Button>
                {isEditing && (
                  <Button type="button" onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-700 ml-2" disabled={isCreatingService}>
                    Cancelar Edição
                  </Button>
                )}
              </form>
            </div>
          </div>

        </div>
      ) : (
        // Este trecho não deveria ser alcançado se a rota estiver protegida corretamente
        <p>Você não está logado. Por favor, <a href="/login" className="text-blue-500 hover:text-blue-700">faça login</a>.</p>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="p-8 border w-96 shadow-lg rounded-md bg-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 mt-2 mb-4">
                Você tem certeza que deseja excluir este serviço? <br />
                Esta ação não pode ser desfeita.
              </p>
              {deleteServiceError && <p className="text-red-500 text-sm mb-4">{deleteServiceError}</p>}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleCancelDelete}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                  disabled={isDeletingService}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isDeletingService}
                >
                  {isDeletingService ? 'Excluindo...' : 'Confirmar Exclusão'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Configuração de Horários de Atendimento */}
      <div className="mt-10 pt-6 border-t">
        {isLoadingWorkingHours && <p>Carregando configuração de horários...</p>}
        {/* Só renderiza o formulário se workingHoursConfig não for null (ou seja, após a busca inicial).
            Isso garante que o formulário receba o initialConfig corretamente.
          */}
        {!isLoadingWorkingHours && workingHoursConfig && (
          <WorkingHoursForm
            initialConfig={workingHoursConfig}
            onSave={handleSaveWorkingHours}
            isLoading={isSavingHours}
            error={workingHoursError} // Passando o erro específico do salvamento de horários
          />
        )}
        {/* Se workingHoursError tiver um erro da busca inicial, você pode exibi-lo aqui também */}
        {!isLoadingWorkingHours && servicesError && !workingHoursConfig && ( // Ajuste: erro da busca de config
          <p className="text-red-500">Erro ao carregar configuração de horários: {workingHoursError}</p>
        )}
      </div>

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

Edição de Serviços
- Importante: Se o seu formulário de adicionar serviço estiver em um componente modal separado, a lógica de handleStartEdit seria para abrir o modal e passar os dados do serviceToEdit para ele. Como estamos reutilizando o formulário que já está na página, apenas preenchemos os estados e mudamos o modo.
- Dei um ID service-form-section à div do formulário (veja no Passo 5) para um scroll opcional.

Resumo das Mudanças: Edição de Serviços
- Novos estados isEditing e editingServiceId.
- Botão "Editar" em cada serviço listado.
- Função handleStartEdit para popular o formulário e entrar no modo de edição.
- Função handleUpdateService para enviar as atualizações para a API.
- Função handleCancelEdit para limpar o formulário e sair do modo de edição.
- Formulário e botão de submit adaptados para funcionar tanto para criar quanto para editar.


Exclusão de Serviços
- handleAttemptDelete(serviceId): Chamada quando o botão "Excluir" é clicado. Ela vai guardar o ID do serviço a ser excluído e abrir o modal de confirmação.
- handleConfirmDelete(): Chamada quando o usuário confirma a exclusão no modal. Ela chamará o serviço da API.
- handleCancelDelete(): Chamada para fechar o modal sem excluir.
*/
