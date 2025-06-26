import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';
import Alert from '../common/Alert';

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const ProfessionalForm = ({ professional, onSubmit, isLoading, services = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    description: '',
    is_active: true,
    service_ids: [],
    working_hours: {}
  });
  
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  // Inicializar dados do formulário
  useEffect(() => {
    if (professional) {
      setFormData({
        name: professional.name || '',
        email: professional.email || '',
        phone: professional.phone || '',
        specialty: professional.specialty || '',
        description: professional.description || '',
        is_active: professional.is_active ?? true,
        service_ids: professional.services?.map(s => s.id) || [],
        working_hours: professional.working_hours || {}
      });
    } else {
      // Inicializar horários padrão para novo profissional
      const defaultHours = {};
      daysOfWeek.forEach(day => {
        defaultHours[day.key] = {
          is_active: false,
          start_time: '09:00',
          end_time: '18:00',
          lunch_break_start_time: '12:00',
          lunch_break_end_time: '13:00'
        };
      });
      
      setFormData(prev => ({
        ...prev,
        working_hours: defaultHours
      }));
    }
  }, [professional]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day],
          [field]: value
        }
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.specialty.trim()) {
      newErrors.specialty = 'Especialidade é obrigatória';
    }
    
    if (formData.service_ids.length === 0) {
      newErrors.services = 'Selecione pelo menos um serviço';
    }

    // Validar horários (pelo menos um dia ativo)
    const hasActiveDay = Object.values(formData.working_hours).some(day => day.is_active);
    if (!hasActiveDay) {
      newErrors.working_hours = 'Configure pelo menos um dia de trabalho';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Dados Básicos' },
    { id: 'services', label: 'Serviços' },
    { id: 'hours', label: 'Horários' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Navegação por abas */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
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

      {/* Dados Básicos */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Nome *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Nome completo do profissional"
            />
            
            <InputField
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Telefone *"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={errors.phone}
              placeholder="(11) 99999-9999"
            />
            
            <InputField
              label="Especialidade *"
              value={formData.specialty}
              onChange={(e) => handleInputChange('specialty', e.target.value)}
              error={errors.specialty}
              placeholder="Ex: Cabeleireiro, Esteticista, Massagista"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Descrição
            </label>
            <textarea
              rows={3}
              className="block w-full border border-secondary-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Breve descrição sobre o profissional e sua experiência..."
            />
          </div>

          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-secondary-900">
              Profissional ativo (disponível para agendamentos)
            </label>
          </div>
        </div>
      )}

      {/* Serviços */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Serviços que o profissional realiza
            </h3>
            <p className="text-sm text-secondary-600 mb-4">
              Selecione os serviços que este profissional está apto a realizar.
            </p>
          </div>

          {errors.services && (
            <Alert type="error">
              {errors.services}
            </Alert>
          )}

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    formData.service_ids.includes(service.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 bg-white hover:border-secondary-300'
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        checked={formData.service_ids.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <label className="font-medium text-secondary-900 cursor-pointer">
                        {service.name}
                      </label>
                      <p className="text-sm text-secondary-600">
                        R$ {service.price} • {service.duration} min
                      </p>
                      {service.description && (
                        <p className="text-sm text-secondary-500 mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert type="info">
              Nenhum serviço cadastrado. Cadastre serviços primeiro na aba "Serviços" do dashboard.
            </Alert>
          )}
        </div>
      )}

      {/* Horários de Trabalho */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Horários de Trabalho
            </h3>
            <p className="text-sm text-secondary-600 mb-4">
              Configure os dias e horários que este profissional trabalha.
            </p>
          </div>

          {errors.working_hours && (
            <Alert type="error">
              {errors.working_hours}
            </Alert>
          )}

          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const dayConfig = formData.working_hours[day.key] || {
                is_active: false,
                start_time: '09:00',
                end_time: '18:00',
                lunch_break_start_time: '12:00',
                lunch_break_end_time: '13:00'
              };

              return (
                <div key={day.key} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id={`day-${day.key}`}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                      checked={dayConfig.is_active}
                      onChange={(e) => handleWorkingHoursChange(day.key, 'is_active', e.target.checked)}
                    />
                    <label htmlFor={`day-${day.key}`} className="ml-2 text-sm font-medium text-secondary-900">
                      {day.label}
                    </label>
                  </div>

                  {dayConfig.is_active && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ml-6">
                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Início
                        </label>
                        <input
                          type="time"
                          className="block w-full border border-secondary-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                          value={dayConfig.start_time}
                          onChange={(e) => handleWorkingHoursChange(day.key, 'start_time', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Fim
                        </label>
                        <input
                          type="time"
                          className="block w-full border border-secondary-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                          value={dayConfig.end_time}
                          onChange={(e) => handleWorkingHoursChange(day.key, 'end_time', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Almoço (início)
                        </label>
                        <input
                          type="time"
                          className="block w-full border border-secondary-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                          value={dayConfig.lunch_break_start_time}
                          onChange={(e) => handleWorkingHoursChange(day.key, 'lunch_break_start_time', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Almoço (fim)
                        </label>
                        <input
                          type="time"
                          className="block w-full border border-secondary-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                          value={dayConfig.lunch_break_end_time}
                          onChange={(e) => handleWorkingHoursChange(day.key, 'lunch_break_end_time', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {professional ? 'Atualizar Profissional' : 'Criar Profissional'}
        </Button>
      </div>
    </form>
  );
};

export default ProfessionalForm;
