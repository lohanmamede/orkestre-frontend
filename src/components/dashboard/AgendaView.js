// src/components/dashboard/AgendaView.js
import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO, startOfDay, addWeeks, subWeeks, addMonths, subMonths, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useAuth } from '../../contexts/AuthContext';
import { getAppointmentsByEstablishment, updateAppointmentStatus } from '../../services/appointmentService';
import { getServicesByEstablishment } from '../../services/serviceService';
import { validateStatusTransition, getAllowedTransitions, AppointmentStatus, STATUS_LABELS, STATUS_COLORS, STATUS_CLASSES } from '../../services/statusValidationService';
import { useToast } from '../common/Toast';
import ConfirmationModal from '../common/ConfirmationModal';
import CancellationModal from '../common/CancellationModal';
import RescheduleModal from '../common/RescheduleModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatCustomerName, formatPhone, formatTime } from '../../utils/formatters';
import '../../styles/agenda.css';

const AgendaView = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('month'); // 'week', 'month', 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayViewType, setDayViewType] = useState('cards'); // 'cards' ou 'timeline'  // Estado para o modal de confirmação
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmButtonText: 'Confirmar',
    confirmButtonColor: 'blue',
    onConfirm: () => {}
  });
  
  // Estado para o modal de cancelamento
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    appointmentId: null
  });
  
  // Estado para o modal de reagendamento
  const [rescheduleModal, setRescheduleModal] = useState({
    isOpen: false,
    appointmentId: null
  });
  
  // Estado para o modal de detalhes do agendamento
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    appointment: null
  });
  
  // Hook para exibir toast notifications
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  // Buscar agendamentos e serviços
  useEffect(() => {
    if (currentUser?.establishment?.id) {
      const establishmentId = currentUser.establishment.id;
      setIsLoading(true);      // Buscar agendamentos e serviços em paralelo
      Promise.all([
        getAppointmentsByEstablishment(establishmentId),
        getServicesByEstablishment(establishmentId)
      ])
        .then(([appointmentsData, servicesData]) => {
          // Mapear serviços por ID para lookup rápido
          const servicesMap = servicesData.reduce((acc, service) => {
            acc[service.id] = service;
            return acc;
          }, {});
          
          setServices(servicesData);
          setAppointments(appointmentsData);
        })
        .catch(err => {
          setError('Falha ao carregar a agenda.');
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentUser]);
  // Função para obter dados do serviço
  const getServiceForAppointment = (appointment) => {
    if (appointment.service) {
      // Se já tem o objeto service (dados do backend com joinedload)
      return appointment.service;
    }
    if (appointment.service_id) {
      // Busca no cache local de serviços
      return services.find(service => service.id === appointment.service_id);
    }
    return null;
  };
  // Métricas calculadas
  const metrics = useMemo(() => {
    const today = startOfDay(new Date());
    const todayAppointments = appointments.filter(appt => 
      isSameDay(parseISO(appt.start_time), today)
    );
    
    const thisWeekStart = startOfWeek(today, { locale: ptBR });
    const thisWeekEnd = endOfWeek(today, { locale: ptBR });
    const thisWeekAppointments = appointments.filter(appt => {
      const apptDate = parseISO(appt.start_time);
      return apptDate >= thisWeekStart && apptDate <= thisWeekEnd;
    });

    const pendingCount = appointments.filter(appt => appt.status === 'pending').length;
    const confirmedToday = todayAppointments.filter(appt => appt.status === 'confirmed').length;
      return {
      today: todayAppointments.length,
      thisWeek: thisWeekAppointments.length,
      pending: pendingCount,
      confirmedToday,
      totalRevenue: thisWeekAppointments.reduce((sum, appt) => {
        const service = getServiceForAppointment(appt);
        return appt.status === 'completed' ? sum + (service?.price || 0) : sum;
      }, 0)
    };
  }, [appointments, getServiceForAppointment]);

  // Agrupamento de agendamentos por data
  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    appointments.forEach(appt => {
      const dateKey = format(parseISO(appt.start_time), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appt);
    });
    return grouped;
  }, [appointments]);  // Função para calcular distribuição dinâmica baseada no contexto
  const calculateDynamicRanges = (counts) => {
    if (counts.length === 0) return [0, 1, 2, 3, 4];
    
    const validCounts = counts.filter(count => count > 0);
    if (validCounts.length === 0) return [0, 1, 2, 3, 4];
    
    const maxCount = Math.max(...validCounts);
    const minCount = Math.min(...validCounts);
    
    // Encontrar o primeiro múltiplo de 5 após o valor máximo
    const maxMultipleOf5 = Math.ceil(maxCount / 5) * 5;
    
    // Se o múltiplo de 5 for muito pequeno (≤ 5), usar pelo menos 5
    const finalMax = Math.max(maxMultipleOf5, 5);
    
    // Dividir em 5 ranges uniformes
    const step = finalMax / 5;
    
    return [
      0,
      step,
      step * 2,
      step * 3,
      step * 4
    ];
  };

  // Calcular ranges dinâmicos para dias do mês atual
  const getMonthDayRanges = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const dayCounts = monthDays.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return (appointmentsByDate[dateKey] || []).length;
    });
    
    return calculateDynamicRanges(dayCounts);
  }, [currentDate, appointmentsByDate]);

  // Função para obter densidade de agendamentos
  const getDateIntensity = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAppointments = appointmentsByDate[dateKey] || [];
    const count = dayAppointments.length;
    const [r0, r1, r2, r3, r4] = getMonthDayRanges;
    
    if (count === 0) return '';
    if (count >= r1 && count < r2) return 'bg-primary-50 text-primary-700';
    if (count >= r2 && count < r3) return 'bg-primary-200 text-primary-800';
    if (count >= r3 && count < r4) return 'bg-primary-400 text-white';
    if (count >= r4) return 'bg-primary-600 text-white font-bold';
    return 'bg-primary-50 text-primary-700';
  };
  
  const handleStatusChange = async (appointmentId, newStatus) => {
    // Tratamento especial para o botão de cancelamento unificado
    if (newStatus === "SHOW_CANCEL_MODAL") {
      setCancelModal({
        isOpen: true,
        appointmentId: appointmentId
      });
      return;
    }
    
    // Tratamento para o reagendamento
    if (newStatus === "SHOW_RESCHEDULE_MODAL") {
      setRescheduleModal({
        isOpen: true,
        appointmentId: appointmentId
      });
      return;
    }
    
    // Encontrar o agendamento atual
    const appointment = appointments.find(appt => appt.id === appointmentId);
    if (!appointment) {
      showError('Agendamento não encontrado');
      return;
    }
    
    // Validar a transição de status
    const validation = validateStatusTransition(appointment, newStatus);
    if (!validation.valid) {
      // Se a transição for inválida, mostrar mensagem de erro
      showError(validation.message);
      return;
    }
    
    if (validation.type === 'warning') {
      // Se precisar de confirmação, mostrar modal
      setConfirmModal({
        isOpen: true,
        title: 'Confirmar alteração de status',
        message: validation.message,
        confirmButtonText: 'Sim, continuar',
        confirmButtonColor: newStatus.includes('cancel') ? 'red' : 
                            newStatus === AppointmentStatus.NO_SHOW ? 'yellow' : 'blue',
        onConfirm: () => performStatusChange(appointmentId, newStatus)
      });
      return;
    }
    
    // Se não precisar de confirmação, realizar a mudança diretamente
    performStatusChange(appointmentId, newStatus);
  };
  
  // Função para efetivamente realizar a mudança de status
  const performStatusChange = async (appointmentId, newStatus) => {
    try {
      const updatedAppointment = await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(prev => 
        prev.map(appt => (appt.id === appointmentId ? updatedAppointment : appt))
      );
        // Mostrar toast de sucesso
      const statusLabel = STATUS_LABELS[newStatus] || newStatus;
      showSuccess(`Status alterado para: ${statusLabel}`);
    } catch (error) {
      // Tratar erro da API
      const errorMessage = error?.response?.data?.detail || 'Falha ao atualizar o status.';
      showError(errorMessage);      console.error(error);
    }
  };
  
  // Navegação de datas
  const navigateDate = (direction) => {
    if (view === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else if (view === 'year') {
      setCurrentDate(direction === 'prev' ? 
        new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()) : 
        new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate())
      );
    }
  };

  // Agendamentos do dia selecionado
  const selectedDayAppointments = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey] || [];
  }, [appointmentsByDate, selectedDate]);

  // Função para abrir o modal de detalhes do agendamento
  const handleAppointmentClick = (appointment) => {
    setDetailsModal({
      isOpen: true,
      appointment: appointment
    });
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-secondary-200 rounded w-1/3"></div>
        <div className="h-32 bg-secondary-200 rounded"></div>
        <div className="h-48 bg-secondary-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-4 text-red-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-3">
          Tentar Novamente
        </Button>
      </Card>
    );
  }
  // Função para tratar a seleção do tipo de cancelamento
  const handleCancelationChoice = (cancelStatus) => {
    performStatusChange(cancelModal.appointmentId, cancelStatus);
  };

  // Função para realizar o reagendamento após a confirmação
  const handleRescheduleConfirm = () => {
    // Recarregar os agendamentos após o reagendamento bem-sucedido
    if (currentUser?.establishment?.id) {
      const establishmentId = currentUser.establishment.id;
      setIsLoading(true);
      Promise.all([
        getAppointmentsByEstablishment(establishmentId),
        getServicesByEstablishment(establishmentId)
      ])
        .then(([appointmentsData, servicesData]) => {
          const servicesMap = servicesData.reduce((acc, service) => {
            acc[service.id] = service;
            return acc;
          }, {});
          
          setServices(servicesData);
          setAppointments(appointmentsData);
          showSuccess("Agendamento reagendado com sucesso!");
        })
        .catch(err => {
          setError('Falha ao recarregar a agenda após reagendamento.');
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de reagendamento */}
      <RescheduleModal
        isOpen={rescheduleModal.isOpen}
        onClose={() => setRescheduleModal({...rescheduleModal, isOpen: false})}
        appointment={appointments.find(appt => appt.id === rescheduleModal.appointmentId)}
        onReschedule={handleRescheduleConfirm}
        services={services}
        establishmentId={currentUser?.establishment?.id}
      />
      
      {/* Modal de cancelamento (para escolher entre os tipos) */}
      <CancellationModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ ...cancelModal, isOpen: false })}
        onConfirm={handleCancelationChoice}
        appointment={appointments.find(appt => appt.id === cancelModal.appointmentId)}
      />
      
      {/* Modal de detalhes do agendamento */}
      <AppointmentDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ ...detailsModal, isOpen: false })}
        appointment={detailsModal.appointment}
        getServiceForAppointment={getServiceForAppointment}
        onStatusChange={handleStatusChange}
      />{/* Métricas de Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card padding="sm" className="agenda-metric-card metric-today">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 text-primary-600 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-secondary-900">{metrics.today}</p>
              <p className="text-xs text-secondary-600">Hoje</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="agenda-metric-card metric-confirmed">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 text-success-600 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-secondary-900">{metrics.confirmedToday}</p>
              <p className="text-xs text-secondary-600">Confirmados</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="agenda-metric-card metric-pending">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 text-warning-600 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-secondary-900">{metrics.pending}</p>
              <p className="text-xs text-secondary-600">Pendentes</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="agenda-metric-card metric-week">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 text-info-600 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-secondary-900">{metrics.thisWeek}</p>
              <p className="text-xs text-secondary-600">Esta Semana</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="agenda-metric-card metric-revenue">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 text-success-600 flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-secondary-900">R$ {metrics.totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-secondary-600">Faturado</p>
            </div>
          </div>
        </Card>
      </div>      {/* Controles de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Semana
          </Button>
          <Button
            variant={view === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Mês
          </Button>
          <Button
            variant={view === 'year' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('year')}
          >
            Ano
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>          <h3 className="text-lg font-semibold text-secondary-900 min-w-0">
            {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            {view === 'week' && `${format(startOfWeek(currentDate, { locale: ptBR }), 'dd MMM', { locale: ptBR })} - ${format(endOfWeek(currentDate, { locale: ptBR }), 'dd MMM yyyy', { locale: ptBR })}`}
            {view === 'year' && format(currentDate, 'yyyy', { locale: ptBR })}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDate(new Date());
            }}
          >
            Hoje
          </Button>
        </div>
      </div>      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário */}
        <div className="h-full">
          <Card padding="md" className="h-full flex flex-col">
            <div className="flex-1 min-h-0">              {view === 'month' && <MonthView 
                currentDate={currentDate} 
                appointmentsByDate={appointmentsByDate}
                getDateIntensity={getDateIntensity}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                getMonthDayRanges={getMonthDayRanges}
              />}
              {view === 'week' && <WeekView 
                currentDate={currentDate}
                appointmentsByDate={appointmentsByDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />}
              {view === 'year' && <YearView 
                currentDate={currentDate}
                appointmentsByDate={appointmentsByDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />}
            </div>
          </Card>
        </div>        {/* Detalhes do Dia Selecionado */}
        <div className="h-full">
          <Card padding="md" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h4 className="font-semibold text-secondary-900">
                {format(selectedDate, 'dd \'de\' MMMM', { locale: ptBR })}
              </h4>              <div className="flex items-center space-x-3">
                <div className="view-toggle-container flex items-center space-x-1 p-1">
                  <Button 
                    variant={dayViewType === 'cards' ? 'primary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setDayViewType('cards')}
                    className={`view-toggle-button text-xs px-3 py-1.5 h-8 ${dayViewType === 'cards' ? 'active' : ''}`}
                  >
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Cards
                  </Button>
                  <Button 
                    variant={dayViewType === 'timeline' ? 'primary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setDayViewType('timeline')}
                    className={`view-toggle-button text-xs px-3 py-1.5 h-8 ${dayViewType === 'timeline' ? 'active' : ''}`}
                  >
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline
                  </Button>
                </div>
                <Badge variant={selectedDayAppointments.length > 0 ? 'primary' : 'secondary'} size="sm">
                  {selectedDayAppointments.length}
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              {selectedDayAppointments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-secondary-500">
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Nenhum agendamento</p>
                  </div>
                </div>
              ) : (
                dayViewType === 'cards' ? (
                  <CategorizedAppointmentsView 
                    appointments={selectedDayAppointments}
                    getServiceForAppointment={getServiceForAppointment}
                    onStatusChange={handleStatusChange}
                    onAppointmentClick={handleAppointmentClick}
                  />
                ) : (
                  <TimelineView 
                    appointments={selectedDayAppointments}
                    getServiceForAppointment={getServiceForAppointment}
                    onStatusChange={handleStatusChange}
                    onAppointmentClick={handleAppointmentClick}
                  />
                )
              )}
            </div>          </Card>
        </div>
      </div>
      
      {/* Modal de confirmação para alterações de status */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmButtonText={confirmModal.confirmButtonText}
        confirmButtonColor={confirmModal.confirmButtonColor}
      />
    </div>
  );
};

// Componente de Visualização Mensal
const MonthView = ({ currentDate, appointmentsByDate, getDateIntensity, selectedDate, setSelectedDate, getMonthDayRanges }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-2">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-xs font-medium text-secondary-600 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`
                relative aspect-square p-1 text-sm font-medium rounded-lg transition-all
                ${isCurrentMonth ? 'text-secondary-900' : 'text-secondary-400'}
                ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:bg-secondary-50'}
                ${isTodayDate ? 'bg-primary-100 text-primary-900 font-bold' : ''}
                ${getDateIntensity(day)}
              `}
            >
              <span className="relative z-10">{format(day, 'd')}</span>
              {dayAppointments.length > 0 && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-0.5">
                    {dayAppointments.slice(0, 3).map((_, index) => (
                      <div
                        key={index}
                        className="w-1 h-1 rounded-full bg-current opacity-70"
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs">+</div>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
        {/* Legenda de Atividade para o Mês */}
      <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
        <h4 className="text-sm font-medium text-secondary-900 mb-3">Legenda de Atividade do Mês:</h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-secondary-50 border border-secondary-200 rounded"></div>
            <span className="text-secondary-600">{getMonthDayRanges[0]}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-50 border border-primary-100 rounded"></div>
            <span className="text-secondary-600">
              {getMonthDayRanges[1]}{getMonthDayRanges[2] > getMonthDayRanges[1] + 1 ? `-${getMonthDayRanges[2] - 1}` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-200 border border-primary-200 rounded"></div>
            <span className="text-secondary-600">
              {getMonthDayRanges[2]}{getMonthDayRanges[3] > getMonthDayRanges[2] + 1 ? `-${getMonthDayRanges[3] - 1}` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-400 border border-primary-400 rounded"></div>
            <span className="text-secondary-600">
              {getMonthDayRanges[3]}{getMonthDayRanges[4] > getMonthDayRanges[3] + 1 ? `-${getMonthDayRanges[4] - 1}` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-600 border border-primary-600 rounded"></div>
            <span className="text-secondary-600">{getMonthDayRanges[4]}+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Visualização Semanal
const WeekView = ({ currentDate, appointmentsByDate, selectedDate, setSelectedDate }) => {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateKey] || [];
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          
          return (
            <div key={day.toISOString()} className="space-y-2">
              <button
                onClick={() => setSelectedDate(day)}
                className={`
                  w-full p-3 rounded-lg text-center transition-all
                  ${isSelected ? 'bg-primary-500 text-white' : 'bg-secondary-50 hover:bg-secondary-100'}
                  ${isTodayDate && !isSelected ? 'ring-2 ring-primary-200' : ''}
                `}
              >                <div className="text-xs text-secondary-600">
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </div>
                <div className="text-lg font-bold">
                  {format(day, 'd')}
                </div>
              </button>
              
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {dayAppointments.slice(0, 3).map(appt => (
                  <div
                    key={appt.id}
                    className="text-xs p-1 bg-primary-100 text-primary-800 rounded truncate"
                    title={`${format(parseISO(appt.start_time), 'HH:mm')} - ${formatCustomerName(appt.customer_name)}`}
                  >
                    {format(parseISO(appt.start_time), 'HH:mm')}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-secondary-500 text-center">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de Card de Agendamento
const AppointmentCard = ({ appointment, onStatusChange, getServiceForAppointment, onAppointmentClick, detailed = false }) => {
  const service = getServiceForAppointment ? getServiceForAppointment(appointment) : appointment.service;
  
  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || status;
  };
  
  const getStatusClass = (status) => {
    return STATUS_CLASSES[status] || '';
  };

  // Função para gerar cor de avatar baseada no nome
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Função para obter iniciais do profissional
  const getProfessionalInitials = (professionalName) => {
    if (!professionalName) return 'PR';
    return professionalName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Função para obter iniciais do cliente
  const getCustomerInitials = (customerName) => {
    if (!customerName) return 'C';
    return customerName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Botões de ação baseados no status atual
  const getActionButtons = () => {
    const buttons = [];
    
    // Obter os status permitidos para este agendamento
    const allowedTransitions = getAllowedTransitions(appointment);
    
    // Botão de Confirmar
    if (allowedTransitions.includes(AppointmentStatus.CONFIRMED)) {
      buttons.push(
        <button
          key="confirm"
          onClick={() => onStatusChange(appointment.id, AppointmentStatus.CONFIRMED)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
          title="Confirmar agendamento"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Confirmar
        </button>
      );
    }
    
    // Botão de Iniciar Atendimento
    if (allowedTransitions.includes(AppointmentStatus.IN_PROGRESS)) {
      buttons.push(
        <button
          key="in_progress"
          onClick={() => onStatusChange(appointment.id, AppointmentStatus.IN_PROGRESS)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors font-medium"
          title="Iniciar atendimento"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Iniciar
        </button>
      );
    }
    
    // Botão de Concluir
    if (allowedTransitions.includes(AppointmentStatus.COMPLETED)) {
      buttons.push(
        <button
          key="complete"
          onClick={() => onStatusChange(appointment.id, AppointmentStatus.COMPLETED)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
          title="Marcar como concluído"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Concluir
        </button>
      );
    }
    
    // Botão de Não Compareceu
    if (allowedTransitions.includes(AppointmentStatus.NO_SHOW)) {
      buttons.push(
        <button
          key="no_show"
          onClick={() => onStatusChange(appointment.id, AppointmentStatus.NO_SHOW)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
          title="Cliente não compareceu"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          Faltou
        </button>
      );
    }
    
    // Botão unificado de Cancelamento
    if (allowedTransitions.includes(AppointmentStatus.CANCELLED_BY_ESTABLISHMENT) || 
        allowedTransitions.includes(AppointmentStatus.CANCELLED_BY_CLIENT)) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => onStatusChange(appointment.id, "SHOW_CANCEL_MODAL")}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
          title="Cancelar agendamento"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cancelar
        </button>
      );
    }
    
    // Botão de Reagendar
    if (allowedTransitions.includes(AppointmentStatus.RESCHEDULED)) {
      buttons.push(
        <button
          key="reschedule"
          onClick={() => onStatusChange(appointment.id, "SHOW_RESCHEDULE_MODAL")}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
          title="Reagendar agendamento"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Reagendar
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div 
      className={`group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-blue-300 cursor-pointer ${getStatusClass(appointment.status)}`}
      onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
    >
      {/* Header com cliente e profissional */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar do Cliente */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(appointment.customer_name || 'Cliente')}`}>
            {appointment.customer_photo ? (
              <img 
                src={appointment.customer_photo} 
                alt={appointment.customer_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{getCustomerInitials(appointment.customer_name)}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-gray-900 text-sm truncate">
                {formatCustomerName(appointment.customer_name)}
              </h3>
            </div>
            
            {/* Horário */}
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {format(parseISO(appointment.start_time), 'HH:mm')}
              {service && <span className="mx-1">•</span>}
              {service && <span>{service.duration_minutes} min</span>}
            </div>
          </div>
        </div>

        {/* Avatar do Profissional (sempre mostrar) */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-xs text-gray-600 font-medium">
              {appointment.professional_name || 'Profissional'}
            </p>
            <p className="text-xs text-gray-500">Responsável</p>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(appointment.professional_name || 'Profissional')}`}>
            {appointment.professional_photo ? (
              <img 
                src={appointment.professional_photo} 
                alt={appointment.professional_name || 'Profissional'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : appointment.professional_name ? (
              <span>{getProfessionalInitials(appointment.professional_name)}</span>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Serviço e Preço */}
      {service && (
        <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium text-gray-700">{service.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-sm font-bold text-green-600">R$ {service.price.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Contato do cliente (só em modo detalhado) */}
      {detailed && appointment.customer_phone && (
        <div className="flex items-center space-x-2 mb-3 text-xs text-gray-600">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{appointment.customer_phone}</span>
        </div>
      )}

      {/* Botões de Ação */}
      {getActionButtons().length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          {getActionButtons()}
        </div>
      )}
      
      {/* Botões detalhados para modo detailed */}
      {detailed && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-secondary-200">
          {(() => {
            // Obter as transições permitidas para este agendamento
            const allowedTransitions = getAllowedTransitions(appointment);
            
            // Mapear botões para transições permitidas
            const buttonMap = {
              [AppointmentStatus.CONFIRMED]: {
                label: "Confirmar",
                variant: "success"
              },
              [AppointmentStatus.IN_PROGRESS]: {
                label: "Iniciar Atendimento",
                variant: "info"
              },
              [AppointmentStatus.COMPLETED]: {
                label: "Concluir",
                variant: "success"
              },
              "CANCEL_UNIFIED": {
                label: "Cancelar",
                variant: "error",
                specialAction: "SHOW_CANCEL_MODAL"
              },
              [AppointmentStatus.NO_SHOW]: {
                label: "Não Compareceu",
                variant: "outline"
              },
              "SHOW_RESCHEDULE_MODAL": {
                label: "Reagendar",
                variant: "secondary",
                specialAction: "SHOW_RESCHEDULE_MODAL"
              }
            };

            // Verificamos se alguma das opções de cancelamento está disponível
            const canCancel = allowedTransitions.includes(AppointmentStatus.CANCELLED_BY_ESTABLISHMENT) || 
                             allowedTransitions.includes(AppointmentStatus.CANCELLED_BY_CLIENT);
            
            // Verificamos se o reagendamento está disponível
            const canReschedule = allowedTransitions.includes(AppointmentStatus.RESCHEDULED);
            
            // Filtramos as transições, removendo os cancelamentos individuais e reagendamento
            const filteredTransitions = allowedTransitions.filter(status => 
              status !== AppointmentStatus.CANCELLED_BY_ESTABLISHMENT && 
              status !== AppointmentStatus.CANCELLED_BY_CLIENT &&
              status !== AppointmentStatus.RESCHEDULED
            );
            
            // Adicionamos os botões especiais quando disponíveis
            let buttonsToRender = filteredTransitions;
            if (canCancel) {
              buttonsToRender = [...buttonsToRender, "CANCEL_UNIFIED"];
            }
            if (canReschedule) {
              buttonsToRender = [...buttonsToRender, "SHOW_RESCHEDULE_MODAL"];
            }
            
            return buttonsToRender.map(status => {
              const button = buttonMap[status];
              if (!button) return null;
              
              // Verifique se é o botão unificado de cancelamento
              if (button.specialAction) {
                return (
                  <Button
                    key={status}
                    size="sm"
                    variant={button.variant}
                    onClick={() => onStatusChange(appointment.id, button.specialAction)}
                    className="flex-1"
                  >
                    {button.label}
                  </Button>
                );
              }
              
              return (
                <Button
                  key={status}
                  size="sm"
                  variant={button.variant}
                  onClick={() => onStatusChange(appointment.id, status)}
                  className="flex-1"
                >
                  {button.label}
                </Button>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

// Componente de Visualização Categorizada dos Agendamentos
const CategorizedAppointmentsView = ({ appointments, getServiceForAppointment, onStatusChange, onAppointmentClick }) => {
  const [expandedSections, setExpandedSections] = useState({
    pending: false,
    confirmed: false,
    inProgress: false,
    completed: false,
    cancelled: false,
    noShow: false
  });

  // Categorizar agendamentos por status
  const categorizedAppointments = useMemo(() => {
    const categories = {
      pending: [],
      confirmed: [],
      inProgress: [],
      completed: [],
      cancelled: [],  // Categoria única para todos os tipos de cancelamento
      noShow: []
    };

    appointments.forEach(appointment => {
      switch (appointment.status) {
        case AppointmentStatus.PENDING:
          categories.pending.push(appointment);
          break;
        case AppointmentStatus.CONFIRMED:
          categories.confirmed.push(appointment);
          break;
        case AppointmentStatus.IN_PROGRESS:
          categories.inProgress.push(appointment);
          break;
        case AppointmentStatus.RESCHEDULED:  // Reagendados ainda serão executados
          categories.confirmed.push(appointment);
          break;
        case AppointmentStatus.COMPLETED:
          categories.completed.push(appointment);
          break;
        case AppointmentStatus.CANCELLED_BY_CLIENT:
        case AppointmentStatus.CANCELLED_BY_ESTABLISHMENT:
          categories.cancelled.push(appointment);  // Agora agrupados
          break;
        case AppointmentStatus.NO_SHOW:
          categories.noShow.push(appointment);
          break;
        default:
          // Status desconhecido vai para pendentes por segurança
          categories.pending.push(appointment);
      }
    });

    // Ordenar cada categoria por horário
    Object.keys(categories).forEach(key => {
      categories[key].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    });

    return categories;
  }, [appointments]);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const getCategoryIcon = (category) => {
    const icons = {
      pending: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      confirmed: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      inProgress: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      completed: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      cancelled: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      noShow: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    };
    return icons[category];
  };

  const getCategoryInfo = (category) => {
    const info = {
      pending: {
        title: 'Pendentes',
        subtitle: 'Aguardando confirmação',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        count: categorizedAppointments.pending.length
      },
      confirmed: {
        title: 'Confirmados',
        subtitle: 'Aguardando atendimento',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        count: categorizedAppointments.confirmed.length
      },
      inProgress: {
        title: 'Em Andamento',
        subtitle: 'Atendimento em execução',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        count: categorizedAppointments.inProgress.length
      },
      completed: {
        title: 'Concluídos',
        subtitle: 'Atendimentos finalizados',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        count: categorizedAppointments.completed.length
      },
      cancelled: {
        title: 'Cancelados',
        subtitle: 'Cancelados',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        count: categorizedAppointments.cancelled.length
      },
      noShow: {
        title: 'Faltas',
        subtitle: 'Cliente não compareceu',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        count: categorizedAppointments.noShow.length
      }
    };
    return info[category];
  };

  const categories = ['pending', 'confirmed', 'inProgress', 'completed', 'cancelled', 'noShow'];

  return (
    <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
      <div className="space-y-3">
        {categories.map(categoryKey => {
          const categoryInfo = getCategoryInfo(categoryKey);
          const appointments = categorizedAppointments[categoryKey];
          const isExpanded = expandedSections[categoryKey];

          // Não mostrar categoria se não houver agendamentos
          if (appointments.length === 0) return null;

          return (
            <div key={categoryKey} className={`border rounded-lg ${categoryInfo.borderColor} ${categoryInfo.bgColor}`}>
              {/* Header da categoria - clicável para expandir/colapsar */}
              <button
                onClick={() => toggleSection(categoryKey)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-80 transition-colors rounded-lg ${categoryInfo.bgColor}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={categoryInfo.color}>
                    {getCategoryIcon(categoryKey)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-semibold text-sm ${categoryInfo.color}`}>
                      {categoryInfo.title}
                    </h3>
                    <Badge variant="secondary" size="sm">
                      {categoryInfo.count}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-right">
                  <span className={`text-xs ${categoryInfo.color} opacity-75`}>
                    {categoryInfo.subtitle}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${categoryInfo.color} ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Conteúdo da categoria - colapsável */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="space-y-3">
                    {appointments.map(appointment => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        getServiceForAppointment={getServiceForAppointment}
                        onStatusChange={onStatusChange}
                        onAppointmentClick={onAppointmentClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de Visualização Anual
const YearView = ({ currentDate, appointmentsByDate, selectedDate, setSelectedDate }) => {
  const currentYear = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
  // Calcular ranges dinâmicos para meses do ano
  const getYearMonthRanges = useMemo(() => {
    const monthCounts = months.map(month => {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      
      let totalAppointments = 0;
      for (let day = 1; day <= new Date(year, monthIndex + 1, 0).getDate(); day++) {
        const dateKey = format(new Date(year, monthIndex, day), 'yyyy-MM-dd');
        const dayAppointments = appointmentsByDate[dateKey] || [];
        totalAppointments += dayAppointments.length;
      }
      return totalAppointments;
    });
    
    const validCounts = monthCounts.filter(count => count > 0);
    if (validCounts.length === 0) return [0, 1, 2, 3, 4];
    
    const maxCount = Math.max(...validCounts);
    
    // Encontrar o primeiro múltiplo de 5 após o valor máximo
    const maxMultipleOf5 = Math.ceil(maxCount / 5) * 5;
    
    // Se o múltiplo de 5 for muito pequeno (≤ 5), usar pelo menos 5
    const finalMax = Math.max(maxMultipleOf5, 5);
    
    // Dividir em 5 ranges uniformes
    const step = finalMax / 5;
    
    return [
      0,
      step,
      step * 2,
      step * 3,
      step * 4
    ];
  }, [currentDate, appointmentsByDate, months]);

  // Função para obter intensidade de agendamentos por mês
  const getMonthIntensity = (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Contar agendamentos do mês
    let totalAppointments = 0;
    for (let day = 1; day <= new Date(year, monthIndex + 1, 0).getDate(); day++) {
      const dateKey = format(new Date(year, monthIndex, day), 'yyyy-MM-dd');
      const dayAppointments = appointmentsByDate[dateKey] || [];
      totalAppointments += dayAppointments.length;
    }
    
    const [r0, r1, r2, r3, r4] = getYearMonthRanges;
    
    if (totalAppointments === 0) return 'bg-secondary-50 text-secondary-600';
    if (totalAppointments >= r1 && totalAppointments < r2) return 'bg-primary-50 text-primary-700 border border-primary-100';
    if (totalAppointments >= r2 && totalAppointments < r3) return 'bg-primary-200 text-primary-800 border border-primary-200';
    if (totalAppointments >= r3 && totalAppointments < r4) return 'bg-primary-400 text-white border border-primary-400';
    if (totalAppointments >= r4) return 'bg-primary-600 text-white border border-primary-600 font-bold';
    return 'bg-primary-50 text-primary-700 border border-primary-100';
  };

  const getMonthAppointmentCount = (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    let totalAppointments = 0;
    for (let day = 1; day <= new Date(year, monthIndex + 1, 0).getDate(); day++) {
      const dateKey = format(new Date(year, monthIndex, day), 'yyyy-MM-dd');
      const dayAppointments = appointmentsByDate[dateKey] || [];
      totalAppointments += dayAppointments.length;
    }
    return totalAppointments;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {months.map(month => {
          const isCurrentMonth = isSameMonth(month, new Date());
          const isSelectedMonth = isSameMonth(month, selectedDate);
          const appointmentCount = getMonthAppointmentCount(month);
          const [r0, r1, r2, r3, r4] = getYearMonthRanges;
          
          return (
            <button
              key={month.toISOString()}
              onClick={() => setSelectedDate(month)}
              className={`
                relative p-4 rounded-lg text-center transition-all hover:scale-105
                ${isSelectedMonth ? 'ring-2 ring-primary-500' : ''}
                ${isCurrentMonth && !isSelectedMonth ? 'ring-2 ring-primary-200' : ''}
                ${getMonthIntensity(month)}
              `}
            >
              <div className="text-sm font-medium mb-1">
                {format(month, 'MMM', { locale: ptBR })}
              </div>
              <div className="text-xs opacity-75">
                {appointmentCount} ag.
              </div>
              
              {/* Indicador visual de atividade dinâmico */}
              {appointmentCount > 0 && (
                <div className="absolute top-2 right-2">
                  <div className="flex space-x-0.5">
                    {appointmentCount >= r1 && appointmentCount < r2 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    )}
                    {appointmentCount >= r2 && appointmentCount < r3 && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      </>
                    )}
                    {appointmentCount >= r3 && appointmentCount < r4 && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      </>
                    )}
                    {appointmentCount >= r4 && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      </>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
        {/* Legenda Dinâmica */}
      <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
        <h4 className="text-sm font-medium text-secondary-900 mb-3">Legenda de Atividade do Ano:</h4>
        <div className="grid grid-cols-5 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-secondary-50 border border-secondary-200 rounded"></div>
            <span className="text-secondary-600">{getYearMonthRanges[0]}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-50 border border-primary-100 rounded"></div>
            <span className="text-secondary-600">
              {getYearMonthRanges[1]}{getYearMonthRanges[2] > getYearMonthRanges[1] + 1 ? `-${getYearMonthRanges[2] - 1}` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-200 border border-primary-200 rounded"></div>
            <span className="text-secondary-600">
              {getYearMonthRanges[2]}{getYearMonthRanges[3] > getYearMonthRanges[2] + 1 ? `-${getYearMonthRanges[3] - 1}` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-400 border border-primary-400 rounded"></div>
            <span className="text-secondary-600">
              {getYearMonthRanges[3]}{getYearMonthRanges[4] > getYearMonthRanges[3] + 1 ? `-${getYearMonthRanges[4] - 1}` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-600 border border-primary-600 rounded"></div>
            <span className="text-secondary-600">{getYearMonthRanges[4]}+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Visualização em Timeline
const TimelineView = ({ appointments, getServiceForAppointment, onStatusChange, onAppointmentClick }) => {
  // Determinar range de horários baseado nos agendamentos ou usar padrão (8h-20h)
  const getTimeRange = () => {
    if (appointments.length === 0) {
      return Array.from({ length: 13 }, (_, i) => i + 8); // 8h-20h padrão
    }
    
    const hours = appointments.map(appt => new Date(appt.start_time).getHours());
    const minHour = Math.max(Math.min(...hours) - 1, 7); // Pelo menos 7h
    const maxHour = Math.min(Math.max(...hours) + 2, 22); // No máximo 22h
    
    return Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);
  };

  const timeSlots = getTimeRange();
  
  // Agrupar agendamentos por hora
  const appointmentsByHour = useMemo(() => {
    const grouped = {};
    appointments.forEach(appt => {

      const hour = new Date(appt.start_time).getHours();
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(appt);
    });
    return grouped;
  }, [appointments]);  const getStatusColor = (status) => {
    const colors = {
      [AppointmentStatus.PENDING]: 'bg-gray-50 border-l-2 border-l-amber-200 border border-gray-200 shadow-sm text-slate-600',
      [AppointmentStatus.CONFIRMED]: 'bg-gray-50 border-l-2 border-l-blue-200 border border-gray-200 shadow-sm text-slate-600',
      [AppointmentStatus.IN_PROGRESS]: 'bg-gray-50 border-l-2 border-l-purple-200 border border-gray-200 shadow-sm text-slate-600',
      [AppointmentStatus.COMPLETED]: 'bg-gray-50 border-l-2 border-l-green-200 border border-gray-200 shadow-sm text-slate-600',
      [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: 'bg-gray-50 border-l-2 border-l-red-200 border border-gray-200 shadow-sm text-slate-600',
      [AppointmentStatus.CANCELLED_BY_CLIENT]: 'bg-gray-50 border-l-2 border-l-orange-200 border border-gray-200 shadow-sm text-slate-600',
      [AppointmentStatus.NO_SHOW]: 'bg-gray-50 border-l-2 border-l-gray-300 border border-gray-200 shadow-sm text-slate-600',
      [AppointmentStatus.RESCHEDULED]: 'bg-gray-50 border-l-2 border-l-indigo-200 border border-gray-200 shadow-sm text-slate-600'
    };
    return colors[status] || 'bg-gray-50 border-l-2 border-l-gray-300 border border-gray-200 shadow-sm text-slate-600';
  };const getStatusIcon = (status) => {
    const icons = {
      [AppointmentStatus.PENDING]: (
        <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      [AppointmentStatus.CONFIRMED]: (
        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      [AppointmentStatus.IN_PROGRESS]: (
        <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      [AppointmentStatus.COMPLETED]: (
        <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: (
        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      [AppointmentStatus.CANCELLED_BY_CLIENT]: (
        <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      [AppointmentStatus.NO_SHOW]: (
        <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14l-2-2m0 0l-2-2m2 2l-2 2m2-2l2 2" />
        </svg>
      ),
      [AppointmentStatus.RESCHEDULED]: (
        <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    };
    return icons[status] || icons.pending;
  };
  return (
    <div className="h-full overflow-y-auto timeline-view-container p-3">
      <div className="space-y-0 border border-secondary-200 rounded-lg bg-white">
        {timeSlots.map(hour => {
          const hourAppointments = appointmentsByHour[hour] || [];
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
          
          return (            <div key={hour} className="flex timeline-hour-row">
              {/* Coluna do horário */}
              <div className="w-14 flex-shrink-0 timeline-hour-label text-xs font-medium py-2 px-2 text-center">
                {timeLabel}
              </div>
                {/* Coluna dos agendamentos */}
              <div className="flex-1 min-w-0 p-1.5">
                {hourAppointments.length === 0 ? (
                  <div className="h-7 flex items-center text-xs text-secondary-400 px-2">
                    <span className="italic">Disponível</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hourAppointments
                      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                      .map(appointment => {
                        const service = getServiceForAppointment(appointment);                        const startTime = format(parseISO(appointment.start_time), 'HH:mm');
                        const duration = service?.duration_minutes || 30;
                        const endTime = format(addMinutes(parseISO(appointment.start_time), duration), 'HH:mm');
                        
                        return (
                          <div
                            key={appointment.id}
                            className={`
                              timeline-appointment-block timeline-appointment-${appointment.status}
                              rounded-md py-1 cursor-pointer transition-all hover:shadow-md hover:border-l-6
                              ${getStatusColor(appointment.status)} w-full
                            `}
                            title={`${formatCustomerName(appointment.customer_name)} - ${service?.name || 'Serviço'} (${startTime} - ${endTime})`}
                            onClick={() => onAppointmentClick && onAppointmentClick(appointment)}  // Abrir modal de detalhes ao clicar
                          >                            {/* Conteúdo compacto */}
                            <div className="flex items-center justify-between min-h-7 w-full px-2">
                              <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(appointment.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs opacity-75 font-medium">
                                      {startTime} - {endTime}
                                    </span>
                                    <span className="font-medium text-xs truncate max-w-28">
                                      {formatCustomerName(appointment.customer_name)}
                                    </span>
                                    {service && (
                                      <span className="text-xs opacity-60 truncate max-w-28">
                                        {service.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>                              {/* Botões de ação baseados em transições permitidas */}
                              <div className="flex items-center space-x-0.5 flex-shrink-0">
                                {/* Obter status permitidos */}
                                {(() => {
                                  // Obter transições permitidas
                                  const allowedTransitions = getAllowedTransitions(appointment);
                                  return (
                                    <>
                                      {/* Botão de Confirmar */}
                                      {allowedTransitions.includes(AppointmentStatus.CONFIRMED) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(appointment.id, AppointmentStatus.CONFIRMED);
                                          }}
                                          className="w-5 h-5 bg-white text-emerald-400 rounded text-xs hover:bg-emerald-50 flex items-center justify-center font-bold border border-emerald-100 transition-colors"
                                          title="Confirmar"
                                        >
                                          ✓
                                        </button>
                                      )}
                                      
                                      {/* Botão de Concluir */}
                                      {allowedTransitions.includes(AppointmentStatus.COMPLETED) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(appointment.id, AppointmentStatus.COMPLETED);
                                          }}
                                          className="w-5 h-5 bg-white text-emerald-400 rounded text-xs hover:bg-emerald-50 flex items-center justify-center font-bold border border-emerald-100 transition-colors"
                                          title="Concluir"
                                        >
                                          ✓
                                        </button>
                                      )}
                                      
                                      {/* Botão de Iniciar */}
                                      {allowedTransitions.includes(AppointmentStatus.IN_PROGRESS) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(appointment.id, AppointmentStatus.IN_PROGRESS);
                                          }}
                                          className="w-5 h-5 bg-white text-purple-400 rounded text-xs hover:bg-purple-50 flex items-center justify-center font-bold border border-purple-100 transition-colors"
                                          title="Iniciar Atendimento"
                                        >
                                          ▶
                                        </button>
                                      )}

                                      {/* Botão de Não Compareceu */}
                                      {allowedTransitions.includes(AppointmentStatus.NO_SHOW) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(appointment.id, AppointmentStatus.NO_SHOW);
                                          }}
                                          className="w-5 h-5 bg-white text-slate-400 rounded text-xs hover:bg-slate-50 flex items-center justify-center font-bold border border-slate-100 transition-colors"
                                          title="Marcar Falta"
                                        >                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20  12H4" />
                                          </svg>
                                        </button>
                                      )}
                                      
                                      {/* Botão unificado de cancelamento */}
                                      {(allowedTransitions.includes(AppointmentStatus.CANCELLED_BY_ESTABLISHMENT) || 
                                        allowedTransitions.includes(AppointmentStatus.CANCELLED_BY_CLIENT)) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(appointment.id, "SHOW_CANCEL_MODAL");
                                          }}
                                          className="w-5 h-5 bg-white text-rose-400 rounded text-xs hover:bg-rose-50 flex items-center justify-center font-bold border border-rose-100 transition-colors"
                                          title="Cancelar"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaView;