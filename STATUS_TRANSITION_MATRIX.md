# 📊 **MATRIZ FLEXÍVEL DE TRANSIÇÕES DE STATUS**

## 🎯 **FILOSOFIA DO SISTEMA**

### **🤝 Assistente Prestativo vs 👮 Gerente Autoritário**

Este sistema foi projetado para ser um **assistente inteligente** que:
- **Previne erros graves** (regras de integridade)
- **Alerta sobre situações incomuns** (diretrizes flexíveis)  
- **Respeita o fluxo real** dos estabelecimentos
- **Mantém dados consistentes** sem ser restritivo

### **📊 Níveis de Validação**

```javascript
const VALIDATION_LEVELS = {
  OK: 'Permitido sem restrições',
  WARN: 'Permitido com aviso e confirmação', 
  BLOCK: 'Bloqueado por regra de integridade',
  ADMIN: 'Apenas com permissão administrativa'
}
```

---

## � **MATRIZ INTELIGENTE DE TRANSIÇÕES**

### **📋 STATUS DISPONÍVEIS**

```javascript
const APPOINTMENT_STATUS = {
  PENDING: 'pending',                             // Aguardando confirmação
  CONFIRMED: 'confirmed',                         // Confirmado 
  COMPLETED: 'completed',                         // Serviço realizado
  CANCELLED_BY_ESTABLISHMENT: 'cancelled_by_establishment',  // Cancelado pelo estabelecimento
  CANCELLED_BY_CLIENT: 'cancelled_by_client',     // Cancelado pelo cliente
  NO_SHOW: 'no_show',                            // Cliente não compareceu
  
  // Status opcionais para futuras implementações
  RESCHEDULED: 'rescheduled',                    // Reagendado
  IN_PROGRESS: 'in_progress'                     // Em atendimento
}
```

---

## ⏰ **CATEGORIAS TEMPORAIS**

```javascript
const TIME_CATEGORIES = {
  DISTANT_FUTURE: 'distant_future',     // > 24 horas no futuro
  NEAR_FUTURE: 'near_future',           // 2-24 horas no futuro
  IMMINENT: 'imminent',                 // 0-2 horas no futuro
  CURRENT_WINDOW: 'current_window',     // 0-1 hora após horário marcado
  RECENT_PAST: 'recent_past',           // 1-24 horas no passado
  DISTANT_PAST: 'distant_past'          // > 24 horas no passado
}
```

---

## 🔄 **MATRIZ COMPLETA DE TRANSIÇÕES**

### **📅 FROM: PENDING (Aguardando Confirmação)**

#### **FILOSOFIA:** Cliente agendou mas ainda não confirmou presença

```javascript
TRANSITIONS_FROM_PENDING: {
  
  'confirmed': {
    level: 'OK',
    temporal_restrictions: 'NONE',
    message: 'Agendamento confirmado com sucesso!',
    business_logic: 'Fluxo normal esperado'
  },
  
  'completed': {
    level: 'WARN',  // Flexível - pode ser atendimento antecipado
    temporal_restrictions: {
      future: {
        message: "Este agendamento ainda não aconteceu. Foi um atendimento antecipado?",
        options: [
          "Sim, cliente chegou mais cedo e foi atendido",
          "Sim, serviço foi mais rápido que esperado", 
          "Não, foi erro - cancelar ação"
        ],
        requires_confirmation: true
      },
      current: {
        level: 'OK',
        message: 'Atendimento realizado no horário'
      },
      past: {
        level: 'WARN',
        message: 'Marcando como concluído com atraso no registro. Confirma?',
        requires_reason: 'optional'
      }
    },
    business_cases: [
      "Cliente chegou mais cedo",
      "Encaixe entre outros atendimentos", 
      "Erro de registro - estava confirmado mentalmente"
    ]
  },
  
  'cancelled_by_establishment': {
    level: 'OK',
    requires_reason: 'optional',
    message: 'Agendamento cancelado pelo estabelecimento'
  },
  
  'cancelled_by_client': {
    level: 'OK', 
    requires_reason: 'optional',
    message: 'Cancelamento do cliente registrado'
  },
    'no_show': {
    level: 'WARN',  // Flexível - pode ter esquecido de confirmar
    temporal_restrictions: {
      future: {
        level: 'BLOCK',
        message: 'Não é possível marcar falta antes do horário do agendamento'
      },
      current_grace_period: {
        level: 'OK',
        message: 'Cliente não compareceu no horário'
      },
      past_grace_period: {
        level: 'WARN',
        message: 'Registrando falta após período recomendado. Confirma que foi realmente falta?',
        options: [
          "Sim, cliente não veio",
          "Na verdade, cliente chegou e foi atendido",
          "Cliente cancelou mas esqueci de registrar"
        ]
      }
    },
    business_cases: [
      "Cliente não confirmou e não veio",
      "Cliente confirmou por telefone mas sistema não foi atualizado"
    ]
  }
}
```

