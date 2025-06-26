import React, { useState, useEffect, useCallback } from 'react';
import {
  getProfessionalStats,
  getProfessionalAppointments,
  getProfessionalWorkingHours
} from '../../services/professionalService';
import { useToast } from '../common/Toast';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import { LoadingState } from '../common/LoadingStates';

const daysOfWeekMap = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const ProfessionalDetailsModal = ({ professional, services, onEdit }) => {
  const { showError } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [workingHours, setWorkingHours] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'services', label: 'Serviços' },
    { id: 'schedule', label: 'Horários' },
    { id: 'appointments', label: 'Agendamentos' }
  ];

  const loadProfessionalData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const promises = [];
      
      // Carregar dados baseado na aba ativa
      if (activeTab === 'overview') {
        promises.push(getProfessionalStats(professional.id));
      } else if (activeTab === 'schedule') {
        promises.push(getProfessionalWorkingHours(professional.id));
      } else if (activeTab === 'appointments') {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        promises.push(getProfessionalAppointments(professional.id, {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }));
      }

      const results = await Promise.all(promises);
      
      if (activeTab === 'overview') {
        setStats(results[0]);
      } else if (activeTab === 'schedule') {
        setWorkingHours(results[0]);
      } else if (activeTab === 'appointments') {
        setAppointments(results[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do profissional:', error);
      showError('Erro ao carregar dados do profissional');
    } finally {
      setIsLoading(false);
    }
  }, [professional?.id, activeTab, showError]);

  useEffect(() => {
    if (professional?.id) {
      loadProfessionalData();
    }
  }, [loadProfessionalData]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'warning', label: 'Pendente' },
      'confirmed': { variant: 'info', label: 'Confirmado' },
      'in_progress': { variant: 'primary', label: 'Em Andamento' },
      'completed': { variant: 'success', label: 'Concluído' },
      'cancelled': { variant: 'danger', label: 'Cancelado' },
      'no_show': { variant: 'secondary', label: 'Não Compareceu' }
    };
    
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header do profissional */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold text-xl">
              {getInitials(professional.name)}
            </span>
          </div>
          
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-secondary-900">
                {professional.name}
              </h2>
              <Badge variant={professional.is_active ? 'success' : 'secondary'}>
                {professional.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            
            <p className="text-lg text-primary-600 font-medium">
              {professional.specialty}
            </p>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-secondary-600">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{professional.email}</span>
              </div>
              
              {professional.phone && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{professional.phone}</span>
                </div>
              )}
            </div>

            {professional.description && (
              <p className="text-secondary-600 mt-3 max-w-2xl">
                {professional.description}
              </p>
            )}
          </div>
        </div>

        <Button onClick={onEdit} variant="outline">
          Editar Profissional
        </Button>
      </div>

      {/* Navegação por abas */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das abas */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <LoadingState message="Carregando dados..." />
        ) : (
          <>
            {/* Visão Geral */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-secondary-600">Total de Agendamentos</p>
                          <p className="text-2xl font-bold text-secondary-900">{stats.total_appointments || 0}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-success-100 rounded-lg">
                          <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-secondary-600">Concluídos</p>
                          <p className="text-2xl font-bold text-secondary-900">{stats.completed_appointments || 0}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-warning-100 rounded-lg">
                          <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-secondary-600">Receita Total</p>
                          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.total_revenue)}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-info-100 rounded-lg">
                          <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-secondary-600">Avaliação Média</p>
                          <p className="text-2xl font-bold text-secondary-900">
                            {stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="text-center text-secondary-500">
                  <p>Estatísticas detalhadas serão carregadas quando o backend estiver conectado.</p>
                </div>
              </div>
            )}

            {/* Serviços */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-secondary-900">
                    Serviços Realizados
                  </h3>
                  <Badge variant="outline">
                    {professional.services?.length || 0} serviços
                  </Badge>
                </div>

                {professional.services && professional.services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {professional.services.map((service) => (
                      <Card key={service.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-secondary-900">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-secondary-600 mt-1">{service.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span className="text-primary-600 font-medium">
                                {formatCurrency(service.price)}
                              </span>
                              <span className="text-secondary-600">
                                {service.duration} min
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">Nenhum serviço atribuído</h3>
                    <p className="mt-1 text-sm text-secondary-500">
                      Configure os serviços que este profissional pode realizar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Horários */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary-900">
                  Horários de Trabalho
                </h3>

                <div className="space-y-3">
                  {Object.entries(daysOfWeekMap).map(([key, label]) => {
                    const dayConfig = workingHours[key] || professional.working_hours?.[key];
                    
                    return (
                      <Card key={key} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${dayConfig?.is_active ? 'bg-success-500' : 'bg-secondary-300'}`} />
                            <span className="font-medium text-secondary-900">{label}</span>
                          </div>
                          
                          {dayConfig?.is_active ? (
                            <div className="flex items-center space-x-4 text-sm text-secondary-600">
                              <span>
                                {formatTime(dayConfig.start_time)} - {formatTime(dayConfig.end_time)}
                              </span>
                              {dayConfig.lunch_break_start_time && dayConfig.lunch_break_end_time && (
                                <span className="text-xs bg-secondary-100 px-2 py-1 rounded">
                                  Almoço: {formatTime(dayConfig.lunch_break_start_time)} - {formatTime(dayConfig.lunch_break_end_time)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary" size="sm">Não trabalha</Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agendamentos */}
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-secondary-900">
                    Agendamentos Recentes
                  </h3>
                  <Badge variant="outline">
                    {appointments.length} este mês
                  </Badge>
                </div>

                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.slice(0, 10).map((appointment) => (
                      <Card key={appointment.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-secondary-900">
                                {appointment.service?.name}
                              </h4>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <p className="text-sm text-secondary-600 mt-1">
                              Cliente: {appointment.customer_name} • {appointment.customer_phone}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-secondary-600">
                              <span>
                                {new Date(appointment.date).toLocaleDateString('pt-BR')}
                              </span>
                              <span>
                                {appointment.start_time} - {appointment.end_time}
                              </span>
                              {appointment.service?.price && (
                                <span className="text-primary-600 font-medium">
                                  {formatCurrency(appointment.service.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">Nenhum agendamento encontrado</h3>
                    <p className="mt-1 text-sm text-secondary-500">
                      Este profissional ainda não possui agendamentos neste período.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDetailsModal;
