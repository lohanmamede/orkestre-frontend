// src/components/dashboard/AgendaView.js
import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO, startOfDay, addWeeks, subWeeks, addMonths, subMonths, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useAuth } from '../../contexts/AuthContext';
import { getAppointmentsByEstablishment, updateAppointmentStatus } from '../../services/appointmentService';
import { getServicesByEstablishment } from '../../services/serviceService';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import '../../styles/agenda.css';

// Função utilitária para formatar nomes
const formatCustomerName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return '';
  
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    // Se há apenas um nome, retorna com a primeira letra maiúscula
    return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
  }
  
  // Primeiro nome com primeira letra maiúscula
  const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
  
  // Última parte do nome (sobrenome) com inicial maiúscula seguida de ponto
  const lastName = nameParts[nameParts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase() + '.';
  
  return `${firstName} ${lastInitial}`;
};

const AgendaView = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');const [view, setView] = useState('month'); // 'week', 'month', 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayViewType, setDayViewType] = useState('cards'); // 'cards' ou 'timeline'
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
  }, [appointments]);  // Função para obter densidade de agendamentos
  const getDateIntensity = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayAppointments = appointmentsByDate[dateKey] || [];
    const count = dayAppointments.length;
    
    if (count === 0) return '';
    if (count >= 1 && count <= 2) return 'bg-primary-50 text-primary-700';
    if (count >= 3 && count <= 4) return 'bg-primary-200 text-primary-800';
    if (count >= 5 && count <= 6) return 'bg-primary-400 text-white';
    return 'bg-primary-600 text-white font-bold';
  };  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const updatedAppointment = await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(prev => 
        prev.map(appt => (appt.id === appointmentId ? updatedAppointment : appt))
      );
    } catch (error) {
      alert('Falha ao atualizar o status.');
      console.error(error);
    }
  };// Navegação de datas
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

  return (
    <div className="space-y-6">      {/* Métricas de Overview */}
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
                  <div className="space-y-3 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
                    {selectedDayAppointments
                      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                      .map(appt => (
                      <AppointmentCard 
                        key={appt.id} 
                        appointment={appt} 
                        getServiceForAppointment={getServiceForAppointment}
                        onStatusChange={handleStatusChange} 
                      />
                    ))}
                  </div>
                ) : (
                  <TimelineView 
                    appointments={selectedDayAppointments}
                    getServiceForAppointment={getServiceForAppointment}
                    onStatusChange={handleStatusChange}
                  />
                )
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Componente de Visualização Mensal
const MonthView = ({ currentDate, appointmentsByDate, getDateIntensity, selectedDate, setSelectedDate }) => {
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
const AppointmentCard = ({ appointment, onStatusChange, getServiceForAppointment, detailed = false }) => {
  const service = getServiceForAppointment ? getServiceForAppointment(appointment) : appointment.service;  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      cancelled_by_establishment: 'error',
      cancelled_by_client: 'error',
      no_show: 'error'
    };
    return colors[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled_by_establishment: 'Cancelado',
      cancelled_by_client: 'Cancelado pelo Cliente',
      no_show: 'Não Compareceu'
    };
    return labels[status] || status;
  };  const getStatusClass = (status) => {
    const classes = {
      pending: 'agenda-status-pending',
      confirmed: 'agenda-status-confirmed',
      completed: 'agenda-status-completed',
      cancelled_by_establishment: 'agenda-status-cancelled',
      cancelled_by_client: 'agenda-status-cancelled',
      no_show: 'agenda-status-no-show'
    };
    return classes[status] || '';
  };

  // Botões de ação baseados no status atual
  const getActionButtons = () => {
    const buttons = [];
    
    if (appointment.status === 'pending') {
      buttons.push(
        <button
          key="confirm"
          onClick={() => onStatusChange(appointment.id, 'confirmed')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
          title="Confirmar agendamento"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Confirmar
        </button>
      );
    }
    
    if (appointment.status === 'confirmed') {
      buttons.push(
        <button
          key="complete"
          onClick={() => onStatusChange(appointment.id, 'completed')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
          title="Marcar como concluído"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Concluir
        </button>
      );      buttons.push(
        <button
          key="no_show"
          onClick={() => onStatusChange(appointment.id, 'no_show')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
          title="Cliente não compareceu"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          Faltou
        </button>
      );
    }
      if (['pending', 'confirmed'].includes(appointment.status)) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => onStatusChange(appointment.id, 'cancelled_by_establishment')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
          title="Cancelar agendamento"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cancelar
        </button>
      );
    }
    
    return buttons;  };

  return (
    <div className={`border rounded-lg p-3 agenda-appointment-card agenda-fade-in ${getStatusClass(appointment.status)} ${
      detailed ? 'bg-white' : 'bg-secondary-50'
    }`}>      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-secondary-900 truncate">
              {formatCustomerName(appointment.customer_name)}
            </span>
            <Badge variant={getStatusColor(appointment.status)} size="sm">
              {getStatusLabel(appointment.status)}
            </Badge>
          </div><div className="text-sm text-secondary-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {format(parseISO(appointment.start_time), 'HH:mm')}
              </span>
              {detailed && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {appointment.customer_phone}
                </span>
              )}
              {service && (
                <span className="flex items-center text-secondary-700 font-medium">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {service.name}
                </span>
              )}
              {service && (
                <span className="flex items-center text-primary-600 font-medium">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  R$ {service.price.toFixed(2)}
                </span>
              )}
              {service && (
                <span className="flex items-center text-secondary-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {service.duration_minutes} min
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação Rápida */}
      {!detailed && getActionButtons().length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-secondary-200">
          {getActionButtons()}
        </div>
      )}

      {detailed && appointment.status === 'pending' && (
        <div className="flex space-x-2 mt-3 pt-3 border-t border-secondary-200">
          <Button
            size="sm"
            variant="success"
            onClick={() => onStatusChange(appointment.id, 'confirmed')}
            className="flex-1"
          >
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="error"
            onClick={() => onStatusChange(appointment.id, 'cancelled_by_establishment')}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      )}

      {detailed && appointment.status === 'confirmed' && (
        <div className="flex space-x-2 mt-3 pt-3 border-t border-secondary-200">
          <Button
            size="sm"
            variant="success"
            onClick={() => onStatusChange(appointment.id, 'completed')}
            className="flex-1"
          >
            Concluir
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(appointment.id, 'no_show')}
            className="flex-1"
          >
            Não Compareceu
          </Button>
        </div>
      )}
    </div>  );
};