### **✅ FROM: CONFIRMED (Confirmado)**

#### **FILOSOFIA:** Cliente confirmou presença, expectativa alta de comparecimento

```javascript
TRANSITIONS_FROM_CONFIRMED: {
  
  'pending': {
    level: 'WARN',  // Pode ter motivos válidos
    temporal_restrictions: {
      distant_future: {
        level: 'OK',
        message: 'Confirmação revertida'
      },
      near_future: {
        level: 'WARN',
        message: 'Reverter confirmação próximo ao horário pode causar transtornos. Confirma?',
        requires_reason: true,
        options: [
          "Cliente pediu para reverter",
          "Erro na confirmação",
          "Reagendamento necessário"
        ]
      },
      imminent: {
        level: 'WARN',
        message: 'Reversão de última hora. Motivo:',
        requires_reason: true,
        requires_double_confirmation: true
      }
    },
    business_cases: [
      "Cliente mudou de ideia",
      "Conflito de horário descoberto",
      "Erro na confirmação original"
    ]
  },
  
  'completed': {
    level: 'OK',
    temporal_restrictions: {
      future: {
        level: 'WARN',
        message: 'Marcando como concluído antes do horário. Foi antecipado?',
        requires_confirmation: true
      },
      current: {
        level: 'OK',
        message: 'Atendimento realizado conforme agendado'
      },
      past: {
        level: 'OK', 
        message: 'Atendimento concluído'
      }
    }
  },
  
  'cancelled_by_establishment': {
    level: 'WARN',  // Mais grave pois cliente confirmou
    temporal_restrictions: {
      distant_future: {
        level: 'WARN',
        requires_reason: true,
        message: 'Cancelando agendamento confirmado. Motivo:'
      },
      near_future: {
        level: 'WARN',
        requires_reason: true,
        requires_double_confirmation: true,
        message: 'Cancelamento com pouco tempo. Cliente pode ser compensado.'
      },
      imminent: {
        level: 'ADMIN',  // Requer supervisão
        message: 'Cancelamento de emergência. Requer aprovação administrativa.',
        requires_supervisor_approval: true
      }
    }
  },
  
  'cancelled_by_client': {
    level: 'OK',
    temporal_restrictions: {
      imminent: {
        level: 'WARN',
        message: 'Cliente cancelou de última hora. Aplicar taxa de cancelamento?',
        requires_reason: true
      }
    }
  },
  
  'no-show': {
    level: 'OK',
    temporal_restrictions: {
      future: {
        level: 'BLOCK',
        message: 'Não é possível marcar falta antes do horário'
      },
      grace_period: {
        level: 'OK',
        message: 'Cliente confirmado não compareceu'
      },
      extended_period: {
        level: 'WARN',
        message: 'Registrando falta após período estendido. Confirma?'
      }
    }
  }
}
```

### **🎉 FROM: COMPLETED (Concluído)**

#### **FILOSOFIA:** Estado final - alterações devem ser raríssimas

```javascript
TRANSITIONS_FROM_COMPLETED: {
  
  // REGRAS DE INTEGRIDADE - Geralmente bloqueadas
  'pending': {
    level: 'BLOCK',
    message: 'Um serviço já realizado não pode voltar a ser pendente',
    exception: {
      level: 'ADMIN',
      condition: 'EMERGENCY_DATA_CORRECTION',
      requires_supervisor_approval: true,
      audit_level: 'CRITICAL'
    }
  },
  
  'confirmed': {
    level: 'BLOCK', 
    message: 'Um serviço já realizado não pode voltar a ser apenas confirmado',
    exception: {
      level: 'ADMIN',
      condition: 'EMERGENCY_DATA_CORRECTION'
    }
  },
  
  'cancelled_by_establishment': {
    level: 'BLOCK',
    message: 'Não é possível cancelar um serviço já realizado',
    exception: {
      level: 'ADMIN',
      condition: 'BILLING_CORRECTION',
      message: 'Correção para fins de faturamento - requer justificativa detalhada'
    }
  },
  
  'cancelled_by_client': {
    level: 'BLOCK',
    message: 'Cliente não pode cancelar serviço já realizado'
  },
  
  'no-show': {
    level: 'BLOCK',
    message: 'Cliente foi atendido, não pode ser marcado como falta',
    exception: {
      level: 'ADMIN', 
      condition: 'DATA_CORRECTION',
      message: 'Correção: cliente na verdade não compareceu'
    }
  }
}
```

### **❌ FROM: CANCELLED_BY_ESTABLISHMENT**

#### **FILOSOFIA:** Estado final, mas pode ter correções por erro

```javascript
TRANSITIONS_FROM_CANCELLED_ESTABLISHMENT: {
  
  'pending': {
    level: 'WARN',  // Possível se erro ou mudança de situação
    temporal_restrictions: {
      same_day: {
        level: 'WARN',
        message: 'Reativar agendamento cancelado. Confirma que há disponibilidade?',
        requires_availability_check: true
      },
      future_days: {
        level: 'BLOCK',
        message: 'Agendamento muito antigo para reativar - criar novo agendamento'
      }
    },
    business_cases: [
      "Cancelamento foi engano",
      "Situação que causou cancelamento foi resolvida",
      "Cliente negociou e agendamento pode continuar"
    ]
  },
  
  'confirmed': {
    level: 'WARN',
    condition: 'MUST_GO_THROUGH_PENDING',
    message: 'Para reativar, primeiro mude para pendente, depois confirme'
  },
  
  // Outros states permanecem bloqueados
  'completed': {
    level: 'BLOCK',
    message: 'Agendamento foi cancelado, não pode ser concluído'
  },
  
  'no-show': {
    level: 'BLOCK', 
    message: 'Agendamento foi cancelado, cliente não deveria comparecer'
  }
}
```

### **❌ FROM: CANCELLED_BY_CLIENT**

#### **FILOSOFIA:** Cliente cancelou, mas pode querer reativar

```javascript
TRANSITIONS_FROM_CANCELLED_CLIENT: {
  
  'pending': {
    level: 'WARN',  // Cliente pode mudar de ideia
    temporal_restrictions: {
      same_day: {
        level: 'WARN',
        message: 'Cliente quer reativar agendamento. Verificar disponibilidade:',
        requires_availability_check: true,
        requires_staff_approval: true
      },
      future: {
        level: 'OK',
        message: 'Reativação de agendamento solicitada pelo cliente'
      }
    },
    business_cases: [
      "Cliente mudou de ideia",
      "Situação que levou ao cancelamento foi resolvida",
      "Cancelamento foi mal-entendido"
    ]
  },
  
  // Outros permanecem similares ao cancelled_by_establishment
}
```

### **👻 FROM: NO_SHOW (Falta)**

#### **FILOSOFIA:** Cliente faltou, mas pode ter chegado tarde

```javascript
TRANSITIONS_FROM_NO_SHOW: {
  
  'completed': {
    level: 'WARN',  // Cliente pode ter chegado tarde
    temporal_restrictions: {
      same_day: {
        level: 'WARN',
        message: 'Cliente chegou após ser marcado como falta?',
        requires_confirmation: true,
        options: [
          "Sim, chegou atrasado e foi atendido",
          "Sim, ligou e foi atendido por telefone",
          "Não, foi erro na marcação de falta"
        ]
      },
      next_day: {
        level: 'ADMIN',
        message: 'Correção de falta do dia anterior requer supervisão'
      }
    },
    business_cases: [
      "Cliente chegou muito atrasado mas foi atendido",
      "Atendimento foi feito remotamente",
      "Erro na marcação original de falta"
    ]
  },
  
  'pending': {
    level: 'WARN',
    message: 'Reverter falta para pendente. Cliente quer reagendar?',
    condition: 'SHOULD_CREATE_NEW_APPOINTMENT'
  },
  
  // Outros geralmente bloqueados
  'confirmed': {
    level: 'BLOCK',
    message: 'Cliente faltou, não pode ser confirmado. Criar novo agendamento.'
  }
}
```

---

## 🎯 **IMPLEMENTAÇÃO PRÁTICA**

### **Interface de Validação Flexível**

```javascript
const validateTransition = (currentStatus, targetStatus, appointmentData) => {
  const rule = TRANSITION_MATRIX[currentStatus][targetStatus];
  
  switch(rule.level) {
    case 'OK':
      return { allowed: true, message: rule.message };
      
    case 'WARN':
      return {
        allowed: true,
        requiresConfirmation: true,
        warningMessage: rule.message,
        options: rule.options || ['Confirmar', 'Cancelar'],
        businessCases: rule.business_cases
      };
      
    case 'BLOCK':
      return {
        allowed: false,
        message: rule.message,
        hasException: !!rule.exception,
        exceptionRequirements: rule.exception
      };
      
    case 'ADMIN':
      return {
        allowed: false,
        requiresElevatedPermission: true,
        message: rule.message,
        requirements: rule.requirements
      };
  }
};
```

### **Modal de Confirmação Contextual**

```javascript
const StatusConfirmationModal = ({ transition, onConfirm, onCancel }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  
  return (
    <Modal>
      <h3>{transition.warningMessage}</h3>
      
      {transition.businessCases && (
        <div className="business-cases">
          <p>Situações comuns:</p>
          {transition.businessCases.map(case => (
            <label key={case}>
              <input 
                type="radio" 
                value={case}
                checked={selectedReason === case}
                onChange={() => setSelectedReason(case)}
              />
              {case}
            </label>
          ))}
          <label>
            <input 
              type="radio"
              value="other"
              checked={selectedReason === 'other'}
              onChange={() => setSelectedReason('other')}
            />
            Outro motivo:
            <input 
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={selectedReason !== 'other'}
            />
          </label>
        </div>
      )}
      
      <div className="modal-actions">
        <button onClick={onCancel}>Cancelar</button>
        <button 
          onClick={() => onConfirm(selectedReason === 'other' ? customReason : selectedReason)}
          disabled={!selectedReason}
        >
          Confirmar Ação
        </button>
      </div>
    </Modal>
  );
};
```

---

## 🎨 **EXPERIÊNCIA DO USUÁRIO**

### **Mensagens Amigáveis e Educativas**

Em vez de:
❌ "Ação não permitida"

Usamos:
✅ "Este agendamento ainda não aconteceu. Foi um atendimento antecipado? Se sim, confirme que o serviço já foi realizado."

### **Sugestões Inteligentes**

```javascript
const getSuggestion = (currentStatus, appointmentTime) => {
  if (currentStatus === 'pending' && isAfter(new Date(), appointmentTime)) {
    return {
      type: 'suggestion',
      message: 'Este agendamento já passou. O que aconteceu?',
      quickActions: [
        { label: 'Cliente veio e foi atendido', action: 'completed' },
        { label: 'Cliente não apareceu', action: 'no_show' },
        { label: 'Foi cancelado', action: 'cancelled_by_client' }
      ]
    };
  }
};
```

---

*Este sistema balanceia **integridade de dados** com **flexibilidade operacional**, sempre respeitando o contexto real dos estabelecimentos.*

#### **NEAR_FUTURE (2-24h futuro)**
```javascript
ALLOWED_TRANSITIONS: {
  'confirmed': {
    permission: 'ANY_USER',
    confirmation: 'NONE',
    validation: 'BASIC',
    message: 'Confirmação registrada. Cliente será notificado.',
    notification: 'SMS_CONFIRMATION'
  },
  'cancelled_by_establishment': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Cancelamento com pouco tempo de antecedência registrado.',
    warning: 'Cliente pode ser cobrado pela taxa de cancelamento'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'REASON_OPTIONAL',
    message: 'Cancelamento do cliente registrado.'
  },
  'rescheduled': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'NEW_DATE_REQUIRED',
    message: 'Reagendamento realizado.'
  }
}

BLOCKED_TRANSITIONS: {
  'completed': 'Agendamento ainda não ocorreu',
  'no_show': 'Muito cedo para marcar como falta',
  'in_progress': 'Agendamento ainda não chegou na hora de começar'
}
```

#### **IMMINENT (0-2h futuro)**
```javascript
ALLOWED_TRANSITIONS: {
  'confirmed': {
    permission: 'ANY_USER',
    confirmation: 'NONE',
    validation: 'BASIC',
    message: 'Confirmação de última hora registrada.',
    notification: 'SMS_URGENT'
  },
  'cancelled_by_establishment': {
    permission: 'STAFF_ADMIN',
    confirmation: 'TRIPLE',
    validation: 'REASON_REQUIRED + SUPERVISOR_APPROVAL',
    message: 'Cancelamento de emergência registrado.',
    warning: 'Cliente pode ser cobrado valor integral + taxa de cancelamento'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Cancelamento de última hora do cliente.',
    warning: 'Cliente pode ser cobrado taxa de cancelamento tardio'
  },
  'rescheduled': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'NEW_DATE_REQUIRED + REASON',
    message: 'Reagendamento de última hora realizado.'
  }
}

BLOCKED_TRANSITIONS: {
  'completed': 'Aguarde o horário do agendamento',
  'no_show': 'Aguarde pelo menos 15 minutos de atraso',
  'in_progress': 'Ainda não chegou a hora de iniciar'
}
```

#### **CURRENT_WINDOW (0-1h após horário)**
```javascript
ALLOWED_TRANSITIONS: {
  'confirmed': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'BASIC',
    message: 'Cliente chegou atrasado. Confirmação registrada.',
    note: 'Atraso de X minutos registrado no sistema'
  },
  'completed': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'BASIC',
    message: 'Atendimento realizado e concluído.',
    note: 'Agendamento concluído sem confirmação prévia'
  },
  'no-show': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'MINIMUM_WAIT_30MIN',
    message: 'Cliente não compareceu. Falta registrada.',
    condition: 'Só após 30 minutos do horário marcado'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'REASON_REQUIRED',
    message: 'Cliente cancelou no horário do agendamento.',
    warning: 'Cliente pode ser cobrado valor integral'
  }
}

BLOCKED_TRANSITIONS: {
  'cancelled_by_establishment': 'Muito tarde para o estabelecimento cancelar',
  'rescheduled': 'Não é possível reagendar no horário do atendimento'
}
```

#### **RECENT_PAST (1-24h passado)**
```javascript
ALLOWED_TRANSITIONS: {
  'completed': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Agendamento de ontem marcado como concluído.',
    warning: 'Registro retroativo - confirme que o atendimento foi realizado'
  },
  'no-show': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'BASIC',
    message: 'Falta de ontem registrada.'
  },
  'cancelled_by_client': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'REASON_REQUIRED',
    message: 'Cancelamento retroativo do cliente registrado.'
  }
}

BLOCKED_TRANSITIONS: {
  'confirmed': 'Muito tarde para confirmar agendamento passado',
  'cancelled_by_establishment': 'Não é possível cancelar agendamento que já passou',
  'rescheduled': 'Não é possível reagendar agendamento passado',
  'in_progress': 'Não é possível iniciar agendamento que já passou'
}
```

#### **DISTANT_PAST (>24h passado)**
```javascript
ALLOWED_TRANSITIONS: {
  'completed': {
    permission: 'ADMIN_ONLY',
    confirmation: 'TRIPLE',
    validation: 'REASON_REQUIRED + SUPERVISOR_APPROVAL',
    message: 'Registro histórico atualizado.',
    warning: 'Alteração de registro antigo - requer justificativa detalhada'
  },
  'no-show': {
    permission: 'ADMIN_ONLY',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Falta histórica registrada.'
  }
}

BLOCKED_TRANSITIONS: {
  'confirmed': 'Registro muito antigo para confirmação',
  'cancelled_by_establishment': 'Registro muito antigo para cancelamento',
  'cancelled_by_client': 'Registro muito antigo para cancelamento',
  'rescheduled': 'Não é possível reagendar registro histórico',
  'in_progress': 'Não é possível iniciar agendamento histórico'
}
```

---

### **✅ FROM: CONFIRMED (Confirmado)**

#### **DISTANT_FUTURE (>24h futuro)**
```javascript
ALLOWED_TRANSITIONS: {
  'pending': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'REASON_OPTIONAL',
    message: 'Confirmação revertida. Agendamento volta ao status pendente.'
  },
  'cancelled_by_establishment': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Agendamento confirmado cancelado pelo estabelecimento.'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'REASON_OPTIONAL',
    message: 'Cliente cancelou agendamento confirmado.'
  },
  'rescheduled': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'NEW_DATE_REQUIRED',
    message: 'Agendamento confirmado reagendado.'
  }
}

BLOCKED_TRANSITIONS: {
  'completed': 'Agendamento ainda não aconteceu',
  'no-show': 'Cliente ainda não deveria ter comparecido',
  'in_progress': 'Muito cedo para iniciar atendimento'
}
```

#### **NEAR_FUTURE (2-24h futuro)**
```javascript
ALLOWED_TRANSITIONS: {
  'cancelled_by_establishment': {
    permission: 'STAFF_ADMIN',
    confirmation: 'TRIPLE',
    validation: 'REASON_REQUIRED + SUPERVISOR_APPROVAL',
    message: 'Agendamento confirmado cancelado com pouco tempo.',
    warning: 'Cliente pode buscar compensação por cancelamento tardio'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Cliente cancelou agendamento confirmado.',
    warning: 'Possível cobrança de taxa de cancelamento'
  },
  'rescheduled': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'NEW_DATE_REQUIRED + REASON',
    message: 'Reagendamento de agendamento confirmado.'
  }
}

BLOCKED_TRANSITIONS: {
  'pending': 'Muito próximo ao horário para reverter confirmação',
  'completed': 'Agendamento ainda não ocorreu',
  'no-show': 'Cliente ainda não deveria ter comparecido',
  'in_progress': 'Ainda não é hora de iniciar'
}
```

#### **IMMINENT (0-2h futuro)**
```javascript
ALLOWED_TRANSITIONS: {
  'cancelled_by_establishment': {
    permission: 'ADMIN_ONLY',
    confirmation: 'TRIPLE',
    validation: 'EMERGENCY_REASON_REQUIRED + SUPERVISOR_APPROVAL',
    message: 'Cancelamento de emergência registrado.',
    warning: 'Cliente pode ser compensado pelo cancelamento de última hora'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'TRIPLE',
    validation: 'REASON_REQUIRED',
    message: 'Cliente cancelou de última hora.',
    warning: 'Cliente pode ser cobrado valor integral'
  },
  'in_progress': {
    permission: 'STAFF_ADMIN',
    confirmation: 'NONE',
    validation: 'BASIC',
    message: 'Atendimento iniciado.',
    condition: 'Só nos últimos 30 minutos antes do horário'
  }
}

BLOCKED_TRANSITIONS: {
  'pending': 'Muito tarde para reverter confirmação',
  'completed': 'Aguarde o horário do agendamento',
  'no-show': 'Aguarde pelo menos o horário marcado',
  'rescheduled': 'Muito tarde para reagendar'
}
```

#### **CURRENT_WINDOW (0-1h após horário)**
```javascript
ALLOWED_TRANSITIONS: {
  'completed': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'BASIC',
    message: 'Atendimento realizado e concluído com sucesso.'
  },
  'in_progress': {
    permission: 'STAFF_ADMIN',
    confirmation: 'NONE',
    validation: 'BASIC',
    message: 'Atendimento em andamento.'
  },
  'no-show': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'MINIMUM_WAIT_30MIN',
    message: 'Cliente confirmado não compareceu.',
    condition: 'Só após 30 minutos de atraso'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Cliente cancelou no horário do atendimento.',
    warning: 'Cliente pode ser cobrado valor integral'
  }
}

BLOCKED_TRANSITIONS: {
  'pending': 'Muito tarde para reverter confirmação',
  'cancelled_by_establishment': 'Muito tarde para estabelecimento cancelar',
  'rescheduled': 'Não é possível reagendar no horário do atendimento'
}
```

#### **RECENT_PAST (1-24h passado)**
```javascript
ALLOWED_TRANSITIONS: {
  'completed': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'REASON_OPTIONAL',
    message: 'Agendamento confirmado de ontem marcado como concluído.'
  },
  'no-show': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'BASIC',
    message: 'Cliente confirmado de ontem não compareceu.'
  }
}

BLOCKED_TRANSITIONS: {
  'pending': 'Muito tarde para reverter confirmação',
  'cancelled_by_establishment': 'Muito tarde para cancelar',
  'cancelled_by_client': 'Muito tarde para cliente cancelar',
  'rescheduled': 'Não é possível reagendar agendamento passado',
  'in_progress': 'Não é possível iniciar agendamento que já passou'
}
```

#### **DISTANT_PAST (>24h passado)**
```javascript
ALLOWED_TRANSITIONS: {
  'completed': {
    permission: 'ADMIN_ONLY',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Registro histórico atualizado para concluído.'
  },
  'no-show': {
    permission: 'ADMIN_ONLY',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Falta histórica registrada.'
  }
}

BLOCKED_TRANSITIONS: {
  'pending': 'Registro muito antigo para reverter',
  'cancelled_by_establishment': 'Registro muito antigo para cancelar',
  'cancelled_by_client': 'Registro muito antigo para cancelar',
  'rescheduled': 'Não é possível reagendar registro histórico',
  'in_progress': 'Não é possível iniciar agendamento histórico'
}
```

---

### **🎉 FROM: COMPLETED (Concluído)**

#### **TODAS AS CATEGORIAS TEMPORAIS**
```javascript
ALLOWED_TRANSITIONS: {
  // NENHUMA - Estado final
}

BLOCKED_TRANSITIONS: {
  'pending': 'Não é possível reverter agendamento concluído para pendente',
  'confirmed': 'Não é possível reverter agendamento concluído para confirmado',
  'cancelled_by_establishment': 'Não é possível cancelar agendamento já concluído',
  'cancelled_by_client': 'Não é possível cancelar agendamento já concluído',
  'no-show': 'Cliente já foi atendido, não pode ser falta',
  'rescheduled': 'Não é possível reagendar agendamento já concluído',
  'in_progress': 'Agendamento já foi finalizado'
}

SPECIAL_CASES: {
  'admin_correction': {
    permission: 'SUPER_ADMIN_ONLY',
    confirmation: 'TRIPLE',
    validation: 'EMERGENCY_REASON + SUPERVISOR_APPROVAL + AUDIT_LOG',
    message: 'Correção administrativa de registro concluído.',
    note: 'Apenas em casos excepcionais de erro de sistema'
  }
}
```

---

### **❌ FROM: CANCELLED_BY_ESTABLISHMENT**

