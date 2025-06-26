import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/datepicker.css';
import Modal from './Modal';
import Button from './Button';
import Alert from './Alert';
import Badge from './Badge';
import { LoadingState } from './Loading';
import { getAvailableSlotsForService, updateAppointmentDateTime } from '../../services/appointmentService';
import { formatTime } from '../../utils/formatters';

const RescheduleModal = ({ isOpen, onClose, appointment, onReschedule, services, establishmentId }) => {
  const [selectedDate, setSelectedDate] = useState(appointment ? new Date(appointment.date || appointment.start_time) : new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [service, setService] = useState(null);
  
  // Inicializar o serviço do agendamento quando o modal abre
  useEffect(() => {
    if (appointment && services?.length > 0) {
      const appointmentService = services.find(s => s.id === appointment.service_id);
      setService(appointmentService || null);
    }
  }, [appointment, services]);
  
  // Reset o estado quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setSelectedSlot(null);
      setSlotsError('');
      setSubmitError('');
      setIsSubmitting(false);
    } else if (appointment) {
      // Quando o modal abre, definimos a data para a data atual do agendamento
      setSelectedDate(new Date(appointment.date || appointment.start_time));
    }
  }, [isOpen, appointment]);

  // Função para buscar os horários disponíveis
  const fetchAvailableSlots = useCallback(async () => {
    if (!appointment || !selectedDate || !service) return;
    
    setIsLoadingSlots(true);
    setSlotsError('');
    setAvailableSlots([]);
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const slotsData = await getAvailableSlotsForService(
        establishmentId, 
        service.id, 
        dateString,
        appointment.id  // Passar o ID do agendamento atual para excluí-lo da verificação de disponibilidade
      );
      setAvailableSlots(slotsData);
    } catch (err) {
      setSlotsError("Erro ao carregar horários disponíveis. Tente outra data.");
      console.error("Erro ao buscar horários:", err);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedDate, appointment, service, establishmentId]);

  useEffect(() => {
    if (isOpen && appointment && service) {
      fetchAvailableSlots();
    }
  }, [isOpen, fetchAvailableSlots, appointment, service]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !appointment) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Preparar a data e hora para o reagendamento
      const [hour, minute] = selectedSlot.split(':');
      const rescheduleDate = new Date(selectedDate);
      rescheduleDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // Chamar a API para reagendar
      await updateAppointmentDateTime(appointment.id, rescheduleDate.toISOString());
      
      // Callback de sucesso
      onReschedule();
      onClose();
    } catch (err) {
      setSubmitError("Não foi possível reagendar. O horário pode não estar mais disponível.");
      console.error("Erro ao reagendar:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment || !service) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Reagendar Agendamento"
      size="lg" // Alterado para aumentar o tamanho do modal
    >
      <div className="space-y-6">
        {/* Título do agendamento sendo reagendado */}
        <div className="text-center mb-4">
          <Badge variant="primary" className="mb-2">
            {service.name}
          </Badge>
          <p className="text-sm text-secondary-500">
            Selecione uma nova data e horário
          </p>
        </div>

        {/* Layout mais limpo e centralizado */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6">
          {/* Seleção de nova data - centralizada */}
          <div className="mb-6 sm:mb-0">
            <DatePicker 
              selected={selectedDate} 
              onChange={handleDateChange} 
              inline 
              minDate={new Date()}
              calendarClassName="modern-calendar"
            />
          </div>
          
          {/* Seleção de novo horário */}
          <div className="w-full sm:w-auto">
            <h3 className="text-sm font-medium text-secondary-700 mb-3 text-center">
              Horários disponíveis
            </h3>
            {isLoadingSlots ? (
              <LoadingState message="Buscando horários disponíveis..." size="sm" />
            ) : slotsError ? (
              <Alert type="error">
                {slotsError}
              </Alert>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot, index) => (
                  <Button 
                    key={index} 
                    onClick={() => handleSelectSlot(slot)}
                    variant={selectedSlot === slot ? "primary" : "outline"}
                    size="sm"
                    className={selectedSlot === slot ? "" : "hover:bg-primary-50"}
                  >
                    {slot.substring(0, 5)}
                  </Button>
                ))}
              </div>
            ) : (
              <Alert type="warning">
                Nenhum horário disponível para esta data. Tente selecionar outra data.
              </Alert>
            )}
          </div>
        </div>

        {/* Separação visual entre horários e botões de ação */}
        <hr className="my-6 border-t border-gray-200" />

        {submitError && (
          <Alert type="error" className="max-w-md mx-auto mt-4">{submitError}</Alert>
        )}
        
        <div className="flex justify-center space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedSlot || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Reagendando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RescheduleModal;