// Componente de Visualização Anual
const YearView = ({ currentDate, appointmentsByDate, selectedDate, setSelectedDate }) => {
  const currentYear = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));

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
    
    if (totalAppointments === 0) return 'bg-secondary-50 text-secondary-600';
    if (totalAppointments >= 1 && totalAppointments <= 5) return 'bg-primary-50 text-primary-700 border border-primary-100';
    if (totalAppointments >= 6 && totalAppointments <= 15) return 'bg-primary-200 text-primary-800 border border-primary-200';
    if (totalAppointments >= 16 && totalAppointments <= 30) return 'bg-primary-400 text-white border border-primary-400';
    return 'bg-primary-600 text-white border border-primary-600 font-bold';
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
              </div>              <div className="text-xs opacity-75">
                {appointmentCount} ag.
              </div>
              
              {/* Indicador visual de atividade */}
              {appointmentCount > 0 && (
                <div className="absolute top-2 right-2">
                  <div className="flex space-x-0.5">
                    {appointmentCount <= 5 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    )}
                    {appointmentCount > 5 && appointmentCount <= 15 && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      </>
                    )}
                    {appointmentCount > 15 && appointmentCount <= 30 && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      </>
                    )}
                    {appointmentCount > 30 && (
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
      
      {/* Legenda */}
      <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
        <h4 className="text-sm font-medium text-secondary-900 mb-3">Legenda de Atividade:</h4>        <div className="grid grid-cols-5 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-secondary-50 border border-secondary-200 rounded"></div>
            <span className="text-secondary-600">0</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-50 border border-primary-100 rounded"></div>
            <span className="text-secondary-600">1-5</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-200 border border-primary-200 rounded"></div>
            <span className="text-secondary-600">6-15</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-400 border border-primary-400 rounded"></div>
            <span className="text-secondary-600">16-30</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-600 border border-primary-600 rounded"></div>
            <span className="text-secondary-600">30+</span>
          </div>
        </div>
      </div>
    </div>  );
};