#### **TODAS AS CATEGORIAS TEMPORAIS**
```javascript
ALLOWED_TRANSITIONS: {
  // NENHUMA em condições normais - Estado final
}

BLOCKED_TRANSITIONS: {
  'pending': 'Não é possível reverter cancelamento para pendente',
  'confirmed': 'Não é possível reverter cancelamento para confirmado',
  'completed': 'Agendamento foi cancelado, não pode ser concluído',
  'cancelled_by_client': 'Agendamento já foi cancelado pelo estabelecimento',
  'no-show': 'Agendamento foi cancelado, cliente não deveria comparecer',
  'rescheduled': 'Agendamento cancelado não pode ser reagendado',
  'in_progress': 'Agendamento cancelado não pode ser iniciado'
}

SPECIAL_CASES: {
  'mistake_correction': {
    permission: 'ADMIN_ONLY',
    confirmation: 'TRIPLE',
    validation: 'DETAILED_REASON + SUPERVISOR_APPROVAL',
    message: 'Correção de cancelamento incorreto.',
    allowed_target: ['pending', 'confirmed'],
    condition: 'Apenas se cancelamento foi feito por engano e dentro de 1 hora'
  }
}
```

---

### **❌ FROM: CANCELLED_BY_CLIENT**

#### **TODAS AS CATEGORIAS TEMPORAIS**
```javascript
ALLOWED_TRANSITIONS: {
  'pending': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Cliente solicitou reativação do agendamento.',
    condition: 'Apenas se houver disponibilidade no horário original'
  }
}

BLOCKED_TRANSITIONS: {
  'confirmed': 'Cliente precisa primeiro reverter para pendente',
  'completed': 'Agendamento foi cancelado pelo cliente',
  'cancelled_by_establishment': 'Agendamento já foi cancelado pelo cliente',
  'no-show': 'Cliente cancelou, não pode ser falta',
  'rescheduled': 'Cliente deve criar novo agendamento',
  'in_progress': 'Agendamento cancelado não pode ser iniciado'
}
```

---

### **👻 FROM: NO_SHOW (Falta)**

#### **TODAS AS CATEGORIAS TEMPORAIS**
```javascript
ALLOWED_TRANSITIONS: {
  'completed': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Cliente compareceu após ser marcado como falta.',
    condition: 'Apenas se cliente apareceu no mesmo dia'
  }
}

BLOCKED_TRANSITIONS: {
  'pending': 'Não é possível reverter falta para pendente',
  'confirmed': 'Não é possível reverter falta para confirmado',
  'cancelled_by_establishment': 'Cliente faltou, não foi cancelado',
  'cancelled_by_client': 'Cliente faltou, não cancelou',
  'rescheduled': 'Cliente faltante deve criar novo agendamento',
  'in_progress': 'Cliente não compareceu, não pode iniciar atendimento'
}

SPECIAL_CASES: {
  'late_arrival': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'BASIC',
    message: 'Cliente chegou após ser marcado como falta.',
    allowed_target: ['completed'],
    condition: 'Apenas no mesmo dia do agendamento'
  }
}
```

---

### **🔄 FROM: RESCHEDULED (Reagendado)**

#### **TODAS AS CATEGORIAS TEMPORAIS**
```javascript
ALLOWED_TRANSITIONS: {
  'pending': {
    permission: 'SYSTEM_AUTO',
    confirmation: 'NONE',
    validation: 'NEW_APPOINTMENT_CREATED',
    message: 'Novo agendamento criado para a data reagendada.',
    note: 'Transição automática do sistema'
  }
}

BLOCKED_TRANSITIONS: {
  'confirmed': 'Reagendamento deve primeiro ir para pendente',
  'completed': 'Reagendamento ainda não aconteceu na nova data',
  'cancelled_by_establishment': 'Use cancelamento direto',
  'cancelled_by_client': 'Use cancelamento direto',
  'no-show': 'Reagendamento ainda não aconteceu',
  'in_progress': 'Reagendamento ainda não chegou na nova data'
}
```

---

### **⏳ FROM: IN_PROGRESS (Em Atendimento)**

#### **CURRENT_WINDOW apenas**
```javascript
ALLOWED_TRANSITIONS: {
  'completed': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'BASIC',
    message: 'Atendimento finalizado com sucesso.'
  },
  'cancelled_by_client': {
    permission: 'STAFF_ADMIN',
    confirmation: 'DOUBLE',
    validation: 'REASON_REQUIRED',
    message: 'Cliente interrompeu atendimento.',
    warning: 'Cliente pode ser cobrado parcialmente'
  }
}

BLOCKED_TRANSITIONS: {
  'pending': 'Atendimento já iniciado',
  'confirmed': 'Atendimento já iniciado',
  'cancelled_by_establishment': 'Atendimento em andamento não pode ser cancelado',
  'no-show': 'Cliente está presente sendo atendido',
  'rescheduled': 'Atendimento em andamento não pode ser reagendado'
}
```

