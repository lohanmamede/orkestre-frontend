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
    // RESCHEDULED não está na lista - cancelados podem ser reagendados
  ],
  [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED_BY_CLIENT
    // RESCHEDULED não está na lista - cancelados podem ser reagendados
  ],
  [AppointmentStatus.NO_SHOW]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.RESCHEDULED
  ],
  [AppointmentStatus.RESCHEDULED]: [
    AppointmentStatus.CONFIRMED, // Reagendado não deve ter botão confirmar, pois já está implicitamente confirmado
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW
    // RESCHEDULED não está na lista - reagendados podem ser reagendados novamente
  ]
};

/**
 * Transições que precisam de confirmação (exibir alerta)
 * TODAS as transições exceto RESCHEDULED precisam de confirmação
 */
export const WARNING_TRANSITIONS = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW
    // RESCHEDULED não incluído - tem fluxo próprio
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW
    // RESCHEDULED não incluído - tem fluxo próprio
  ],
  [AppointmentStatus.IN_PROGRESS]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW
    // RESCHEDULED não incluído - tem fluxo próprio
  ],
  [AppointmentStatus.CANCELLED_BY_CLIENT]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW
    // RESCHEDULED não incluído - tem fluxo próprio
  ],
  [AppointmentStatus.CANCELLED_BY_ESTABLISHMENT]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW
    // RESCHEDULED não incluído - tem fluxo próprio
  ],
  [AppointmentStatus.RESCHEDULED]: [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED_BY_ESTABLISHMENT,
    AppointmentStatus.CANCELLED_BY_CLIENT,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW
    // RESCHEDULED não incluído - tem fluxo próprio (tela de escolha de horário)
  ]
  // COMPLETED e NO_SHOW não estão incluídos pois são estados finais
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
    no_show_to_confirmed: "Um agendamento com não-comparecimento não pode voltar a ser confirmado.",    
    too_early_for_completed: "Só é possível marcar como concluído após o horário de início.",
    too_early_for_no_show: "Só é possível marcar não-comparecimento após o horário agendado.",
    too_early_for_in_progress: "Só é possível iniciar um atendimento 30 minutos antes do horário agendado.",
    too_late_for_in_progress: "Muito tarde para iniciar o atendimento. Use a opção de completar diretamente.",
    appointment_passed_only_final_states: "Agendamentos que já passaram do horário só podem ser marcados como 'Concluído' ou 'Não Compareceu'.",
    in_progress_passed_only_complete_cancel: "Atendimentos em andamento que já passaram do horário só podem ser concluídos ou cancelados."
  },
  
  // Mensagens de alerta (WARN)
  warning: {
    // Cancelamentos
    cancel_confirmed: "Tem certeza que deseja cancelar este agendamento confirmado?",
    cancel_pending: "Tem certeza que deseja cancelar este agendamento pendente?",
    cancel_in_progress: "Tem certeza que deseja cancelar este atendimento em andamento?",
    
    // Marcar como não compareceu
    mark_as_no_show: "Tem certeza que deseja marcar este cliente como não compareceu? Esta ação não pode ser desfeita.",
    
    // Confirmar agendamentos
    confirm_pending: "Tem certeza que deseja confirmar este agendamento?",
    
    // Iniciar atendimento
    start_appointment: "Tem certeza que deseja iniciar este atendimento?",
    
    // Concluir atendimento
    complete_appointment: "Tem certeza que deseja marcar este agendamento como concluído?",
    complete_in_progress: "Tem certeza que deseja finalizar este atendimento?",
    
    // Reagendar
    reschedule_appointment: "Tem certeza que deseja reagendar este agendamento novamente?",
    
    // Outras transições gerais
    change_status: "Tem certeza que deseja alterar o status deste agendamento?"
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
  const isAppointmentPassed = now > startTime;
  
  // Regra 1: Não pode mudar para o mesmo status (EXCETO reagendamento)
  if (currentStatus === newStatus && newStatus !== AppointmentStatus.RESCHEDULED) {
    return {
      valid: false,
      type: 'error',
      message: TRANSITION_MESSAGES.error.same_status
    };
  }
  
  // REGRA TEMPORAL CRÍTICA (PRIORIDADE MÁXIMA) - Aplicar ANTES da matriz de bloqueio
  if (isAppointmentPassed) {
    // Para agendamentos que passaram do horário com status CONFIRMED, RESCHEDULED ou PENDING,
    // permitir apenas transições para COMPLETED ou NO_SHOW, ignorando a matriz de bloqueio E validações temporais específicas
    if ((currentStatus === AppointmentStatus.CONFIRMED || 
         currentStatus === AppointmentStatus.RESCHEDULED ||
         currentStatus === AppointmentStatus.PENDING)) {
      
      // Se está tentando ir para COMPLETED ou NO_SHOW, permitir mas continuar para verificação de confirmação
      if (newStatus === AppointmentStatus.COMPLETED || newStatus === AppointmentStatus.NO_SHOW) {
        // NÃO retornar aqui - continuar para verificação de confirmação
      } else {
        // Se está tentando ir para qualquer outro status, bloquear
        return {
          valid: false,
          type: 'error',
          message: TRANSITION_MESSAGES.error.appointment_passed_only_final_states
        };
      }
    }
    
    // Para IN_PROGRESS que passou do horário, permitir COMPLETED e cancelamentos
    else if (currentStatus === AppointmentStatus.IN_PROGRESS) {
      // Se está tentando ir para COMPLETED ou cancelamentos, permitir mas continuar para verificação de confirmação
      if (newStatus === AppointmentStatus.COMPLETED || 
          newStatus === AppointmentStatus.CANCELLED_BY_CLIENT ||
          newStatus === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT) {
        // NÃO retornar aqui - continuar para verificação de confirmação
      } else {
        // Se está tentando ir para qualquer outro status, bloquear
        return {
          valid: false,
          type: 'error',
          message: TRANSITION_MESSAGES.error.in_progress_passed_only_complete_cancel
        };
      }
    }
    
    // Para outros status que passaram do horário, aplicar matriz de bloqueio normalmente
    else if (BLOCKED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
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
  } else {
    // Se NÃO passou do horário, aplicar matriz de bloqueio normalmente
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
    // Para agendamentos passados com status críticos (CONFIRMED, RESCHEDULED, PENDING),
    // não aplicar restrições temporais - permitir sempre
    const isCriticalPastAppointment = isAppointmentPassed && 
      (currentStatus === AppointmentStatus.CONFIRMED || 
       currentStatus === AppointmentStatus.RESCHEDULED ||
       currentStatus === AppointmentStatus.PENDING);
    
    if (!isCriticalPastAppointment && now < startTime) {
      return {
        valid: false,
        type: 'error',
        message: TRANSITION_MESSAGES.error.too_early_for_no_show
      };
    }
    // REMOVIDO: Regra de 30 minutos após o agendamento - não faz sentido de negócio
  }
  
  // Regra 4: Verificar se precisa de confirmação (TODAS as transições exceto RESCHEDULED)
  if (WARNING_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    let message = '';
    
    // Cancelamentos
    if (newStatus === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT || 
        newStatus === AppointmentStatus.CANCELLED_BY_CLIENT) {
      if (currentStatus === AppointmentStatus.CONFIRMED) {
        message = TRANSITION_MESSAGES.warning.cancel_confirmed;
      } else if (currentStatus === AppointmentStatus.PENDING) {
        message = TRANSITION_MESSAGES.warning.cancel_pending;
      } else if (currentStatus === AppointmentStatus.IN_PROGRESS) {
        message = TRANSITION_MESSAGES.warning.cancel_in_progress;
      } else {
        message = TRANSITION_MESSAGES.warning.change_status;
      }
    }
    // Marcar como não compareceu
    else if (newStatus === AppointmentStatus.NO_SHOW) {
      message = TRANSITION_MESSAGES.warning.mark_as_no_show;
    }
    // Confirmar agendamento
    else if (newStatus === AppointmentStatus.CONFIRMED) {
      message = TRANSITION_MESSAGES.warning.confirm_pending;
    }
    // Iniciar atendimento
    else if (newStatus === AppointmentStatus.IN_PROGRESS) {
      message = TRANSITION_MESSAGES.warning.start_appointment;
    }
    // Concluir atendimento
    else if (newStatus === AppointmentStatus.COMPLETED) {
      if (currentStatus === AppointmentStatus.IN_PROGRESS) {
        message = TRANSITION_MESSAGES.warning.complete_in_progress;
      } else {
        message = TRANSITION_MESSAGES.warning.complete_appointment;
      }
    }
    // Reagendar
    else if (newStatus === AppointmentStatus.RESCHEDULED) {
      message = TRANSITION_MESSAGES.warning.reschedule_appointment;
    }
    // Outras transições
    else {
      message = TRANSITION_MESSAGES.warning.change_status;
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
  const isAppointmentPassed = now > startTime;
  
  return allStatuses.filter(status => {
    // Ignorar o status atual (EXCETO para reagendamento)
    if (status === currentStatus && status !== AppointmentStatus.RESCHEDULED) return false;
    
    // REGRAS TEMPORAIS CRÍTICAS - APLICAR PRIMEIRO
    if (isAppointmentPassed) {
      // Para CONFIRMED, RESCHEDULED ou PENDING que passaram do horário, só permite COMPLETED e NO_SHOW
      if ((currentStatus === AppointmentStatus.CONFIRMED || 
           currentStatus === AppointmentStatus.RESCHEDULED ||
           currentStatus === AppointmentStatus.PENDING) &&
          (status !== AppointmentStatus.COMPLETED && 
           status !== AppointmentStatus.NO_SHOW)) {
        return false;
      }
      
      // Para IN_PROGRESS que passou do horário, só permite COMPLETED e cancelamentos
      if (currentStatus === AppointmentStatus.IN_PROGRESS &&
          (status !== AppointmentStatus.COMPLETED && 
           status !== AppointmentStatus.CANCELLED_BY_CLIENT &&
           status !== AppointmentStatus.CANCELLED_BY_ESTABLISHMENT)) {
        return false;
      }
      
      // Para status RESCHEDULED que passou do horário, forçar apenas COMPLETED e NO_SHOW
      if (currentStatus === AppointmentStatus.RESCHEDULED) {
        return status === AppointmentStatus.COMPLETED || status === AppointmentStatus.NO_SHOW;
      }
      
      // Para status IN_PROGRESS que passou do horário, permitir COMPLETED e cancelamentos
      if (currentStatus === AppointmentStatus.IN_PROGRESS) {
        return status === AppointmentStatus.COMPLETED || 
               status === AppointmentStatus.CANCELLED_BY_CLIENT ||
               status === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT;
      }
    } else {
      // Se NÃO passou do horário, não pode marcar como NO_SHOW
      if (status === AppointmentStatus.NO_SHOW) return false;
      
      // REGRA ESPECIAL: IN_PROGRESS futuro é uma inconsistência - só permitir cancelar
      if (currentStatus === AppointmentStatus.IN_PROGRESS) {
        // Para IN_PROGRESS futuro (situação anômala), permitir apenas cancelar
        // NÃO faz sentido "confirmar" um agendamento que já está em progresso
        return status === AppointmentStatus.CANCELLED_BY_CLIENT ||
               status === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT;
      }
    }
    
    // Verificar bloqueios na matriz de transições (apenas se não for caso temporal crítico)
    if (!isAppointmentPassed || 
        (currentStatus !== AppointmentStatus.CONFIRMED && 
         currentStatus !== AppointmentStatus.RESCHEDULED && 
         currentStatus !== AppointmentStatus.PENDING &&
         currentStatus !== AppointmentStatus.IN_PROGRESS)) {
      if (BLOCKED_TRANSITIONS[currentStatus]?.includes(status)) return false;
    }
    
    // Verificar regras temporais específicas para outros status
    if (status === AppointmentStatus.COMPLETED && now < startTime) return false;
    
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

/**
 * Retorna os botões que devem ser exibidos para um agendamento, aplicando as regras de conflito
 * @param {Object} appointment - O agendamento atual
 * @returns {Array} Lista com os botões que devem ser exibidos
 */
export const getAllowedButtons = (appointment) => {
  if (!appointment) return [];
  
  const allowedTransitions = getAllowedTransitions(appointment);
  const currentStatus = appointment.status;
  
  // REGRA TEMPORAL CRÍTICA (PRIORIDADE MÁXIMA)
  const now = new Date();
  const appointmentTime = new Date(appointment.start_time);
  const isAppointmentPassed = now > appointmentTime;
  
  let buttonsToShow = [...allowedTransitions];
  
  // APLICAR REGRAS TEMPORAIS PRIMEIRO
  if (isAppointmentPassed) {
    // Se passou do horário, agendamentos CONFIRMADOS, REAGENDADOS, PENDENTES ou EM ANDAMENTO
    // só podem ser marcados como CONCLUÍDO ou FALTA (exceto IN_PROGRESS que só pode CONCLUÍDO)
    if (currentStatus === AppointmentStatus.CONFIRMED || 
        currentStatus === AppointmentStatus.RESCHEDULED ||
        currentStatus === AppointmentStatus.PENDING) {
      
      buttonsToShow = buttonsToShow.filter(status => 
        status === AppointmentStatus.COMPLETED || 
        status === AppointmentStatus.NO_SHOW
      );
      
      // Retornar apenas os botões temporais válidos - ignorar outras regras
      return buttonsToShow;
    }
    
    // Para IN_PROGRESS que passou do horário, pode concluir ou cancelar
    if (currentStatus === AppointmentStatus.IN_PROGRESS) {
      buttonsToShow = buttonsToShow.filter(status => 
        status === AppointmentStatus.COMPLETED ||
        status === AppointmentStatus.CANCELLED_BY_CLIENT ||
        status === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT
      );
      
      // Retornar apenas os botões temporais válidos - ignorar outras regras
      return buttonsToShow;
    }
  }
  
  // APLICAR REGRAS DE CONFLITO APENAS SE NÃO PASSOU DO HORÁRIO
  if (!isAppointmentPassed) {
    // REGRA ESPECIAL: Agendamentos IN_PROGRESS futuros são uma inconsistência - só permitir cancelamentos
    if (currentStatus === AppointmentStatus.IN_PROGRESS) {
      // Para IN_PROGRESS futuro (situação anômala), permitir apenas cancelar
      // NÃO faz sentido "confirmar" um agendamento que já está em progresso
      buttonsToShow = buttonsToShow.filter(status => 
        status === AppointmentStatus.CANCELLED_BY_CLIENT ||
        status === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT
      );
      
      // Retornar apenas essas opções de correção
      return buttonsToShow;
    }
    
    // REGRA 1: Não mostrar "Cancelar" quando há "Faltou" - eles não podem coexistir
    if (buttonsToShow.includes(AppointmentStatus.NO_SHOW)) {
      buttonsToShow = buttonsToShow.filter(status => 
        status !== AppointmentStatus.CANCELLED_BY_CLIENT && 
        status !== AppointmentStatus.CANCELLED_BY_ESTABLISHMENT
      );
    }
  }
  
  // REGRA 2: Reagendar não deve aparecer em estados finais ou em andamento
  const noRescheduleStates = [
    AppointmentStatus.COMPLETED,    // Concluído: estado final
    AppointmentStatus.IN_PROGRESS,  // Em andamento: não pode reagendar
    AppointmentStatus.NO_SHOW       // Faltou: estado final
  ];
  if (noRescheduleStates.includes(currentStatus)) {
    buttonsToShow = buttonsToShow.filter(status => status !== AppointmentStatus.RESCHEDULED);
  }
  
  // REGRA 3: Cancelados só podem ter reagendar
  if (currentStatus === AppointmentStatus.CANCELLED_BY_CLIENT || 
      currentStatus === AppointmentStatus.CANCELLED_BY_ESTABLISHMENT) {
    buttonsToShow = buttonsToShow.filter(status => status === AppointmentStatus.RESCHEDULED);
  }
  
  return buttonsToShow;
};
