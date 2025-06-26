// src/components/dashboard/AppointmentDetailsModal.js

import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { STATUS_LABELS, STATUS_COLORS } from '../../services/statusValidationService';
import { formatCustomerName } from '../../utils/formatters';

const AppointmentDetailsModal = ({ 
  isOpen, 
  onClose, 
  appointment, 
  getServiceForAppointment,
  onStatusChange 
}) => {
  // Fechar modal com ESC
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  const service = getServiceForAppointment ? getServiceForAppointment(appointment) : appointment.service;

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || status;
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

  // Fechar modal ao clicar no backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header compacto */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Agendamento</h2>
            <Badge 
              variant={getStatusColor(appointment.status)} 
              size="sm"
            >
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Card único integrado - Layout otimizado */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            
            {/* Seção Cliente e Profissional - Compacta */}
            <div className="pb-4 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Cliente */}
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${getAvatarColor(appointment.customer_name || 'Cliente')}`}>
                    {appointment.customer_photo ? (
                      <img 
                        src={appointment.customer_photo} 
                        alt={appointment.customer_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{getCustomerInitials(appointment.customer_name)}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1 text-left">CLIENTE</p>
                    <h3 className="text-sm font-semibold text-gray-900 text-left truncate">
                      {appointment.customer_name || 'Cliente não informado'}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-gray-600">
                      {appointment.customer_phone && (
                        <div className="flex items-center text-left">
                          <svg className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="truncate">{appointment.customer_phone}</span>
                        </div>
                      )}
                      {appointment.customer_email && (
                        <div className="flex items-center text-left">
                          <svg className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{appointment.customer_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profissional */}
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${getAvatarColor(appointment.professional_name || 'Profissional')}`}>
                    {appointment.professional_photo ? (
                      <img 
                        src={appointment.professional_photo} 
                        alt={appointment.professional_name || 'Profissional'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : appointment.professional_name ? (
                      <span className="text-sm">{getProfessionalInitials(appointment.professional_name)}</span>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1 text-left">PROFISSIONAL</p>
                    <h3 className="text-sm font-semibold text-gray-900 text-left truncate">
                      {appointment.professional_name || 'Não atribuído'}
                    </h3>
                    <p className="text-xs text-gray-600 text-left">Responsável pelo atendimento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Data/Hora e Serviço - Compacta */}
            <div className="py-4 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Data e Horário */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1 text-left">AGENDAMENTO</p>
                    <p className="text-sm font-semibold text-gray-900 text-left">
                      {format(parseISO(appointment.start_time), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-600 text-left">
                      {format(parseISO(appointment.start_time), 'HH:mm')}
                      {service && <span> • {service.duration_minutes} min</span>}
                    </p>
                  </div>
                </div>

                {/* Serviço e Preço */}
                {service && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-1 text-left">SERVIÇO</p>
                      <p className="text-sm font-semibold text-gray-900 text-left truncate">{service.name}</p>
                      <p className="text-sm font-bold text-green-600 text-left">R$ {service.price.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observações compactas */}
            {(appointment.notes_by_customer || appointment.notes_by_establishment) && (
              <div className="pt-4 space-y-2">
                
                {/* Observação do Cliente */}
                {appointment.notes_by_customer && (
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Observação do Cliente</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {appointment.notes_by_customer}
                      </p>
                    </div>
                  </div>
                )}

                {/* Observação do Estabelecimento */}
                {appointment.notes_by_establishment && (
                  <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">Observação do Estabelecimento</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {appointment.notes_by_establishment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer - Data de criação */}
            {appointment.created_at && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Agendado em {format(parseISO(appointment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm"
          >
            Fechar
          </Button>
          
          {onStatusChange && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onStatusChange(appointment.id, "SHOW_RESCHEDULE_MODAL");
                  onClose();
                }}
                className="text-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Reagendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onStatusChange(appointment.id, "SHOW_CANCEL_MODAL");
                  onClose();
                }}
                className="text-sm text-red-600 border-red-200 hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