---

## 🚨 **CASOS ESPECIAIS E EXCEÇÕES**

### **Emergency Override (Substituição de Emergência)**
```javascript
EMERGENCY_CASES: {
  permission: 'SUPER_ADMIN_ONLY',
  requires: [
    'DETAILED_JUSTIFICATION',
    'SUPERVISOR_APPROVAL', 
    'CUSTOMER_NOTIFICATION',
    'AUDIT_LOG_DETAILED'
  ],
  available_from: 'ANY_STATUS',
  available_to: 'ANY_STATUS',
  message: 'Alteração de emergência realizada por administrador.',
  audit_level: 'CRITICAL'
}
```

### **Bulk Status Updates (Atualizações em Massa)**
```javascript
BULK_OPERATIONS: {
  'mass_cancellation': {
    permission: 'ADMIN_ONLY',
    confirmation: 'TRIPLE',
    validation: 'EMERGENCY_REASON + CUSTOMER_NOTIFICATION',
    use_case: 'Fechamento inesperado do estabelecimento'
  },
  'mass_rescheduling': {
    permission: 'ADMIN_ONLY', 
    confirmation: 'DOUBLE',
    validation: 'REASON + NEW_DATES',
    use_case: 'Mudança de horário de funcionamento'
  }
}
```

### **System Maintenance (Manutenção do Sistema)**
```javascript
MAINTENANCE_CASES: {
  'data_migration': {
    permission: 'SYSTEM_ADMIN',
    validation: 'BACKUP_REQUIRED',
    message: 'Migração de dados em andamento'
  },
  'status_correction': {
    permission: 'SYSTEM_ADMIN',
    validation: 'AUDIT_APPROVED',
    message: 'Correção automática de inconsistência'
  }
}
```

---

## 📊 **REGRAS GLOBAIS**

### **Permissions (Permissões)**
```javascript
PERMISSION_LEVELS: {
  'ANY_USER': ['client', 'staff', 'admin', 'super_admin'],
  'STAFF_ADMIN': ['staff', 'admin', 'super_admin'],
  'ADMIN_ONLY': ['admin', 'super_admin'], 
  'SUPER_ADMIN_ONLY': ['super_admin'],
  'SYSTEM_AUTO': ['system']
}
```

### **Confirmation Types (Tipos de Confirmação)**
```javascript
CONFIRMATION_TYPES: {
  'NONE': {
    steps: 0,
    message: null
  },
  'SIMPLE': {
    steps: 1,
    message: 'Confirma esta ação?'
  },
  'DOUBLE': {
    steps: 2,
    message: 'Esta ação não pode ser desfeita. Confirma?',
    requires_checkbox: true
  },
  'TRIPLE': {
    steps: 3,
    message: 'ATENÇÃO: Ação crítica. Digite "CONFIRMO" para prosseguir.',
    requires_text_input: 'CONFIRMO'
  }
}
```

### **Validation Requirements (Requisitos de Validação)**
```javascript
VALIDATION_TYPES: {
  'BASIC': ['status_allowed', 'user_permission'],
  'REASON_OPTIONAL': ['basic', 'reason_field_available'],
  'REASON_REQUIRED': ['basic', 'reason_field_mandatory'],
  'NEW_DATE_REQUIRED': ['basic', 'new_appointment_date'],
  'SUPERVISOR_APPROVAL': ['basic', 'supervisor_code'],
  'EMERGENCY_REASON_REQUIRED': ['basic', 'detailed_emergency_justification'],
  'MINIMUM_WAIT_30MIN': ['basic', 'time_passed_minimum_30_minutes']
}
```

---

## 🔍 **MATRIZ DE VALIDAÇÃO TEMPORAL**

```javascript
TEMPORAL_VALIDATION_MATRIX = {
  // Tabela de verdade para cada combinação
  [current_status][target_status][time_category] = {
    allowed: boolean,
    permission: string,
    confirmation: string,
    validation: array,
    message: string,
    warning?: string,
    condition?: string
  }
}
```

---

## 📈 **MÉTRICAS E MONITORAMENTO**

### **KPIs Importantes**
- Taxa de agendamentos confirmados por categoria temporal
- Frequência de cancelamentos por período de antecedência
- Índice de no-shows por dia da semana
- Tempo médio entre criação e confirmação
- Padrões de reagendamento por cliente

### **Alertas do Sistema**
- Muitos cancelamentos de última hora
- Alto índice de no-shows
- Agendamentos não confirmados próximos ao vencimento
- Padrões anômalos de comportamento

---

*Este documento deve ser atualizado sempre que novas regras de negócio forem implementadas ou quando novos status forem adicionados ao sistema.*
