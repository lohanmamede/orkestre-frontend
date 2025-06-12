import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getServicesByEstablishment, createServiceForEstablishment, updateService, deleteService } from '../services/serviceService';
import WorkingHoursForm from '../components/dashboard/WorkingHoursFrom';
import { getEstablishmentDetails, updateEstablishmentWorkingHours } from '../services/establishmentService';
import AgendaView from '../components/dashboard/AgendaView';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Container from '../components/common/Container';
import Alert from '../components/common/Alert';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { LoadingState } from '../components/common/Loading';

// Definindo os dias da semana e o estado inicial para os dias
const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

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

  // Estados existentes
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [createServiceError, setCreateServiceError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [deleteServiceError, setDeleteServiceError] = useState('');
  const [workingHoursConfig, setWorkingHoursConfig] = useState(null);
  const [isLoadingWorkingHours, setIsLoadingWorkingHours] = useState(false);
  const [workingHoursError, setWorkingHoursError] = useState('');
  const [isSavingHours, setIsSavingHours] = useState(false);

  // Novo estado para controle da aba ativa
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { id: 'services', label: 'Serviços', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'schedule', label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'settings', label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  useEffect(() => {
    const fetchData = async () => {
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

        // Buscar Configuração de Horários
        setIsLoadingWorkingHours(true);
        setWorkingHoursError('');
        try {
          if (currentUser.establishment.working_hours_config) {
            setWorkingHoursConfig(currentUser.establishment.working_hours_config);
          } else {
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

    if (!isLoadingUser) {
      fetchData();
    }
  }, [isAuthenticated, currentUser, isLoadingUser]);

  // Funções existentes
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
      const establishmentId = currentUser.establishment.id;
      const newService = await createServiceForEstablishment(establishmentId, serviceData);
      setServices(prevServices => [newService, ...prevServices]);
      handleCancelEdit();
      alert('Serviço adicionado com sucesso!');
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      setCreateServiceError(error.detail || error.message || 'Falha ao criar serviço.');
    } finally {
      setIsCreatingService(false);
    }
  };

  const handleStartEdit = (serviceToEdit) => {
    setIsEditing(true);
    setEditingServiceId(serviceToEdit.id);
    setNewServiceName(serviceToEdit.name);
    setNewServiceDescription(serviceToEdit.description || '');
    setNewServicePrice(serviceToEdit.price.toString());
    setNewServiceDuration(serviceToEdit.duration_minutes.toString());
    setCreateServiceError('');
  };

  const handleUpdateService = async (event) => {
    event.preventDefault();
    if (!editingServiceId) return;

    setCreateServiceError('');
    setIsCreatingService(true);

    const updatedServiceData = {
      name: newServiceName,
      description: newServiceDescription || null,
      price: parseFloat(newServicePrice),
      duration_minutes: parseInt(newServiceDuration, 10),
    };

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
      setServices(prevServices =>
        prevServices.map(s => (s.id === editingServiceId ? updatedService : s))
      );
      alert('Serviço atualizado com sucesso!');
      handleCancelEdit();
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      setCreateServiceError(error.detail || error.message || 'Falha ao atualizar serviço.');
    } finally {
      setIsCreatingService(false);
    }
  };

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
    setDeleteServiceError('');
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
      await deleteService(deletingServiceId);
      setServices(prevServices =>
        prevServices.filter(s => s.id !== deletingServiceId)
      );
      alert('Serviço excluído com sucesso!');
      handleCancelDelete();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      setDeleteServiceError(error.detail || error.message || 'Falha ao excluir serviço.');
      alert(`Erro ao excluir: ${error.detail || error.message || 'Falha ao excluir serviço.'}`);
    } finally {
      setIsDeletingService(false);
    }
  };

  const handleSaveWorkingHours = async (configDataToSave) => {
    if (!currentUser?.establishment?.id) {
      setWorkingHoursError("Não foi possível identificar o estabelecimento do usuário para salvar horários.");
      return;
    }

    setIsSavingHours(true);
    setWorkingHoursError('');

    try {
      const establishmentId = currentUser.establishment.id;
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
      setIsSavingHours(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  console.log('Token no Dashboard (do AuthContext):', token);
  console.log('Autenticado no Dashboard (do AuthContext)?', isAuthenticated);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 shadow-soft">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-secondary-900">
                  {currentUser?.establishment?.name || 'Gestão de Agendamentos'}
                </h1>
                <p className="text-sm text-secondary-600">
                  Bem-vindo de volta, {currentUser?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span>Online</span>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-8 mt-4 border-t border-secondary-100 pt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </Container>
      </header>

      <Container className="py-8">
        {isAuthenticated ? (
          <div className="space-y-6">
            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card padding="md">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">Agendamentos Hoje</p>
                        <p className="text-2xl font-bold text-secondary-900">0</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">Serviços Ativos</p>
                        <p className="text-2xl font-bold text-secondary-900">{services.length}</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">Próximo Agendamento</p>
                        <p className="text-lg font-semibold text-secondary-900">--:--</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">Faturamento Hoje</p>
                        <p className="text-lg font-semibold text-secondary-900">R$ 0,00</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Ações Rápidas</h3>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => setActiveTab('services')} 
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Adicionar Novo Serviço
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('schedule')} 
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Ver Agenda Completa
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('settings')} 
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        </svg>
                        Configurar Horários
                      </Button>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Agendamentos Recentes</h3>
                    <div className="space-y-3">
                      <div className="text-center py-8 text-secondary-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Nenhum agendamento recente</p>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Resumo dos Serviços</h3>
                    <div className="space-y-3">
                      {services.length === 0 ? (
                        <div className="text-center py-8 text-secondary-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <p>Nenhum serviço cadastrado</p>
                        </div>
                      ) : (
                        services.slice(0, 3).map(service => (
                          <div key={service.id} className="flex justify-between items-center py-2 border-b border-secondary-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-secondary-900">{service.name}</p>
                              <p className="text-xs text-secondary-500">R$ {service.price.toFixed(2)}</p>
                            </div>
                            <Badge variant={service.is_active ? 'success' : 'error'}>
                              {service.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        ))
                      )}
                      {services.length > 3 && (
                        <Button 
                          onClick={() => setActiveTab('services')} 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-3"
                        >
                          Ver todos os serviços
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-secondary-900">Gerenciar Serviços</h2>
                  <Button onClick={() => {
                    setIsEditing(false);
                    setNewServiceName('');
                    setNewServiceDescription('');
                    setNewServicePrice('');
                    setNewServiceDuration('');
                  }}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Novo Serviço
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Services List */}
                  <Card>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-6">Serviços Cadastrados</h3>
                    
                    {isLoadingServices ? (
                      <LoadingState message="Carregando serviços..." />
                    ) : servicesError ? (
                      <Alert type="error">{servicesError}</Alert>
                    ) : services.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-secondary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 8v6a2 2 0 002 2h4a2 2 0 002-2V8M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-secondary-900 mb-2">Nenhum serviço cadastrado</h3>
                        <p className="text-secondary-600 mb-4">Comece cadastrando seus primeiros serviços</p>
                        <Button variant="primary" onClick={() => setIsEditing(false)}>
                          Cadastrar Primeiro Serviço
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {services.map(service => (
                          <div key={service.id} className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <h3 className="text-lg font-semibold text-secondary-900 mr-3">{service.name}</h3>
                                  <Badge variant={service.is_active ? 'success' : 'error'}>
                                    {service.is_active ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </div>
                                {service.description && (
                                  <p className="text-secondary-600 mb-3">{service.description}</p>
                                )}
                                <div className="flex items-center space-x-6 text-sm text-secondary-600">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {service.duration_minutes} min
                                  </div>
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    R$ {service.price.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleStartEdit(service)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Editar
                                </Button>
                                <Button
                                  onClick={() => handleAttemptDelete(service.id)}
                                  variant="error"
                                  size="sm"
                                >
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Service Form */}
                  <Card>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-6">
                      {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
                    </h3>
                    
                    {createServiceError && (
                      <Alert type="error" className="mb-6">{createServiceError}</Alert>
                    )}

                    <form onSubmit={isEditing ? handleUpdateService : handleCreateService} className="space-y-6">
                      <InputField
                        label="Nome do Serviço"
                        type="text"
                        name="newServiceName"
                        placeholder="Ex: Corte de Cabelo"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        disabled={isCreatingService}
                        required
                      />

                      <InputField
                        label="Descrição (Opcional)"
                        name="newServiceDescription"
                        placeholder="Descreva os detalhes do serviço"
                        value={newServiceDescription}
                        onChange={(e) => setNewServiceDescription(e.target.value)}
                        disabled={isCreatingService}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Preço (R$)"
                          type="number"
                          name="newServicePrice"
                          placeholder="0,00"
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          disabled={isCreatingService}
                          step="0.01"
                          required
                        />

                        <InputField
                          label="Duração (minutos)"
                          type="number"
                          name="newServiceDuration"
                          placeholder="60"
                          value={newServiceDuration}
                          onChange={(e) => setNewServiceDuration(e.target.value)}
                          disabled={isCreatingService}
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        {isEditing && (
                          <Button 
                            type="button" 
                            onClick={handleCancelEdit} 
                            variant="outline"
                            disabled={isCreatingService}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          variant={isEditing ? "warning" : "success"}
                          loading={isCreatingService}
                          disabled={isCreatingService}
                        >
                          {isCreatingService 
                            ? (isEditing ? 'Salvando...' : 'Adicionando...') 
                            : (isEditing ? 'Salvar Alterações' : 'Adicionar Serviço')
                          }
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-secondary-900">Agenda de Agendamentos</h2>
                  <Button>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Novo Agendamento
                  </Button>
                </div>

                <Card>
                  <AgendaView />
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-secondary-900">Configurações</h2>
                </div>

                <Card>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-6">Horários de Funcionamento</h3>
                  
                  {isLoadingWorkingHours && <LoadingState message="Carregando configuração de horários..." />}
                  
                  {!isLoadingWorkingHours && workingHoursConfig && (
                    <WorkingHoursForm
                      initialConfig={workingHoursConfig}
                      onSave={handleSaveWorkingHours}
                      isLoading={isSavingHours}
                      error={workingHoursError}
                    />
                  )}
                  
                  {!isLoadingWorkingHours && servicesError && !workingHoursConfig && (
                    <Alert type="error">Erro ao carregar configuração de horários: {workingHoursError}</Alert>
                  )}
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Alert type="warning">
              Você não está logado. <a href="/login" className="text-primary-600 hover:text-primary-700 underline">Faça login</a> para acessar o dashboard.
            </Alert>
          </div>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={handleCancelDelete}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-secondary-600 mb-6">
            Você tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
          </p>
          
          {deleteServiceError && (
            <Alert type="error" className="mb-4">
              {deleteServiceError}
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleCancelDelete}
              variant="outline"
              disabled={isDeletingService}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="error"
              loading={isDeletingService}
              disabled={isDeletingService}
              className="flex-1"
            >
              {isDeletingService ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
