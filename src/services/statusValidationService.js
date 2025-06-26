// src/services/statusValidationService.js

/**
 * Enum de status disponíveis para agendamentos
 * IMPORTANTE: Deve estar sincronizado com os valores do backend
 */
export const AppointmentStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  CANCELLED_BY_CLIENT: 'cancelled_by_client',
  CANCELLED_BY_ESTABLISHMENT: 'cancelled_by_establishment',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled'
};

/**
 * Matriz de transições que são IMPOSSÍVEIS e devem ser bloqueadas
 * Baseada na documentação e no serviço de validação do backend
 */
export const BLOCKED_TRANSITIONS = {
  [AppointmentStatus.COMPLETED]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED_BY_CLIENT, 
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.RESCHEDULED
  ],
  [AppointmentStatus.CANCELLED_BY_CLIENT]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT
  ],
  [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED_BY_CLIENT
  ],
  [AppointmentStatus.NO_SHOW]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT
  ]
};

/**
 * Transições que precisam de confirmação (exibir alerta)
 */
export const WARNING_TRANSITIONS = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.CANCELLED_BY_CLIENT
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.NO_SHOW
  ]
};

/**
 * Mensagens para os diferentes tipos de transições
 */
export const TRANSITION_MESSAGES = {
  // Mensagens de erro (BLOCK)
  error: {
    same_status: "O agendamento já está com este status.",
    forbidden_transition: "Esta transição de status não é permitida pelo sistema.",
    completed_cannot_change: "Um agendamento concluído não pode ser alterado.",
    cancelled_to_completed: "Um agendamento cancelado não pode ser marcado como concluído.",
    cancelled_to_no_show: "Um agendamento cancelado não pode ser marcado como não-comparecimento.",
    no_show_to_confirmed: "Um agendamento com não-comparecimento não pode voltar a ser confirmado.",    too_early_for_completed: "Só é possível marcar como concluído após o horário de início.",
    too_early_for_no_show: "Só é possível marcar não-comparecimento após o horário agendado.",
    too_late_for_no_show: "Só é possível marcar não-comparecimento até 30 minutos após o horário agendado.",
    too_early_for_in_progress: "Só é possível iniciar um atendimento 30 minutos antes do horário agendado.",
    too_late_for_in_progress: "Muito tarde para iniciar o atendimento. Use a opção de completar diretamente."
  },
  
  // Mensagens de alerta (WARN)
  warning: {
    cancel_confirmed: "Tem certeza que deseja cancelar este agendamento confirmado?",
    cancel_pending: "Tem certeza que deseja cancelar este agendamento pendente?",
    mark_as_no_show: "Tem certeza que deseja marcar este cliente como não compareceu? Esta ação não pode ser desfeita."
  },
  
  // Mensagens de sucesso
  success: {
    status_updated: "Status atualizado com sucesso!"
  }
};

/**
 * Labels para exibição dos status
 */
