// src/pages/BookingPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getEstablishmentDetails } from '../services/establishmentService';
import { getServicesByEstablishment } from '../services/serviceService';
import { getAvailableSlotsForService, createAppointment } from '../services/appointmentService';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';

const BookingPage = () => {
  const { establishmentId } = useParams();
  const navigate = useNavigate();

  // Estados para dados iniciais
  const [establishment, setEstablishment] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para o fluxo de agendamento
  const [step, setStep] = useState(1); // 1: Serviço, 2: Data/Hora, 3: Dados, 4: Confirmação
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Estados para o formulário do cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Estados para o envio final
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Efeito para buscar dados iniciais (estabelecimento e serviços)
  useEffect(() => {
    const fetchPublicData = async () => {
      if (!establishmentId) {
        setError("ID do estabelecimento não fornecido.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [establishmentData, servicesData] = await Promise.all([
          getEstablishmentDetails(establishmentId),
          getServicesByEstablishment(establishmentId)
        ]);
        setEstablishment(establishmentData);
        setServices(servicesData.filter(service => service.is_active));
      } catch (err) {
        setError("Não foi possível carregar a página. Verifique o link.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicData();
  }, [establishmentId]);

  // Efeito para buscar horários disponíveis
  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedService || !selectedDate) return;
    setIsLoadingSlots(true);
    setSlotsError('');
    setAvailableSlots([]);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const slotsData = await getAvailableSlotsForService(establishmentId, selectedService.id, dateString);
      setAvailableSlots(slotsData);
    } catch (err) {
      setSlotsError("Não foi possível carregar os horários. Tente outra data.");
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedService, selectedDate, establishmentId]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  // Handlers para o fluxo
  const handleSelectService = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };
  
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!customerName || !customerPhone) {
      setBookingError("Por favor, preencha seu nome e telefone.");
      return;
    }
    setIsBooking(true);
    setBookingError('');
    try {
      const [hour, minute] = selectedSlot.split(':');
      const finalStartTime = new Date(selectedDate);
      finalStartTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

      const appointmentData = {
        start_time: finalStartTime.toISOString(),
        service_id: selectedService.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        notes_by_customer: customerNotes || null
      };
      await createAppointment(establishmentId, appointmentData);
      setStep(4);
    } catch (err) {
      setBookingError(err.detail || "Não foi possível concluir seu agendamento. O horário pode ter sido ocupado. Por favor, tente novamente.");
    } finally {
      setIsBooking(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Selecionar Serviço
        return (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">1. Escolha um Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <div key={service.id} onClick={() => handleSelectService(service)} className="p-6 border rounded-lg shadow-md hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer bg-white">
                  <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                  {service.description && <p className="text-gray-600 mt-2">{service.description}</p>}
                  <div className="flex justify-between items-center mt-4 text-gray-700">
                    <span>Duração: {service.duration_minutes} min</span>
                    <span className="text-lg font-semibold">R$ {service.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 2: // Selecionar Data e Horário
        return (
          <div className="mt-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-700">2. Escolha uma Data e Horário</h2>
              <p className="text-gray-600">Serviço: <span className="font-bold">{selectedService.name}</span></p>
              <button onClick={() => { setSelectedService(null); setStep(1); }} className="text-sm text-blue-500 hover:underline mt-1">Trocar serviço</button>
            </div>
            <div className="text-center bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
              <p className="font-bold">Atenção</p>
              <p>Todos os horários são exibidos no fuso horário do estabelecimento: <span className="font-semibold">{establishment.timezone}</span></p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
              <div className="flex flex-col items-center">
                <h3 className="font-semibold mb-2">Data</h3>
                <DatePicker selected={selectedDate} onChange={handleDateChange} inline minDate={new Date()} />
              </div>
              <div className="flex flex-col items-center w-full md:w-1/3 max-h-96 overflow-y-auto p-2">
                <h3 className="font-semibold mb-2">Horários Disponíveis</h3>
                {isLoadingSlots && <p>Buscando horários...</p>}
                {slotsError && <p className="text-red-500 text-sm">{slotsError}</p>}
                {!isLoadingSlots && !slotsError && availableSlots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {availableSlots.map((slot, index) => (
                      <Button key={index} onClick={() => handleSelectSlot(slot)}>
                        {slot.substring(0, 5)}
                      </Button>
                    ))}
                  </div>
                )}
                {!isLoadingSlots && !slotsError && availableSlots.length === 0 && (
                  <p className="text-gray-500 text-sm mt-2">Nenhum horário disponível para esta data.</p>
                )}
              </div>
            </div>
          </div>
        );
      case 3: // Preencher Dados do Cliente
        return (
          <div className="mt-8 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-700">3. Seus Dados</h2>
              <p className="text-gray-600">Você está agendando <span className="font-bold">{selectedService.name}</span> para <span className="font-bold">{selectedDate.toLocaleDateString()} às {selectedSlot.substring(0, 5)}</span>.</p>
              <button onClick={() => { setSelectedSlot(null); setStep(2); }} className="text-sm text-blue-500 hover:underline mt-1">Trocar horário</button>
            </div>
            <form onSubmit={handleBookingSubmit} className="space-y-4 p-6 bg-white shadow-md rounded-lg">
              <InputField label="Seu Nome Completo" name="customerName" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
              <InputField label="Seu Telefone (WhatsApp)" name="customerPhone" type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
              <InputField label="Seu Email (Opcional)" name="customerEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
              <InputField label="Observações (Opcional)" name="customerNotes" type="text" value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} />
              {bookingError && <p className="text-red-500 text-sm">{bookingError}</p>}
              <Button type="submit" className="w-full bg-green-500 hover:bg-green-700" disabled={isBooking}>
                {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>
            </form>
          </div>
        );
      case 4: // Confirmação
        return (
          <div className="text-center p-10 max-w-lg mx-auto bg-white shadow-md rounded-lg">
            <h2 className="text-3xl font-bold text-green-600 mb-4">Agendamento Confirmado!</h2>
            <p className="text-gray-700">Obrigado, <span className="font-semibold">{customerName}</span>!</p>
            <p className="text-gray-600 mt-2">Seu agendamento para o serviço <span className="font-semibold">{selectedService.name}</span> foi marcado com sucesso para o dia <span className="font-semibold">{selectedDate.toLocaleDateString()} às {selectedSlot.substring(0, 5)}</span>.</p>
            <p className="text-gray-600 mt-4">Você receberá um lembrete no seu WhatsApp. Até breve!</p>
            <Button onClick={() => window.location.reload()} className="mt-6">Fazer Novo Agendamento</Button>
          </div>
        );
      default:
        return <p>Algo deu errado.</p>;
    }
  };

  if (isLoading) return <div className="text-center p-10">Carregando...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Erro: {error}</div>;
  if (!establishment) return <div className="text-center p-10">Estabelecimento não encontrado.</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">{establishment.name}</h1>
      </header>
      <main>
        {renderStepContent()}
      </main>
    </div>
  );
};

export default BookingPage;