// Componente de Visualização em Timeline
const TimelineView = ({ appointments, getServiceForAppointment, onStatusChange }) => {
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
      pending: 'bg-gray-50 border-l-2 border-l-amber-200 border border-gray-200 shadow-sm text-slate-600',
      confirmed: 'bg-gray-50 border-l-2 border-l-blue-200 border border-gray-200 shadow-sm text-slate-600',
      completed: 'bg-gray-50 border-l-2 border-l-green-200 border border-gray-200 shadow-sm text-slate-600',
      cancelled_by_establishment: 'bg-gray-50 border-l-2 border-l-red-200 border border-gray-200 shadow-sm text-slate-600',
      cancelled_by_client: 'bg-gray-50 border-l-2 border-l-red-200 border border-gray-200 shadow-sm text-slate-600',
      no_show: 'bg-gray-50 border-l-2 border-l-gray-300 border border-gray-200 shadow-sm text-slate-600'
    };
    return colors[status] || 'bg-gray-50 border-l-2 border-l-gray-300 border border-gray-200 shadow-sm text-slate-600';
  };const getStatusIcon = (status) => {
    const icons = {      pending: (
        <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      confirmed: (
        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      completed: (
        <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),      cancelled_by_establishment: (
        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>      ),
      cancelled_by_client: (
        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      no_show: (
        <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14l-2-2m0 0l-2-2m2 2l-2 2m2-2l2 2" />
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
                  <div className="space-y-1">
                    {hourAppointments
                      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                      .map(appointment => {
                        const service = getServiceForAppointment(appointment);
                        const startTime = format(parseISO(appointment.start_time), 'HH:mm');
                        const duration = service?.duration_minutes || 30;
                        const endTime = format(addMinutes(parseISO(appointment.start_time), duration), 'HH:mm');                        // Calcular largura baseada na duração (30min = largura base)
                        const widthPercentage = Math.min((duration / 60) * 100, 100);
                          return (                          <div
                            key={appointment.id}
                            className={`
                              timeline-appointment-block timeline-appointment-${appointment.status}
                              rounded-md px-2 py-1 cursor-pointer transition-all hover:shadow-md hover:border-l-6
                              ${getStatusColor(appointment.status)}
                            `}
                            style={{ width: `${Math.max(widthPercentage, 30)}%`, minWidth: '180px' }}
                            title={`${formatCustomerName(appointment.customer_name)} - ${service?.name || 'Serviço'} (${startTime} - ${endTime})`}
                          >
                            {/* Conteúdo compacto */}                            <div className="flex items-center justify-between h-6 w-full">
                              <div className="flex items-center space-x-1.5 flex-1 min-w-0 pr-3">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(appointment.status)}
                                </div>                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">                                    <span className="text-xs opacity-75 font-medium">
                                      {startTime}
                                    </span>                                    <span className="font-medium text-xs truncate max-w-20">
                                      {formatCustomerName(appointment.customer_name)}
                                    </span>
                                    {service && (
                                      <span className="text-xs opacity-60 truncate max-w-16">
                                        {service.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>                              {/* Botões de ação claramente separados no canto direito */}
                              <div className="flex items-center space-x-0.5 flex-shrink-0">                                {appointment.status === 'pending' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStatusChange(appointment.id, 'confirmed');
                                    }}
                                    className="w-5 h-5 bg-white text-emerald-400 rounded text-xs hover:bg-emerald-50 flex items-center justify-center font-bold border border-emerald-100 transition-colors"
                                    title="Confirmar"
                                  >
                                    ✓
                                  </button>
                                )}                                {appointment.status === 'confirmed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStatusChange(appointment.id, 'completed');
                                    }}
                                    className="w-5 h-5 bg-white text-emerald-400 rounded text-xs hover:bg-emerald-50 flex items-center justify-center font-bold border border-emerald-100 transition-colors"
                                    title="Concluir"
                                  >
                                    ✓
                                  </button>
                                )}

                                {appointment.status === 'confirmed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStatusChange(appointment.id, 'no_show');
                                    }}
                                    className="w-5 h-5 bg-white text-slate-400 rounded text-xs hover:bg-slate-50 flex items-center justify-center font-bold border border-slate-100 transition-colors"
                                    title="Marcar Falta"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  </button>
                                )}                                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStatusChange(appointment.id, 'cancelled_by_establishment');
                                    }}
                                    className="w-5 h-5 bg-white text-rose-400 rounded text-xs hover:bg-rose-50 flex items-center justify-center font-bold border border-rose-100 transition-colors"
                                    title="Cancelar"
                                  >
                                    ✕
                                  </button>
                                )}
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