export const STATUS_LABELS = {
  [AppointmentStatus.PENDING]: "Pendente",
  [AppointmentStatus.CONFIRMED]: "Confirmado",
  [AppointmentStatus.IN_PROGRESS]: "Em Atendimento",
  [AppointmentStatus.CANCELLED_BY_CLIENT]: "Cancelado pelo Cliente",
  [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: "Cancelado pelo Estabelecimento",
  [AppointmentStatus.COMPLETED]: "Concluído",
  [AppointmentStatus.NO_SHOW]: "Não Compareceu",
  [AppointmentStatus.RESCHEDULED]: "Reagendado"
};

/**
 * Cores para cada status (compatíveis com as classes do Tailwind)
 */
export const STATUS_COLORS = {
  [AppointmentStatus.PENDING]: "warning",
  [AppointmentStatus.CONFIRMED]: "info",
  [AppointmentStatus.IN_PROGRESS]: "primary",
  [AppointmentStatus.CANCELLED_BY_CLIENT]: "error",
  [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: "error",
  [AppointmentStatus.COMPLETED]: "success",
  [AppointmentStatus.NO_SHOW]: "error",
  [AppointmentStatus.RESCHEDULED]: "secondary"
};

/**
 * Classes CSS para os diferentes status
 */
export const STATUS_CLASSES = {
  [AppointmentStatus.PENDING]: "agenda-status-pending",
  [AppointmentStatus.CONFIRMED]: "agenda-status-confirmed",
  [AppointmentStatus.IN_PROGRESS]: "agenda-status-in-progress",
  [AppointmentStatus.CANCELLED_BY_CLIENT]: "agenda-status-cancelled",
  [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: "agenda-status-cancelled",
  [AppointmentStatus.COMPLETED]: "agenda-status-completed",
  [AppointmentStatus.NO_SHOW]: "agenda-status-no-show",
  [AppointmentStatus.RESCHEDULED]: "agenda-status-rescheduled"
};

/**
 * Valida se uma transição de status é permitida
 * @param {Object} appointment - O agendamento atual
 * @param {string} newStatus - O novo status a ser aplicado
 * @returns {Object} Objeto com o resultado da validação
 */
export const validateStatusTransition = (appointment, newStatus) => {
  const currentStatus = appointment.status;
  const startTime = new Date(appointment.start_time);
  const now = new Date();
  
  // Regra 1: Não pode mudar para o mesmo status
  if (currentStatus === newStatus) {
    return {
      valid: false,
      type: 'error',
      message: TRANSITION_MESSAGES.error.same_status
    };
  }
  
  // Regra 2: Verificar matriz de transições bloqueadas
  if (BLOCKED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    let message = TRANSITION_MESSAGES.error.forbidden_transition;
    
    // Personalizar mensagens para casos específicos
    if (currentStatus === AppointmentStatus.COMPLETED) {
      message = TRANSITION_MESSAGES.error.completed_cannot_change;
    } else if ((currentStatus === AppointmentStatus.CANCELLED_BY_CLIENT || 
               currentStatus === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT) && 
              newStatus === AppointmentStatus.COMPLETED) {
      message = TRANSITION_MESSAGES.error.cancelled_to_completed;
    } else if ((currentStatus === AppointmentStatus.CANCELLED_BY_CLIENT || 
               currentStatus === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT) && 
              newStatus === AppointmentStatus.NO_SHOW) {
      message = TRANSITION_MESSAGES.error.cancelled_to_no_show;
    } else if (currentStatus === AppointmentStatus.NO_SHOW && 
              (newStatus === AppointmentStatus.CONFIRMED || newStatus === AppointmentStatus.PENDING)) {
      message = TRANSITION_MESSAGES.error.no_show_to_confirmed;
    }
    
    return {
      valid: false,
      type: 'error',
      message
    };
  }
  
  // Regra 3: Validações temporais
  if (newStatus === AppointmentStatus.COMPLETED && now < startTime) {
    return {
      valid: false,
      type: 'error',
      message: TRANSITION_MESSAGES.error.too_early_for_completed
    };
  }
    if (newStatus === AppointmentStatus.IN_PROGRESS) {
    // Só permitir iniciar um agendamento 30 minutos antes do horário agendado até o horário agendado
    const thirtyMinutesBefore = new Date(startTime);
    thirtyMinutesBefore.setMinutes(startTime.getMinutes() - 30);
    
    // Se estamos antes de 30 minutos antes do horário
    if (now < thirtyMinutesBefore) {
      return {
        valid: false,
        type: 'error',
        message: TRANSITION_MESSAGES.error.too_early_for_in_progress
      };
    }
    
    // Se estamos após o horário agendado
    if (now > startTime) {
      return {
        valid: false,
        type: 'error',
        message: TRANSITION_MESSAGES.error.too_late_for_in_progress
      };
    }
  }
  
  if (newStatus === AppointmentStatus.NO_SHOW) {
    const noShowDeadline = new Date(startTime);
    noShowDeadline.setMinutes(startTime.getMinutes() + 30);
    
    if (now < startTime) {
      return {
        valid: false,
        type: 'error',
        message: TRANSITION_MESSAGES.error.too_early_for_no_show
      };
    }
    
    if (now > noShowDeadline) {
      return {
        valid: false,
        type: 'error',
        message: TRANSITION_MESSAGES.error.too_late_for_no_show
      };
    }
  }
  
  // Regra 4: Verificar se precisa de confirmação
  if (WARNING_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    let message = '';
    
    if (currentStatus === AppointmentStatus.CONFIRMED && 
       (newStatus === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT || 
        newStatus === AppointmentStatus.CANCELLED_BY_CLIENT)) {
      message = TRANSITION_MESSAGES.warning.cancel_confirmed;
    } else if (currentStatus === AppointmentStatus.PENDING && 
              (newStatus === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT || 
               newStatus === AppointmentStatus.CANCELLED_BY_CLIENT)) {
      message = TRANSITION_MESSAGES.warning.cancel_pending;
    } else if (currentStatus === AppointmentStatus.CONFIRMED && newStatus === AppointmentStatus.NO_SHOW) {
      message = TRANSITION_MESSAGES.warning.mark_as_no_show;
    }
    
    return {
      valid: true,
      type: 'warning',
      message
    };
  }
  
  // Se passou por todas as verificações, é uma transição válida sem alertas
  return {
    valid: true,
    type: 'success',
    message: TRANSITION_MESSAGES.success.status_updated
  };
};

/**
 * Retorna todos os status para os quais um determinado agendamento pode transicionar
 * @param {Object} appointment - O agendamento atual
 * @returns {Array} Lista com os status permitidos
 */
export const getAllowedTransitions = (appointment) => {
  if (!appointment) return [];
  
  const currentStatus = appointment.status;
  const allStatuses = Object.values(AppointmentStatus);
  const now = new Date();
  const startTime = new Date(appointment.start_time);
  
  return allStatuses.filter(status => {
    // Ignorar o status atual
    if (status === currentStatus) return false;
    
    // Verificar bloqueios na matriz de transições
    if (BLOCKED_TRANSITIONS[currentStatus]?.includes(status)) return false;
    
    // Verificar regras temporais
    if (status === AppointmentStatus.COMPLETED && now < startTime) return false;
    
    if (status === AppointmentStatus.NO_SHOW) {
      const noShowDeadline = new Date(startTime);
      noShowDeadline.setMinutes(startTime.getMinutes() + 30);
      if (now < startTime || now > noShowDeadline) return false;
    }
      if (status === AppointmentStatus.IN_PROGRESS) {
      // Permitir iniciar apenas 30 minutos antes do horário agendado até o horário agendado
      const thirtyMinutesBefore = new Date(startTime);
      thirtyMinutesBefore.setMinutes(startTime.getMinutes() - 30);
      
      // Se estamos antes de 30 minutos antes do horário ou após o horário agendado
      if (now < thirtyMinutesBefore || now > startTime) return false;
    }
    
    // Se passou por todas as verificações, é permitido
    return true;
  });
};
