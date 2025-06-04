// src/components/dashboard/WorkingHoursForm.js
import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField'; // Seu componente de input
import Button from '../common/Button';     // Seu componente de botão
// A estrutura do WorkingHoursConfig e DayWorkingHours do backend nos guia aqui
// Poderíamos até definir tipos/interfaces TypeScript se estivéssemos usando TS

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

// Estrutura inicial para um dia (para usar como default ou ao resetar)
const initialDayState = {
  is_active: false,
  start_time: '',
  end_time: '',
  lunch_break_start_time: '',
  lunch_break_end_time: '',
};

const WorkingHoursForm = ({ initialConfig, onSave, isLoading, error }) => {
  // Estado para os horários de cada dia
  const [workingHours, setWorkingHours] = useState({});
  // Estado para o intervalo de agendamento
  const [appointmentIntervalMinutes, setAppointmentIntervalMinutes] = useState(30);

  // useEffect para popular o formulário com a configuração inicial ou defaults
  useEffect(() => {
    const newWorkingHours = {};
    daysOfWeek.forEach(day => {
      newWorkingHours[day.key] = initialConfig?.[day.key] 
        ? { ...initialConfig[day.key] } // Copia os valores existentes
        : { ...initialDayState };     // Usa o estado inicial para dias não configurados
    });
    setWorkingHours(newWorkingHours);
    setAppointmentIntervalMinutes(
      initialConfig?.appointment_interval_minutes || 30
    );
  }, [initialConfig]); // Roda quando initialConfig mudar

  const handleDayChange = (dayKey, field, value) => {
    // Para o checkbox 'is_active', o valor é 'checked'
    const fieldValue = field === 'is_active' ? value.target.checked : value.target.value;
    setWorkingHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: fieldValue,
      },
    }));
  };

  const handleIntervalChange = (event) => {
    setAppointmentIntervalMinutes(parseInt(event.target.value, 10) || 30);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const configToSave = {
      ...workingHours,
      appointment_interval_minutes: appointmentIntervalMinutes,
    };
    // Adicionar aqui validações no frontend antes de salvar, se desejar
    console.log("Salvando configuração de horários:", configToSave);
    onSave(configToSave); // Chama a função passada por prop para salvar
  };

  // Se workingHours ainda não foi populado pelo useEffect, pode mostrar um loading
  if (Object.keys(workingHours).length === 0 && initialConfig) {
      return <p>Carregando configuração de horários...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 border rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Configurar Horários de Atendimento</h3>
      
      {daysOfWeek.map(day => (
        <div key={day.key} className="p-3 border rounded-md space-y-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <label htmlFor={`${day.key}-isActive`} className="font-medium text-gray-700">
              {day.label}
            </label>
            <input
              type="checkbox"
              id={`${day.key}-isActive`}
              name={`${day.key}-isActive`}
              checked={workingHours[day.key]?.is_active || false}
              onChange={(e) => handleDayChange(day.key, 'is_active', e)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          {workingHours[day.key]?.is_active && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 pt-2 border-t mt-2">
              <InputField
                label="Início Expediente"
                type="time"
                name={`${day.key}-startTime`}
                value={workingHours[day.key]?.start_time || ''}
                onChange={(e) => handleDayChange(day.key, 'start_time', e)}
                disabled={isLoading}
              />
              <InputField
                label="Fim Expediente"
                type="time"
                name={`${day.key}-endTime`}
                value={workingHours[day.key]?.end_time || ''}
                onChange={(e) => handleDayChange(day.key, 'end_time', e)}
                disabled={isLoading}
              />
              <InputField
                label="Início Pausa"
                type="time"
                name={`${day.key}-lunchBreakStartTime`}
                value={workingHours[day.key]?.lunch_break_start_time || ''}
                onChange={(e) => handleDayChange(day.key, 'lunch_break_start_time', e)}
                disabled={isLoading}
              />
              <InputField
                label="Fim Pausa"
                type="time"
                name={`${day.key}-lunchBreakEndTime`}
                value={workingHours[day.key]?.lunch_break_end_time || ''}
                onChange={(e) => handleDayChange(day.key, 'lunch_break_end_time', e)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      ))}

      <div className="pt-4 border-t">
        <InputField
          label="Intervalo entre Agendamentos (minutos)"
          type="number"
          name="appointmentIntervalMinutes"
          value={appointmentIntervalMinutes}
          onChange={handleIntervalChange}
          min="1" // Pydantic tem gt=0, HTML5 min="1"
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <Button type="submit" className="w-full bg-green-500 hover:bg-green-700" disabled={isLoading}>
        {isLoading ? 'Salvando Horários...' : 'Salvar Horários de Atendimento'}
      </Button>
    </form>
  );
};

export default WorkingHoursForm;

/*
Explicação do WorkingHoursForm.js:
- Props:
  - initialConfig: Um objeto contendo a configuração de horários atual do estabelecimento (o working_hours_config que vem do backend).
  - onSave: Uma função (que será passada pela DashboardPage) a ser chamada quando o formulário for submetido, passando a nova configuração de horários.
  - isLoading, error: Para feedback visual durante o salvamento.
- daysOfWeek e initialDayState: Arrays/Objetos para ajudar a gerar o formulário e a definir valores padrão.

- Estados Internos:
  - workingHours: Um objeto onde cada chave é um dia da semana (ex: "monday") e o valor é um objeto com os horários daquele dia ({ is_active, start_time, ... }).
  - appointmentIntervalMinutes: Para o intervalo de agendamento.
- useEffect: Quando o componente recebe initialConfig (ou quando initialConfig muda), ele popula o estado workingHours e appointmentIntervalMinutes. Se initialConfig não tiver dados para um dia, ele usa initialDayState.
- handleDayChange(dayKey, field, event): Uma função para atualizar o estado workingHours quando qualquer campo de um dia específico é alterado (checkbox is_active ou os inputs de hora).
- handleIntervalChange(event): Atualiza o estado appointmentIntervalMinutes.
- handleSubmit(event):
  - Previne o default do formulário.
  - Monta o objeto configToSave com os dados dos estados.
  - Chama a função onSave(configToSave) passada por prop.

- JSX do Formulário:
  - Mapeia o array daysOfWeek para renderizar uma seção para cada dia.
  - Cada dia tem um checkbox para is_active.
  - Se is_active for true, os campos de input para start_time, end_time, lunch_break_start_time, lunch_break_end_time são exibidos (usando seu componente InputField com type="time").
  - Um InputField para appointmentIntervalMinutes.
  - Exibe a mensagem de error (passada por prop).
  - Um botão "Salvar Horários" que fica desabilitado e mostra "Salvando..." quando isLoading (passado por prop) é true.
*/
