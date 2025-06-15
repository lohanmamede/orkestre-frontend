# 📊 **MATRIZ COMPLETA DE TRANSIÇÕES DE STATUS**

## 🎯 **OBJETIVO**
Este documento define **TODOS** os cenários possíveis de transição de status em agendamentos, considerando contexto temporal, regras de negócio e validações necessárias.

---

## 📋 **STATUS DISPONÍVEIS NO SISTEMA**

```javascript
const APPOINTMENT_STATUS = {
  PENDING: 'pending',                    // Aguardando confirmação
  CONFIRMED: 'confirmed',                // Confirmado pelo cliente/estabelecimento
  COMPLETED: 'completed',                // Serviço realizado com sucesso
  CANCELLED_BY_ESTABLISHMENT: 'cancelled_by_establishment', // Cancelado pelo salão
  CANCELLED_BY_CLIENT: 'cancelled_by_client',             // Cancelado pelo cliente
  NO_SHOW: 'no-show',                   // Cliente não compareceu
  RESCHEDULED: 'rescheduled',           // Reagendado (novo status sugerido)
  IN_PROGRESS: 'in_progress'            // Em atendimento (novo status sugerido)
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

#### **DISTANT_FUTURE (>24h futuro)**
```javascript
ALLOWED_TRANSITIONS: {
  'confirmed': {
    permission: 'ANY_USER',
    confirmation: 'NONE',
    validation: 'BASIC',
    message: 'Agendamento confirmado com sucesso!'
  },
  'cancelled_by_establishment': {
    permission: 'STAFF_ADMIN',
    confirmation: 'SIMPLE',
    validation: 'REASON_OPTIONAL',
    message: 'Agendamento cancelado. Cliente será notificado.'
  },
  'cancelled_by_client': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'REASON_OPTIONAL',
    message: 'Cancelamento do cliente registrado.'
  },
  'rescheduled': {
    permission: 'ANY_USER',
    confirmation: 'SIMPLE',
    validation: 'NEW_DATE_REQUIRED',
    message: 'Agendamento reagendado. Novo horário definido.'
  }
}

BLOCKED_TRANSITIONS: {
  'completed': 'Não é possível concluir agendamento antes do horário marcado',
  'no-show': 'Cliente ainda não deveria ter comparecido',
  'in_progress': 'Agendamento está muito distante para iniciar atendimento'
}
```

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
  'no-show': 'Muito cedo para marcar como falta',
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
  'no-show': 'Aguarde pelo menos 15 minutos de atraso',
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
