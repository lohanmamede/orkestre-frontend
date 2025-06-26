import { validateStatusTransition, AppointmentStatus } from './statusValidationService';

describe('StatusValidationService - Temporal Rules', () => {
  
  // Função helper para criar um agendamento de teste
  const createAppointment = (status, hoursAgo) => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hoursAgo);
    
    return {
      status: status,
      start_time: startTime.toISOString()
    };
  };

  describe('Agendamentos passados - Regras temporais críticas', () => {
    
    test('CONFIRMED passado deve permitir transição para COMPLETED com confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.CONFIRMED, 1); // 1 hora atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.COMPLETED);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning'); // Agora deve exigir confirmação
      expect(result.message).toContain('concluído');
    });

    test('CONFIRMED passado deve permitir transição para NO_SHOW com confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.CONFIRMED, 2); // 2 horas atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.NO_SHOW);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning'); // Agora deve exigir confirmação
      expect(result.message).toContain('não compareceu');
    });

    test('RESCHEDULED passado deve permitir transição para COMPLETED com confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.RESCHEDULED, 1); // 1 hora atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.COMPLETED);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning'); // Agora deve exigir confirmação
      expect(result.message).toContain('concluído');
    });

    test('RESCHEDULED passado deve permitir transição para NO_SHOW com confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.RESCHEDULED, 3); // 3 horas atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.NO_SHOW);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning'); // Agora deve exigir confirmação
      expect(result.message).toContain('não compareceu');
    });

    test('PENDING passado deve permitir transição para COMPLETED com confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.PENDING, 1); // 1 hora atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.COMPLETED);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning'); // Agora deve exigir confirmação
      expect(result.message).toContain('concluído');
    });

    test('PENDING passado deve permitir transição para NO_SHOW com confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.PENDING, 2); // 2 horas atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.NO_SHOW);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning'); // Agora deve exigir confirmação
      expect(result.message).toContain('não compareceu');
    });

    test('Agendamento CONFIRMED passado NÃO deve permitir transição para CANCELLED', () => {
      const appointment = createAppointment(AppointmentStatus.CONFIRMED, 1); // 1 hora atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.CANCELLED_BY_CLIENT);
      
      expect(result.valid).toBe(false);
      expect(result.type).toBe('error');
    });

  });

  describe('Agendamentos futuros - Regras normais devem se aplicar', () => {
    
    test('CONFIRMED futuro deve permitir transição para CANCELLED', () => {
      const appointment = createAppointment(AppointmentStatus.CONFIRMED, -1); // 1 hora no futuro
      const result = validateStatusTransition(appointment, AppointmentStatus.CANCELLED_BY_CLIENT);
      
      expect(result.valid).toBe(true);
    });

    test('CONFIRMED futuro NÃO deve permitir transição para COMPLETED', () => {
      const appointment = createAppointment(AppointmentStatus.CONFIRMED, -1); // 1 hora no futuro
      const result = validateStatusTransition(appointment, AppointmentStatus.COMPLETED);
      
      expect(result.valid).toBe(false);
      expect(result.type).toBe('error');
    });

  });

  describe('Confirmações - Todas as transições devem mostrar alerta', () => {
    
    test('PENDING → CONFIRMED deve exigir confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.PENDING, -1); // Futuro
      const result = validateStatusTransition(appointment, AppointmentStatus.CONFIRMED);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning');
      expect(result.message).toContain('confirmar');
    });

    test('CONFIRMED → IN_PROGRESS deve exigir confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.CONFIRMED, -0.5); // 30 min no futuro
      const result = validateStatusTransition(appointment, AppointmentStatus.IN_PROGRESS);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning');
      expect(result.message).toContain('iniciar');
    });

    test('IN_PROGRESS → COMPLETED deve exigir confirmação', () => {
      const appointment = createAppointment(AppointmentStatus.IN_PROGRESS, 0.5); // 30 min atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.COMPLETED);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning');
      expect(result.message).toContain('finalizar');
    });

    test('CONFIRMED → COMPLETED (passado) deve exigir confirmação mesmo sendo temporal', () => {
      const appointment = createAppointment(AppointmentStatus.CONFIRMED, 1); // 1 hora atrás
      const result = validateStatusTransition(appointment, AppointmentStatus.COMPLETED);
      
      // Agora TODAS as transições exigem confirmação, mesmo as temporais
      expect(result.valid).toBe(true);
      expect(result.type).toBe('warning'); // Deve mostrar confirmação
      expect(result.message).toContain('concluído');
    });

  });

  describe('Reagendamentos - RESCHEDULED deve poder ser reagendado', () => {
    
    test('RESCHEDULED deve permitir nova transição para RESCHEDULED', () => {
      const appointment = createAppointment(AppointmentStatus.RESCHEDULED, -1); // Futuro
      const result = validateStatusTransition(appointment, AppointmentStatus.RESCHEDULED);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('success'); // Reagendamento tem fluxo próprio, sem confirmação dupla
    });

    test('RESCHEDULED deve aparecer nos botões permitidos para status RESCHEDULED', () => {
      const { getAllowedButtons } = require('./statusValidationService');
      const appointment = createAppointment(AppointmentStatus.RESCHEDULED, -1); // Futuro
      const allowedButtons = getAllowedButtons(appointment);
      
      expect(allowedButtons).toContain(AppointmentStatus.RESCHEDULED);
    });

  });

});
