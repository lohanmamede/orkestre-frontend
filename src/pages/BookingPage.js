// src/pages/BookingPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/datepicker.css';
import { getEstablishmentDetails } from '../services/establishmentService';
import { getServicesByEstablishment } from '../services/serviceService';
import { getAvailableSlotsForService, createAppointment } from '../services/appointmentService';
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import Card from '../components/common/Card';
import Container from '../components/common/Container';
import Alert from '../components/common/Alert';
import { LoadingState } from '../components/common/Loading';
import Badge from '../components/common/Badge';

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
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                <span className="text-primary-600 font-semibold text-lg">1</span>
              </div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">Escolha um Serviço</h2>
              <p className="text-secondary-600">Selecione o serviço que você deseja agendar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <Card 
                  key={service.id} 
                  onClick={() => handleSelectService(service)}
                  hover={true}
                  className="h-full cursor-pointer group"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-secondary-600 mt-2 line-clamp-3">{service.description}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-secondary-100">
                      <div className="flex items-center text-secondary-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{service.duration_minutes} min</span>
                      </div>
                      <div className="text-2xl font-bold text-primary-600">
                        R$ {service.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );      case 2: // Selecionar Data e Horário
        return (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                <span className="text-primary-600 font-semibold text-lg">2</span>
              </div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">Escolha Data e Horário</h2>
              <div className="inline-flex items-center bg-primary-50 rounded-lg px-4 py-2 mb-2">
                <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-primary-800 font-medium">{selectedService.name}</span>
              </div>
              <button 
                onClick={() => { setSelectedService(null); setStep(1); }} 
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Trocar serviço
              </button>
            </div>

            <Alert type="info" className="mb-8">
              <strong>Fuso horário:</strong> Todos os horários são exibidos no fuso horário do estabelecimento ({establishment.timezone})
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="text-center">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Selecione a Data</h3>
                <div className="inline-block">
                  <DatePicker 
                    selected={selectedDate} 
                    onChange={handleDateChange} 
                    inline 
                    minDate={new Date()}
                    calendarClassName="modern-calendar"
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Horários Disponíveis</h3>
                {isLoadingSlots ? (
                  <LoadingState message="Buscando horários disponíveis..." size="sm" />
                ) : slotsError ? (
                  <Alert type="error">
                    {slotsError}
                  </Alert>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map((slot, index) => (
                      <Button 
                        key={index} 
                        onClick={() => handleSelectSlot(slot)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-primary-50"
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
              </Card>
            </div>
          </div>
        );      case 3: // Preencher Dados do Cliente
        return (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                <span className="text-primary-600 font-semibold text-lg">3</span>
              </div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">Seus Dados</h2>
              
              <Card padding="md" className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-success-500 rounded-full mr-3"></div>
                    <div className="text-left">
                      <p className="font-semibold text-secondary-900">{selectedService.name}</p>
                      <p className="text-sm text-secondary-600">
                        {selectedDate.toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} às {selectedSlot.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedSlot(null); setStep(2); }} 
                    className="text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    Alterar
                  </button>
                </div>
              </Card>
            </div>

            <Card>
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Nome Completo" 
                    name="customerName" 
                    type="text" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    required 
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                  <InputField 
                    label="Telefone (WhatsApp)" 
                    name="customerPhone" 
                    type="tel" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)} 
                    required 
                    hint="Formato: (11) 99999-9999"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    }
                  />
                </div>
                
                <InputField 
                  label="Email (Opcional)" 
                  name="customerEmail" 
                  type="email" 
                  value={customerEmail} 
                  onChange={e => setCustomerEmail(e.target.value)}
                  hint="Para receber confirmações por email"
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Observações (Opcional)
                  </label>
                  <textarea
                    name="customerNotes"
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    placeholder="Alguma informação adicional que gostaria de compartilhar..."
                    rows={3}
                    className="block w-full px-3 py-2.5 text-sm bg-white border border-secondary-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {bookingError && (
                  <Alert type="error">
                    {bookingError}
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => { setSelectedSlot(null); setStep(2); }}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="success"
                    loading={isBooking}
                    disabled={isBooking}
                    className="flex-1"
                  >
                    {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        );      case 4: // Confirmação
        return (
          <div className="animate-fade-in max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-secondary-900 mb-4">Agendamento Confirmado!</h2>
              <p className="text-xl text-secondary-600">
                Obrigado, <span className="font-semibold text-primary-600">{customerName}</span>!
              </p>
            </div>

            <Card className="mb-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-secondary-100">
                  <span className="text-secondary-600">Serviço:</span>
                  <span className="font-semibold text-secondary-900">{selectedService.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-secondary-100">
                  <span className="text-secondary-600">Data:</span>
                  <span className="font-semibold text-secondary-900">
                    {selectedDate.toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-secondary-100">
                  <span className="text-secondary-600">Horário:</span>
                  <span className="font-semibold text-secondary-900">{selectedSlot.substring(0, 5)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-secondary-600">Duração:</span>
                  <span className="font-semibold text-secondary-900">{selectedService.duration_minutes} minutos</span>
                </div>
              </div>
            </Card>

            <Alert type="success" className="mb-8">
              <div className="text-left">
                <p className="font-medium mb-2">Próximos passos:</p>
                <ul className="text-sm space-y-1">
                  <li>• Você receberá um lembrete no seu WhatsApp</li>
                  <li>• Chegue 10 minutos antes do horário marcado</li>
                  <li>• Em caso de imprevisto, entre em contato conosco</li>
                </ul>
              </div>
            </Alert>

            <div className="space-y-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Fazer Novo Agendamento
              </Button>
              <div className="text-sm text-secondary-500">
                Agendamento realizado em {establishment.name}
              </div>
            </div>
          </div>
        );
      default:
        return <p>Algo deu errado.</p>;
    }
  };
  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <LoadingState message="Carregando informações do estabelecimento..." />
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <Container size="sm">
        <Card className="text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-secondary-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Tentar Novamente
          </Button>
        </Card>
      </Container>
    </div>
  );
  
  if (!establishment) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <Container size="sm">
        <Card className="text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Estabelecimento não encontrado</h2>
          <p className="text-secondary-600 mb-6">Verifique se o link está correto e tente novamente.</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Tentar Novamente
          </Button>
        </Card>
      </Container>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Container className="py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-secondary-900 mb-4">
            {establishment.name}
          </h1>
          <div className="flex items-center justify-center space-x-6 text-secondary-600">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Agendamento Online</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Confirmação Instantânea</span>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                  ${step >= stepNumber 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-secondary-200 text-secondary-500'
                  }
                `}>
                  {step > stepNumber ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 4 && (
                  <div className={`
                    w-16 h-0.5 mx-2 transition-all
                    ${step > stepNumber ? 'bg-primary-600' : 'bg-secondary-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-secondary-700">
              {step === 1 && 'Escolha um Serviço'}
              {step === 2 && 'Selecione Data e Horário'}
              {step === 3 && 'Preencha seus Dados'}
              {step === 4 && 'Confirmação'}
            </h3>
          </div>
        </div>

        {/* Main Content */}
        <main>
          {renderStepContent()}
        </main>
      </Container>
    </div>
  );
};

export default BookingPage;