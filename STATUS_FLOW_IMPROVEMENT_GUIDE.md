# Guia Abrangente: Aprimoramento do Fluxo de Status dos Agendamentos

## 📋 Sumário Executivo

Este documento apresenta uma análise completa e propostas de melhoria para o fluxo de mudanças de status dos agendamentos no sistema Orkestre. O objetivo é tornar o sistema mais robusto, confiável e com melhor experiência do usuário, abordando problemas identificados e implementando boas práticas de validação, feedback e auditoria.

### Status Atual Identificados
- `PENDING`: Agendamento criado, aguardando confirmação
- `CONFIRMED`: Agendamento confirmado pelo profissional
- `COMPLETED`: Serviço realizado
- `CANCELLED`: Agendamento cancelado
- `NO_SHOW`: Cliente não compareceu

## 🚨 Problemas Críticos Identificados

### 1. **Ausência de Validação de Transições**
**Problema:** Atualmente qualquer status pode ser alterado para qualquer outro status.
**Exemplo:** Um agendamento `COMPLETED` pode ser alterado para `PENDING`, o que não faz sentido do ponto de vista de negócio.
**Impacto:** Dados inconsistentes, relatórios incorretos, confusão operacional.

### 2. **Falta de Regras Temporais**
**Problema:** Não há validação baseada em tempo para mudanças de status.
**Exemplo:** Um agendamento de ontem pode ser marcado como `CONFIRMED` hoje.
**Impacto:** Status irrelevantes, impossibilidade de auditoria temporal adequada.

### 3. **Ausência de Confirmação para Ações Críticas**
**Problema:** Mudanças irreversíveis acontecem com um simples clique.
**Exemplo:** Marcar como `COMPLETED` ou `CANCELLED` sem confirmação.
**Impacto:** Erros acidentais, perda de dados, reversões manuais necessárias.

### 4. **Feedback Inadequado ao Usuário**
**Problema:** Não há indicação visual de loading ou sucesso/erro nas mudanças.
**Impacto:** Usuário não sabe se a ação foi processada, pode clicar múltiplas vezes.

### 5. **Ausência de Auditoria**
**Problema:** Não há registro de quem mudou o status, quando e por quê.
**Impacto:** Impossibilidade de rastreamento, problemas de accountability.

## ✅ Propostas de Solução

### 1. **Sistema de Validação de Transições**

#### 1.1 Matriz de Transições Permitidas

| De \ Para | PENDING | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW |
|-----------|---------|-----------|-----------|-----------|---------|
| PENDING   | ❌      | ✅        | ❌        | ✅        | ❌      |
| CONFIRMED | ✅*     | ❌        | ✅        | ✅        | ✅      |
| COMPLETED | ❌      | ❌        | ❌        | ❌        | ❌      |
| CANCELLED | ❌      | ❌        | ❌        | ❌        | ❌      |
| NO_SHOW   | ❌      | ❌        | ❌        | ❌        | ❌      |

*✅ = Permitido sempre  
*✅* = Permitido com restrições temporais  
*❌ = Bloqueado*

#### 1.2 Regras Temporais Específicas

```javascript
const TRANSITION_RULES = {
  // Confirmação pode ser revertida até 2 horas antes do agendamento
  CONFIRMED_TO_PENDING: {
    timeLimit: -120, // minutos (negativo = antes do agendamento)
    message: "Só é possível reverter confirmação até 2h antes do horário agendado"
  },
  
  // Só pode marcar como completed a partir do horário agendado
  ANY_TO_COMPLETED: {
    timeLimit: 0, // minutos (0 = no horário agendado ou depois)
    message: "Só é possível marcar como concluído a partir do horário agendado"
  },
  
  // Pode marcar NO_SHOW até 30 minutos após o horário
  ANY_TO_NO_SHOW: {
    timeLimit: 30, // minutos (positivo = depois do agendamento)
    message: "Só é possível marcar como falta até 30 minutos após o horário"
  }
};
```

## ⏰ Validações Temporais: Cenários e Regras Detalhadas

### 1. **Classificação Temporal dos Agendamentos**

O sistema deve classificar automaticamente cada agendamento em uma das seguintes categorias baseadas no horário atual vs. horário do agendamento:

#### 1.1 Categorias Temporais

```javascript
const getAppointmentTimeCategory = (appointmentStartTime) => {
  const now = new Date();
  const appointmentTime = new Date(appointmentStartTime);
  const diffInMinutes = (appointmentTime - now) / (1000 * 60);
  
  if (diffInMinutes > 1440) return 'DISTANT_FUTURE';     // Mais de 24h no futuro
  if (diffInMinutes > 120) return 'NEAR_FUTURE';        // Entre 2h e 24h no futuro
  if (diffInMinutes > 0) return 'IMMINENT';             // Próximas 2 horas
  if (diffInMinutes >= -60) return 'CURRENT_WINDOW';     // Até 1h após
  if (diffInMinutes >= -1440) return 'RECENT_PAST';      // Entre 1h e 24h atrás
  return 'DISTANT_PAST';                                 // Mais de 24h atrás
};
```

### 2. **Matriz de Validação Temporal Completa**

#### 2.1 Regras por Categoria Temporal

| Categoria | PENDING → CONFIRMED | CONFIRMED → PENDING | CONFIRMED → COMPLETED | CONFIRMED → CANCELLED | CONFIRMED → NO_SHOW |
|-----------|-------------------|-------------------|---------------------|---------------------|-------------------|
| **DISTANT_FUTURE** (>24h) | ✅ Sempre | ✅ Sempre | ❌ Muito cedo | ✅ Sempre | ❌ Muito cedo |
| **NEAR_FUTURE** (2h-24h) | ✅ Sempre | ✅ Sempre | ❌ Muito cedo | ✅ Sempre | ❌ Muito cedo |
| **IMMINENT** (0-2h) | ✅ Sempre | ⚠️ Com aviso | ❌ Muito cedo | ✅ Com motivo | ❌ Muito cedo |
| **CURRENT_WINDOW** (0-1h atrás) | ✅ Sempre | ❌ Muito tarde | ✅ Sempre | ✅ Com motivo | ✅ Sempre |
| **RECENT_PAST** (1h-24h atrás) | ❌ Muito tarde | ❌ Muito tarde | ✅ Tardio | ⚠️ Justificar | ✅ Sempre |
| **DISTANT_PAST** (>24h atrás) | ❌ Muito tarde | ❌ Muito tarde | ⚠️ Excepcional | ⚠️ Excepcional | ⚠️ Excepcional |

#### 2.2 Mensagens e Comportamentos Específicos

```javascript
const TEMPORAL_VALIDATION_RULES = {
  PENDING_TO_CONFIRMED: {
    DISTANT_FUTURE: { allowed: true, message: "Agendamento confirmado" },
    NEAR_FUTURE: { allowed: true, message: "Agendamento confirmado" },
    IMMINENT: { allowed: true, message: "Agendamento confirmado (próximo ao horário)" },
    CURRENT_WINDOW: { allowed: true, message: "Confirmação realizada no horário" },
    RECENT_PAST: { allowed: false, message: "Não é possível confirmar agendamentos já passados" },
    DISTANT_PAST: { allowed: false, message: "Agendamento muito antigo para confirmação" }
  },
  
  CONFIRMED_TO_PENDING: {
    DISTANT_FUTURE: { allowed: true, message: "Confirmação revertida" },
    NEAR_FUTURE: { allowed: true, message: "Confirmação revertida" },
    IMMINENT: { 
      allowed: true, 
      warning: true,
      message: "Reverter confirmação próximo ao horário pode causar transtornos",
      requiresReason: true
    },
    CURRENT_WINDOW: { allowed: false, message: "Muito tarde para reverter confirmação" },
    RECENT_PAST: { allowed: false, message: "Não é possível reverter agendamentos já passados" },
    DISTANT_PAST: { allowed: false, message: "Agendamento muito antigo para alteração" }
  },
  
  ANY_TO_COMPLETED: {
    DISTANT_FUTURE: { allowed: false, message: "Não é possível marcar como concluído antes do horário" },
    NEAR_FUTURE: { allowed: false, message: "Serviço ainda não foi realizado" },
    IMMINENT: { allowed: false, message: "Aguarde o horário do agendamento" },
    CURRENT_WINDOW: { allowed: true, message: "Serviço concluído" },
    RECENT_PAST: { 
      allowed: true, 
      warning: true,
      message: "Marcando como concluído após o horário previsto"
    },
    DISTANT_PAST: { 
      allowed: true, 
      requiresPermission: true,
      requiresReason: true,
      message: "Conclusão de agendamento antigo requer justificativa"
    }
  },
  
  ANY_TO_NO_SHOW: {
    DISTANT_FUTURE: { allowed: false, message: "Não é possível marcar falta antes do horário" },
    NEAR_FUTURE: { allowed: false, message: "Agendamento ainda não ocorreu" },
    IMMINENT: { allowed: false, message: "Aguarde pelo menos o horário do agendamento" },
    CURRENT_WINDOW: { allowed: true, message: "Cliente não compareceu" },
    RECENT_PAST: { allowed: true, message: "Falta registrada" },
    DISTANT_PAST: { 
      allowed: true, 
      warning: true,
      message: "Registrando falta de agendamento antigo"
    }
  },
  
  ANY_TO_CANCELLED: {
    DISTANT_FUTURE: { allowed: true, requiresReason: true },
    NEAR_FUTURE: { allowed: true, requiresReason: true },
    IMMINENT: { 
      allowed: true, 
      requiresReason: true,
      warning: true,
      message: "Cancelamento de última hora pode gerar cobrança"
    },
    CURRENT_WINDOW: { 
      allowed: true, 
      requiresReason: true,
      requiresConfirmation: true
    },
    RECENT_PAST: { 
      allowed: true, 
      requiresReason: true,
      warning: true,
      message: "Cancelamento retroativo - justifique o motivo"
    },
    DISTANT_PAST: { 
      allowed: true, 
      requiresPermission: true,
      requiresReason: true
    }
  }
};
```

### 3. **Cenários Específicos e Comportamentos**

#### 3.1 Agendamento de Ontem (RECENT_PAST)

**Situação:** Agendamento marcado para ontem às 14:00, hoje são 10:00

**Regras Aplicadas:**
- ❌ **Não pode** mais confirmar (já passou)
- ❌ **Não pode** reverter confirmação (já passou)
- ✅ **Pode** marcar como concluído (com aviso de atraso)
- ✅ **Pode** marcar como falta
- ⚠️ **Pode** cancelar (mas com justificativa obrigatória)

**Implementação:**
```javascript
const handleRecentPastAppointment = (appointment, targetStatus) => {
  const warnings = [];
  const requirements = [];
  
  if (targetStatus === 'COMPLETED') {
    warnings.push("Você está marcando como concluído um agendamento que já passou do horário.");
  }
  
  if (targetStatus === 'CANCELLED') {
    requirements.push("É obrigatório informar o motivo do cancelamento retroativo.");
  }
  
  return { warnings, requirements, allowed: true };
};
```

#### 3.2 Agendamento de Amanhã (DISTANT_FUTURE)

**Situação:** Agendamento marcado para amanhã às 14:00

**Regras Aplicadas:**
- ✅ **Pode** confirmar normalmente
- ✅ **Pode** reverter confirmação sem restrições
- ❌ **Não pode** marcar como concluído (muito cedo)
- ❌ **Não pode** marcar como falta (muito cedo)
- ✅ **Pode** cancelar (com motivo)

#### 3.3 Agendamento Iminente (IMMINENT)

**Situação:** Agendamento para daqui a 1 hora

**Regras Aplicadas:**
- ✅ **Pode** confirmar
- ⚠️ **Pode** reverter confirmação (mas com aviso e motivo)
- ❌ **Não pode** marcar como concluído (ainda não aconteceu)
- ❌ **Não pode** marcar como falta (ainda não aconteceu)
- ⚠️ **Pode** cancelar (mas com aviso de última hora)

#### 3.4 Janela Atual (CURRENT_WINDOW)

**Situação:** Agendamento para agora ou até 1 hora atrás

**Regras Aplicadas:**
- ✅ **Pode** confirmar (se ainda não confirmado)
- ❌ **Não pode** reverter confirmação (muito tarde)
- ✅ **Pode** marcar como concluído
- ✅ **Pode** marcar como falta
- ✅ **Pode** cancelar (mas requer confirmação dupla)

### 4. **Implementação da Validação Temporal**

#### 4.1 Serviço de Validação Temporal

```python
# app/services/temporal_validation_service.py
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Any, Optional

class TimeCategory(Enum):
    DISTANT_FUTURE = "distant_future"
    NEAR_FUTURE = "near_future"
    IMMINENT = "imminent"
    CURRENT_WINDOW = "current_window"
    RECENT_PAST = "recent_past"
    DISTANT_PAST = "distant_past"

class TemporalValidationService:
    
    @staticmethod
    def get_time_category(appointment_time: datetime, current_time: Optional[datetime] = None) -> TimeCategory:
        """Determina a categoria temporal do agendamento"""
        if current_time is None:
            current_time = datetime.utcnow()
            
        diff_minutes = (appointment_time - current_time).total_seconds() / 60
        
        if diff_minutes > 1440:    # Mais de 24h no futuro
            return TimeCategory.DISTANT_FUTURE
        elif diff_minutes > 120:   # Entre 2h e 24h no futuro
            return TimeCategory.NEAR_FUTURE
        elif diff_minutes > 0:     # Próximas 2 horas
            return TimeCategory.IMMINENT
        elif diff_minutes >= -60:  # Até 1h após
            return TimeCategory.CURRENT_WINDOW
        elif diff_minutes >= -1440: # Entre 1h e 24h atrás
            return TimeCategory.RECENT_PAST
        else:                      # Mais de 24h atrás
            return TimeCategory.DISTANT_PAST
    
    @staticmethod
    def validate_temporal_transition(
        from_status: str,
        to_status: str,
        appointment_time: datetime,
        current_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Valida transição baseada no contexto temporal"""
        
        category = TemporalValidationService.get_time_category(appointment_time, current_time)
        transition_key = f"{from_status}_TO_{to_status}"
        
        # Buscar regra específica para esta transição e categoria
        rule = TEMPORAL_RULES.get(transition_key, {}).get(category.value)
        
        if not rule:
            return {
                'valid': False,
                'message': f'Transição {from_status} → {to_status} não definida para {category.value}',
                'category': category.value
            }
        
        result = {
            'valid': rule.get('allowed', False),
            'message': rule.get('message', ''),
            'category': category.value,
            'requires_warning': rule.get('warning', False),
            'requires_reason': rule.get('requiresReason', False),
            'requires_confirmation': rule.get('requiresConfirmation', False),
            'requires_permission': rule.get('requiresPermission', False)
        }
        
        return result

# Dicionário de regras temporais (seria importado de um arquivo de configuração)
TEMPORAL_RULES = {
    "PENDING_TO_CONFIRMED": {
        "distant_future": {"allowed": True, "message": "Agendamento confirmado"},
        "near_future": {"allowed": True, "message": "Agendamento confirmado"},
        "imminent": {"allowed": True, "message": "Agendamento confirmado (próximo ao horário)"},
        "current_window": {"allowed": True, "message": "Confirmação realizada no horário"},
        "recent_past": {"allowed": False, "message": "Não é possível confirmar agendamentos já passados"},
        "distant_past": {"allowed": False, "message": "Agendamento muito antigo para confirmação"}
    },
    # ... outras regras conforme o mapeamento acima
}
```

#### 4.2 Frontend - Hook de Validação Temporal

```javascript
// hooks/useTemporalValidation.js
import { useMemo } from 'react';
import { differenceInMinutes } from 'date-fns';

export const useTemporalValidation = (appointment) => {
  const timeCategory = useMemo(() => {
    const now = new Date();
    const appointmentTime = new Date(appointment.start_time);
    const diffMinutes = differenceInMinutes(appointmentTime, now);
    
    if (diffMinutes > 1440) return 'DISTANT_FUTURE';
    if (diffMinutes > 120) return 'NEAR_FUTURE';
    if (diffMinutes > 0) return 'IMMINENT';
    if (diffMinutes >= -60) return 'CURRENT_WINDOW';
    if (diffMinutes >= -1440) return 'RECENT_PAST';
    return 'DISTANT_PAST';
  }, [appointment.start_time]);
  
  const getContextualMessage = (targetStatus) => {
    const messages = {
      DISTANT_FUTURE: {
        COMPLETED: "⚠️ Muito cedo para marcar como concluído",
        NO_SHOW: "⚠️ Muito cedo para marcar como falta",
        CANCELLED: "Cancelamento com antecedência"
      },
      IMMINENT: {
        PENDING: "⚠️ Mudança de última hora - informe o motivo",
        CANCELLED: "⚠️ Cancelamento de última hora pode gerar cobrança"
      },
      RECENT_PAST: {
        COMPLETED: "⚠️ Marcando como concluído após o horário",
        CANCELLED: "⚠️ Cancelamento retroativo - justifique"
      },
      DISTANT_PAST: {
        COMPLETED: "⚠️ Conclusão de agendamento antigo",
        CANCELLED: "⚠️ Cancelamento de agendamento antigo",
        NO_SHOW: "⚠️ Registro de falta de agendamento antigo"
      }
    };
    
    return messages[timeCategory]?.[targetStatus] || null;
  };
  
  const getTimeDescription = () => {
    const descriptions = {
      DISTANT_FUTURE: "Agendamento futuro (mais de 24h)",
      NEAR_FUTURE: "Agendamento próximo (2h a 24h)",
      IMMINENT: "Agendamento iminente (próximas 2h)",
      CURRENT_WINDOW: "Horário atual (até 1h após)",
      RECENT_PAST: "Recém passado (1h a 24h atrás)",
      DISTANT_PAST: "Agendamento antigo (mais de 24h atrás)"
    };
    
    return descriptions[timeCategory];
  };
  
  return {
    timeCategory,
    getContextualMessage,
    getTimeDescription,
    isInPast: ['RECENT_PAST', 'DISTANT_PAST'].includes(timeCategory),
    isInFuture: ['DISTANT_FUTURE', 'NEAR_FUTURE', 'IMMINENT'].includes(timeCategory),
    isCurrent: timeCategory === 'CURRENT_WINDOW'
  };
};
```

### 5. **Interface Visual para Contexto Temporal**

#### 5.1 Indicador de Status Temporal

```javascript
// components/TemporalStatusIndicator.js
const TemporalStatusIndicator = ({ appointment }) => {
  const { timeCategory, getTimeDescription } = useTemporalValidation(appointment);
  
  const getIndicatorStyle = () => {
    const styles = {
      DISTANT_FUTURE: { color: '#28a745', icon: '📅' },
      NEAR_FUTURE: { color: '#17a2b8', icon: '⏰' },
      IMMINENT: { color: '#ffc107', icon: '⚡' },
      CURRENT_WINDOW: { color: '#fd7e14', icon: '🔥' },
      RECENT_PAST: { color: '#6c757d', icon: '⏱️' },
      DISTANT_PAST: { color: '#495057', icon: '📝' }
    };
    
    return styles[timeCategory] || styles.DISTANT_FUTURE;
  };
  
  const style = getIndicatorStyle();
  
  return (
    <div className="temporal-indicator" style={{ color: style.color }}>
      <span className="temporal-icon">{style.icon}</span>
      <span className="temporal-text">{getTimeDescription()}</span>
    </div>
  );
};
```

### 6. **Casos Especiais e Exceções**

#### 6.1 Agendamentos de Emergência
- **Situação:** Agendamento criado e executado no mesmo momento
- **Comportamento:** Permite transição direta PENDING → COMPLETED com confirmação

#### 6.2 Ajustes Retroativos
- **Situação:** Correção de registros antigos por administradores
- **Comportamento:** Requer permissões especiais e auditoria detalhada

#### 6.3 Fusos Horários
- **Situação:** Estabelecimentos em fusos diferentes
- **Comportamento:** Todas as validações consideram o fuso do estabelecimento

```javascript
// Exemplo de validação com fuso horário
const validateWithTimezone = (appointment, targetStatus) => {
  const establishmentTz = appointment.establishment.timezone;
  const appointmentTimeLocal = convertToTimezone(appointment.start_time, establishmentTz);
  const nowLocal = convertToTimezone(new Date(), establishmentTz);
  
  return TemporalValidationService.validate_temporal_transition(
    appointment.status,
    targetStatus,
    appointmentTimeLocal,
    nowLocal
  );
};
```

## 🎯 Benefícios das Validações Temporais

1. **Prevenção de Erros Lógicos:** Impossível marcar falta antes do agendamento
2. **Contexto Inteligente:** Mensagens específicas para cada situação temporal
3. **Flexibility com Controle:** Permite ajustes quando necessário, mas com validações
4. **Auditoria Temporal:** Registra não apenas o que foi feito, mas quando fazia sentido fazer
5. **UX Intuitiva:** Usuário entende por que certas ações estão ou não disponíveis

## 📚 Exemplos Práticos de Validações Temporais

### Exemplo 1: Segunda-feira de manhã organizando a agenda

**Situação:** São 9:00 de segunda-feira. O profissional está revisando agendamentos:

- **Agendamento A:** Sexta passada às 14:00 (DISTANT_PAST)
- **Agendamento B:** Ontem às 16:00 (RECENT_PAST)  
- **Agendamento C:** Hoje às 11:00 (NEAR_FUTURE)
- **Agendamento D:** Amanhã às 10:00 (DISTANT_FUTURE)

**Comportamentos do Sistema:**
```javascript
// Agendamento A (sexta passada) - DISTANT_PAST
const appointmentA = {
  start_time: '2025-06-09T14:00:00Z', // Sexta passada
  status: 'CONFIRMED'
};

// Opções disponíveis: 
// ✅ COMPLETED (com aviso: "Conclusão de agendamento antigo")
// ✅ NO_SHOW (com aviso: "Registro de falta de agendamento antigo")  
// ✅ CANCELLED (requer motivo + permissão especial)
// ❌ PENDING (não faz sentido reverter confirmação de agendamento antigo)

// Agendamento B (ontem) - RECENT_PAST
const appointmentB = {
  start_time: '2025-06-13T16:00:00Z', // Ontem
  status: 'CONFIRMED'
};

// Opções disponíveis:
// ✅ COMPLETED (com aviso: "Marcando como concluído após o horário previsto")
// ✅ NO_SHOW 
// ✅ CANCELLED (requer motivo obrigatório)
// ❌ PENDING (muito tarde para reverter)

// Agendamento C (hoje 11:00) - NEAR_FUTURE  
const appointmentC = {
  start_time: '2025-06-14T11:00:00Z', // Hoje às 11:00
  status: 'PENDING'
};

// Opções disponíveis:
// ✅ CONFIRMED
// ✅ CANCELLED (com motivo)
// ❌ COMPLETED (muito cedo)
// ❌ NO_SHOW (muito cedo)
```

### Exemplo 2: Situações de emergência e last-minute

**Situação:** São 13:45 e o agendamento é às 14:00 (IMMINENT - 15 minutos)

```javascript
const urgentAppointment = {
  start_time: '2025-06-14T14:00:00Z',
  status: 'CONFIRMED'
};

// Sistema detecta categoria IMMINENT
// Opções com avisos especiais:

// ⚠️ PENDING: "Reverter confirmação de última hora - informe o motivo"
//    Modal especial: "Esta ação pode causar transtornos ao cliente"
//    Campo obrigatório: Motivo da reversão

// ✅ CANCELLED: "Cancelamento de última hora pode gerar cobrança"  
//    Modal: "O cliente pode ser cobrado por cancelamento tardio"
//    Checkbox: "Estou ciente da política de cancelamento"

// ❌ COMPLETED: "Aguarde o horário do agendamento"
// ❌ NO_SHOW: "Ainda não é possível marcar como falta"
```

### Exemplo 3: Durante o atendimento (CURRENT_WINDOW)

**Situação:** São 14:30 e o agendamento era às 14:00 (30 minutos após - CURRENT_WINDOW)

```javascript
const currentAppointment = {
  start_time: '2025-06-14T14:00:00Z',
  status: 'CONFIRMED'
};

// Janela ativa para ações de conclusão
// Opções disponíveis:

// ✅ COMPLETED: "Serviço concluído"
//    Simples, sem avisos especiais

// ✅ NO_SHOW: "Cliente não compareceu"
//    Confirmation: "Confirma que o cliente não veio?"

// ✅ CANCELLED: "Cancelamento durante horário agendado"
//    Requer confirmação dupla + motivo
//    Aviso: "Cancelamento após início pode gerar cobrança total"

// ❌ PENDING: "Muito tarde para reverter confirmação"
```

### Exemplo 4: Fim do dia organizando pendências

**Situação:** São 18:00, organizando agendamentos do dia que não foram finalizados

```javascript
// Agendamento das 9:00 ainda CONFIRMED (9h atrás - RECENT_PAST)
const morningAppointment = {
  start_time: '2025-06-14T09:00:00Z',
  status: 'CONFIRMED'
};

// Sistema mostra alertas especiais:
// 🔍 "Agendamento de 9h ainda não finalizado"
// ⚠️ "Defina o status final antes de encerrar o dia"

// Opções com contexto:
// ✅ COMPLETED: "Marcar como concluído (com atraso no registro)"
// ✅ NO_SHOW: "Cliente não compareceu às 9h"  
// ✅ CANCELLED: "Cancelamento retroativo - informe o motivo"
```

### Exemplo 5: Casos especiais de ajuste de dados

**Situação:** Correção de registros antigos por administrador

```javascript
const oldAppointment = {
  start_time: '2025-06-01T10:00:00Z', // 2 semanas atrás
  status: 'PENDING',
  user_role: 'ADMIN'
};

// Sistema detecta DISTANT_PAST + ADMIN
// Opções especiais disponíveis:

// ✅ COMPLETED: Requer justificativa + aprovação superior
//    Modal: "Correção de registro antigo"
//    Campo: "Motivo da correção retroativa"
//    Campo: "Código de autorização do supervisor"

// ✅ CANCELLED: Mesmas exigências
// ✅ NO_SHOW: Mesmas exigências

// Log especial: "ADMIN_RETROACTIVE_CORRECTION"
```

### Exemplo 6: Integração com notificações automáticas

**Situação:** Sistema detecta padrões temporais e sugere ações

```javascript
// Auto-detecção de situações que precisam atenção
const systemSuggestions = {
  
  // Agendamentos confirmados há mais de 1h sem finalização
  STALE_CONFIRMED: {
    trigger: "appointment.status === 'CONFIRMED' && timePassed > 60min",
    action: "Mostrar notificação: 'Agendamento de X ainda não finalizado'",
    buttons: ["Marcar como Concluído", "Marcar como Falta", "Lembrar depois"]
  },
  
  // Agendamentos pendentes próximos ao horário  
  PENDING_IMMINENT: {
    trigger: "appointment.status === 'PENDING' && timeToStart < 30min",
    action: "Highlight na agenda + notificação",
    message: "Agendamento em 30min ainda pendente de confirmação"
  },
  
  // Agendamentos antigos não finalizados
  OLD_UNFINISHED: {
    trigger: "appointment.timePassed > 24h && status !== ['COMPLETED', 'CANCELLED', 'NO_SHOW']",
    action: "Relatório diário de pendências",
    requiresAction: true
  }
};
```

### Exemplo 7: Mensagens contextuais inteligentes

```javascript
// Sistema gera mensagens baseadas no contexto temporal
const getSmartMessage = (appointment, targetStatus) => {
  const { timeCategory } = useTemporalValidation(appointment);
  
  const contextualMessages = {
    
    // Tentativa de marcar como concluído muito cedo
    EARLY_COMPLETION: {
      DISTANT_FUTURE: "Este agendamento é para {formatDistance(appointment.start_time, now)}. Tem certeza que já foi realizado?",
      NEAR_FUTURE: "O agendamento é para {formatTime(appointment.start_time)}. Confirma que o serviço já foi prestado?",
      IMMINENT: "Faltam {minutesRemaining} minutos para o horário. O serviço foi adiantado?"
    },
    
    // Tentativa de cancelar muito tarde
    LATE_CANCELLATION: {
      CURRENT_WINDOW: "O cancelamento está sendo feito no horário do agendamento. O cliente pode ser cobrado integralmente.",
      RECENT_PAST: "Cancelamento retroativo. Este agendamento era para {formatRelativeTime(appointment.start_time)}.",
      DISTANT_PAST: "Este é um cancelamento de um agendamento antigo ({formatDate(appointment.start_time)}). Confirma a necessidade?"
    },
    
    // Padrões de comportamento
    BEHAVIOR_PATTERNS: {
      FREQUENT_LATE_COMPLETION: "Você tem marcado vários agendamentos como concluídos após o horário. Considere ajustar sua agenda.",
      FREQUENT_CANCELLATIONS: "Alto índice de cancelamentos detectado. Revise sua política de confirmação.",
      MANY_NO_SHOWS: "Muitas faltas registradas. Considere implementar confirmação por SMS."
    }
  };
  
  return generateContextualMessage(appointment, targetStatus, contextualMessages);
};
```

### Exemplo 8: Dashboard de insights temporais

```javascript
// Métricas baseadas em padrões temporais
const TemporalInsightsDashboard = () => {
  const insights = {
    
    // Análise de pontualidade
    punctualityMetrics: {
      onTimeCompletions: "87%", // Concluídos no horário correto
      lateCompletions: "8%",    // Concluídos após o horário  
      earlyCompletions: "5%"    // Concluídos antes (raros, mas acontece)
    },
    
    // Padrões de cancelamento
    cancellationPatterns: {
      advanceNotice: {
        moreThan24h: "45%",     // Cancelados com mais de 24h
        between2h24h: "30%",    // Cancelados entre 2h-24h
        lastMinute: "15%",      // Cancelados última hora
        retroactive: "10%"      // Cancelados após o horário
      }
    },
    
    // Eficiência de confirmações
    confirmationEfficiency: {
      immediateConfirm: "60%",    // Confirmados logo após criação
      dayBeforeConfirm: "25%",    // Confirmados no dia anterior
      lastMinuteConfirm: "10%",   // Confirmados última hora
      neverConfirmed: "5%"        // Nunca confirmados
    }
  };
  
  return <InsightsDashboard data={insights} />;
};
```

## 🔄 Fluxo Temporal Inteligente

### Workflow Automático Baseado em Tempo

```javascript
// Sistema que evolui automaticamente baseado no tempo
const TemporalWorkflow = {
  
  // 24h antes: Lembrete de confirmação
  "-24h": {
    trigger: "appointment.status === 'PENDING'",
    action: "sendConfirmationReminder",
    notification: "Lembre o cliente de confirmar agendamento para amanhã"
  },
  
  // 2h antes: Último aviso para confirmação
  "-2h": {
    trigger: "appointment.status === 'PENDING'",
    action: "finalConfirmationWarning",
    notification: "Agendamento em 2h ainda não confirmado - considere remarcar"
  },
  
  // 30min antes: Preparação
  "-30min": {
    trigger: "appointment.status === 'CONFIRMED'",
    action: "preparationReminder",
    notification: "Próximo agendamento em 30min - preparar materiais"
  },
  
  // Na hora: Início automático
  "0min": {
    trigger: "appointment.status === 'CONFIRMED'",
    action: "suggestStartService",
    notification: "Agendamento agora - iniciar atendimento?"
  },
  
  // 30min depois: Verificação
  "+30min": {
    trigger: "appointment.status === 'CONFIRMED'",
    action: "statusCheckReminder",
    notification: "Agendamento iniciado há 30min - atualizar status?"
  },
  
  // 1h depois: Alerta de pendência
  "+1h": {
    trigger: "appointment.status === 'CONFIRMED'",
    action: "urgentStatusUpdate",
    notification: "⚠️ Agendamento não finalizado há 1h - ação necessária"
  },
  
  // Fim do dia: Limpeza automática
  "endOfDay": {
    trigger: "appointment.status !== ['COMPLETED', 'CANCELLED', 'NO_SHOW']",
    action: "dailyCleanupPrompt",
    notification: "Defina status final para agendamentos pendentes"
  }
};
```

Essas validações temporais garantem que o sistema seja inteligente o suficiente para entender o contexto de cada ação, prevenindo erros lógicos e oferecendo uma experiência muito mais intuitiva e confiável para os usuários.

### 2. **Sistema de Confirmação Escalonado**

#### 2.1 Ações que Requerem Confirmação

```javascript
const CONFIRMATION_REQUIRED = {
  // Ações reversíveis - confirmação simples
  SIMPLE_CONFIRMATION: ['CANCELLED', 'NO_SHOW'],
  
  // Ações irreversíveis - confirmação dupla
  DOUBLE_CONFIRMATION: ['COMPLETED'],
  
  // Ações críticas - confirmação com motivo
  REASON_REQUIRED: ['CANCELLED']
};
```

#### 2.2 Implementação de Modais de Confirmação

```javascript
// Modal simples
const SimpleConfirmationModal = ({ action, onConfirm, onCancel }) => (
  <div className="modal">
    <h3>Confirmar ação</h3>
    <p>Tem certeza que deseja marcar como {action}?</p>
    <button onClick={onCancel}>Cancelar</button>
    <button onClick={onConfirm}>Confirmar</button>
  </div>
);

// Modal com dupla confirmação
const DoubleConfirmationModal = ({ action, onConfirm, onCancel }) => {
  const [firstConfirm, setFirstConfirm] = useState(false);
  
  return (
    <div className="modal">
      <h3>Confirmar conclusão do serviço</h3>
      <p>Esta ação não pode ser desfeita.</p>
      
      <label>
        <input 
          type="checkbox" 
          checked={firstConfirm}
          onChange={(e) => setFirstConfirm(e.target.checked)}
        />
        Confirmo que o serviço foi realizado
      </label>
      
      <button onClick={onCancel}>Cancelar</button>
      <button 
        onClick={onConfirm} 
        disabled={!firstConfirm}
        className={firstConfirm ? 'btn-danger' : 'btn-disabled'}
      >
        Marcar como Concluído
      </button>
    </div>
  );
};
```

### 3. **Sistema de Feedback Visual Aprimorado**

#### 3.1 Estados de Loading por Botão

```javascript
const StatusButton = ({ status, appointmentId, currentStatus, onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  
  const handleStatusChange = async () => {
    setIsLoading(true);
    setLastAction(status);
    
    try {
      await onStatusChange(appointmentId, status);
      // Feedback de sucesso será tratado pelo componente pai
    } catch (error) {
      // Feedback de erro será tratado pelo componente pai
    } finally {
      setIsLoading(false);
      setLastAction(null);
    }
  };
  
  return (
    <button 
      className={`status-btn ${isLoading ? 'loading' : ''} ${status === currentStatus ? 'active' : ''}`}
      onClick={handleStatusChange}
      disabled={isLoading}
    >
      {isLoading && lastAction === status ? (
        <LoadingSpinner size="small" />
      ) : (
        getStatusLabel(status)
      )}
    </button>
  );
};
```

#### 3.2 Sistema de Notificações

```javascript
const NotificationSystem = {
  success: (message, duration = 3000) => {
    showNotification({
      type: 'success',
      message,
      duration,
      icon: '✅'
    });
  },
  
  error: (message, duration = 5000) => {
    showNotification({
      type: 'error',
      message,
      duration,
      icon: '❌'
    });
  },
  
  warning: (message, duration = 4000) => {
    showNotification({
      type: 'warning',
      message,
      duration,
      icon: '⚠️'
    });
  }
};

// Exemplo de uso após mudança de status
const handleStatusSuccess = (newStatus) => {
  const messages = {
    CONFIRMED: 'Agendamento confirmado com sucesso!',
    COMPLETED: 'Serviço marcado como concluído.',
    CANCELLED: 'Agendamento cancelado.',
    NO_SHOW: 'Marcado como falta do cliente.'
  };
  
  NotificationSystem.success(messages[newStatus]);
};
```

### 4. **Sistema de Auditoria Completo**

#### 4.1 Modelo de Auditoria no Backend

```python
# app/models/appointment_audit_model.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import datetime

class AppointmentAudit(Base):
    __tablename__ = "appointment_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status anterior e novo
    previous_status = Column(String, nullable=True)  # None para criação
    new_status = Column(String, nullable=False)
    
    # Contexto da mudança
    reason = Column(Text, nullable=True)  # Motivo fornecido pelo usuário
    ip_address = Column(String, nullable=True)  # Para rastreamento
    user_agent = Column(String, nullable=True)  # Dispositivo/browser
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    appointment = relationship("Appointment", back_populates="audit_logs")
    user = relationship("User")
```

#### 4.2 Serviço de Auditoria

```python
# app/services/audit_service.py
from sqlalchemy.orm import Session
from app.models.appointment_audit_model import AppointmentAudit
from app.models.appointment_model import AppointmentStatus

def log_status_change(
    db: Session,
    appointment_id: int,
    user_id: int,
    previous_status: AppointmentStatus,
    new_status: AppointmentStatus,
    reason: str = None,
    ip_address: str = None,
    user_agent: str = None
):
    """Registra uma mudança de status no log de auditoria"""
    audit_log = AppointmentAudit(
        appointment_id=appointment_id,
        user_id=user_id,
        previous_status=previous_status.value if previous_status else None,
        new_status=new_status.value,
        reason=reason,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(audit_log)
    db.commit()
    return audit_log

def get_appointment_history(db: Session, appointment_id: int):
    """Recupera o histórico completo de um agendamento"""
    return db.query(AppointmentAudit)\
        .filter(AppointmentAudit.appointment_id == appointment_id)\
        .order_by(AppointmentAudit.created_at.desc())\
        .all()
```

### 5. **Validação Robusta no Backend**

#### 5.1 Serviço de Validação de Transições

```python
# app/services/status_validation_service.py
from datetime import datetime, timedelta
from app.models.appointment_model import AppointmentStatus
from typing import Optional, Dict, Any

class StatusTransitionError(Exception):
    """Exceção para transições inválidas de status"""
    pass

class StatusValidationService:
    
    # Matriz de transições permitidas
    ALLOWED_TRANSITIONS = {
        AppointmentStatus.PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
        AppointmentStatus.CONFIRMED: [AppointmentStatus.PENDING, AppointmentStatus.COMPLETED, 
                                     AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        AppointmentStatus.COMPLETED: [],  # Estado final
        AppointmentStatus.CANCELLED: [],  # Estado final
        AppointmentStatus.NO_SHOW: []     # Estado final
    }
    
    # Regras temporais em minutos
    TIME_RULES = {
        (AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING): -120,  # Até 2h antes
        (None, AppointmentStatus.COMPLETED): 0,   # Só após o horário
        (None, AppointmentStatus.NO_SHOW): 30,    # Até 30min após
    }
    
    @classmethod
    def validate_transition(
        cls, 
        current_status: AppointmentStatus, 
        new_status: AppointmentStatus,
        appointment_start_time: datetime,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Valida se uma transição de status é permitida
        
        Returns:
            Dict com 'valid' (bool), 'message' (str), 'requires_confirmation' (bool)
        """
        
        # 1. Verificar se a transição é permitida na matriz
        if new_status not in cls.ALLOWED_TRANSITIONS.get(current_status, []):
            return {
                'valid': False,
                'message': f'Transição de {current_status.value} para {new_status.value} não é permitida',
                'requires_confirmation': False
            }
        
        # 2. Verificar regras temporais
        now = datetime.utcnow()
        time_diff_minutes = (now - appointment_start_time).total_seconds() / 60
        
        # Regra específica para esta transição
        transition_key = (current_status, new_status)
        generic_key = (None, new_status)
        
        time_limit = cls.TIME_RULES.get(transition_key) or cls.TIME_RULES.get(generic_key)
        
        if time_limit is not None:
            if time_limit < 0:  # Regra "antes do agendamento"
                if time_diff_minutes > abs(time_limit):
                    return {
                        'valid': False,
                        'message': f'Esta ação só pode ser realizada até {abs(time_limit)} minutos antes do agendamento',
                        'requires_confirmation': False
                    }
            else:  # Regra "após o agendamento"
                if time_diff_minutes < time_limit:
                    return {
                        'valid': False,
                        'message': f'Esta ação só pode ser realizada {time_limit} minutos após o horário agendado',
                        'requires_confirmation': False
                    }
        
        # 3. Verificar se requer motivo
        requires_reason = new_status in [AppointmentStatus.CANCELLED]
        if requires_reason and not reason:
            return {
                'valid': False,
                'message': 'É obrigatório informar o motivo para esta ação',
                'requires_confirmation': False
            }
        
        # 4. Determinar se requer confirmação
        requires_confirmation = new_status in [
            AppointmentStatus.COMPLETED, 
            AppointmentStatus.CANCELLED, 
            AppointmentStatus.NO_SHOW
        ]
        
        return {
            'valid': True,
            'message': 'Transição válida',
            'requires_confirmation': requires_confirmation
        }
```

#### 5.2 Endpoint Aprimorado de Mudança de Status

```python
# app/api/v1/endpoints/appointment_router.py (atualizado)

@router.patch("/appointments/{appointment_id}/status", response_model=Appointment)
def update_appointment_status_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    appointment_id: int,
    status_update: AppointmentStatusUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    request: Request  # Para capturar IP e User-Agent
):
    """
    Atualiza o status de um agendamento com validação robusta.
    """
    # 1. Buscar o agendamento
    db_appointment = appointment_service.get_appointment(db, appointment_id=appointment_id)
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    # 2. Verificar permissão
    if db_appointment.establishment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para modificar este agendamento")
    
    # 3. Validar a transição
    validation_result = StatusValidationService.validate_transition(
        current_status=db_appointment.status,
        new_status=status_update.status,
        appointment_start_time=db_appointment.start_time,
        reason=status_update.reason
    )
    
    if not validation_result['valid']:
        raise HTTPException(status_code=400, detail=validation_result['message'])
    
    # 4. Verificar confirmação (se necessário)
    if validation_result['requires_confirmation'] and not status_update.confirmed:
        raise HTTPException(
            status_code=400, 
            detail="Esta ação requer confirmação explícita"
        )
    
    try:
        # 5. Atualizar o status
        old_status = db_appointment.status
        updated_appointment = appointment_service.update_appointment_status(
            db=db, 
            appointment_db_obj=db_appointment, 
            status_in=status_update.status
        )
        
        # 6. Registrar auditoria
        audit_service.log_status_change(
            db=db,
            appointment_id=appointment_id,
            user_id=current_user.id,
            previous_status=old_status,
            new_status=status_update.status,
            reason=status_update.reason,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        
        return updated_appointment
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
```

### 6. **Schema Atualizado para Mudança de Status**

```python
# app/schemas/appointment_schema.py (atualizado)

class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    reason: Optional[str] = None  # Obrigatório para alguns status
    confirmed: bool = False       # Para ações que requerem confirmação
    
    class Config:
        schema_extra = {
            "example": {
                "status": "CANCELLED",
                "reason": "Cliente solicitou cancelamento",
                "confirmed": True
            }
        }

# Schema para resposta de validação
class StatusValidationResponse(BaseModel):
    valid: bool
    message: str
    requires_confirmation: bool
    requires_reason: bool = False
```

### 7. **Frontend: Componente de Mudança de Status Aprimorado**

```javascript
// components/dashboard/AppointmentStatusManager.js
import React, { useState } from 'react';
import { updateAppointmentStatus } from '../../services/appointmentService';
import StatusConfirmationModal from './StatusConfirmationModal';
import { validateStatusTransition } from '../../utils/statusValidation';

const AppointmentStatusManager = ({ appointment, onStatusUpdate }) => {
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const handleStatusClick = async (newStatus) => {
    // 1. Validação client-side
    const validation = validateStatusTransition(appointment, newStatus);
    
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }
    
    // 2. Se requer confirmação, mostrar modal
    if (validation.requiresConfirmation) {
      setPendingStatus(newStatus);
      setShowModal(true);
      return;
    }
    
    // 3. Executar mudança diretamente
    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus, reason = null, confirmed = false) => {
    setIsLoading(true);
    setValidationError(null);
    
    try {
      const response = await updateAppointmentStatus(appointment.id, {
        status: newStatus,
        reason,
        confirmed
      });
      
      // Sucesso
      onStatusUpdate(response);
      showSuccessNotification(newStatus);
      
    } catch (error) {
      // Erro
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar status';
      setValidationError(errorMessage);
      showErrorNotification(errorMessage);
      
    } finally {
      setIsLoading(false);
      setShowModal(false);
      setPendingStatus(null);
    }
  };

  const getAvailableStatuses = () => {
    const currentStatus = appointment.status;
    const allStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    
    return allStatuses.filter(status => {
      if (status === currentStatus) return false;
      
      const validation = validateStatusTransition(appointment, status);
      return validation.valid;
    });
  };

  return (
    <div className="status-manager">
      {validationError && (
        <div className="error-message">
          {validationError}
          <button onClick={() => setValidationError(null)}>×</button>
        </div>
      )}
      
      <div className="status-buttons">
        {getAvailableStatuses().map(status => (
          <button
            key={status}
            className={`status-btn status-${status.toLowerCase()} ${isLoading ? 'loading' : ''}`}
            onClick={() => handleStatusClick(status)}
            disabled={isLoading}
          >
            {isLoading && pendingStatus === status ? (
              <LoadingSpinner />
            ) : (
              getStatusLabel(status)
            )}
          </button>
        ))}
      </div>
      
      {showModal && (
        <StatusConfirmationModal
          status={pendingStatus}
          appointment={appointment}
          onConfirm={(reason, confirmed) => executeStatusChange(pendingStatus, reason, confirmed)}
          onCancel={() => {
            setShowModal(false);
            setPendingStatus(null);
          }}
        />
      )}
    </div>
  );
};

export default AppointmentStatusManager;
```

### 8. **Utilitário de Validação Client-Side**

```javascript
// utils/statusValidation.js
import { format, isAfter, isBefore, addMinutes, subMinutes } from 'date-fns';

const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PENDING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: []
};

const CONFIRMATION_REQUIRED = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
const REASON_REQUIRED = ['CANCELLED'];

export const validateStatusTransition = (appointment, newStatus) => {
  const currentStatus = appointment.status;
  const appointmentTime = new Date(appointment.start_time);
  const now = new Date();
  
  // 1. Verificar se transição é permitida
  if (!STATUS_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    return {
      valid: false,
      message: `Não é possível alterar de ${currentStatus} para ${newStatus}`,
      requiresConfirmation: false
    };
  }
  
  // 2. Regras temporais
  if (currentStatus === 'CONFIRMED' && newStatus === 'PENDING') {
    const twoHoursBefore = subMinutes(appointmentTime, 120);
    if (isAfter(now, twoHoursBefore)) {
      return {
        valid: false,
        message: 'Só é possível reverter confirmação até 2 horas antes do agendamento',
        requiresConfirmation: false
      };
    }
  }
  
  if (newStatus === 'COMPLETED') {
    if (isBefore(now, appointmentTime)) {
      return {
        valid: false,
        message: 'Só é possível marcar como concluído a partir do horário agendado',
        requiresConfirmation: false
      };
    }
  }
  
  if (newStatus === 'NO_SHOW') {
    const thirtyMinutesAfter = addMinutes(appointmentTime, 30);
    if (isAfter(now, thirtyMinutesAfter)) {
      return {
        valid: false,
        message: 'Só é possível marcar como falta até 30 minutos após o horário',
        requiresConfirmation: false
      };
    }
  }
  
  return {
    valid: true,
    message: 'Transição válida',
    requiresConfirmation: CONFIRMATION_REQUIRED.includes(newStatus),
    requiresReason: REASON_REQUIRED.includes(newStatus)
  };
};
```

## 🎯 Benefícios Esperados

### 1. **Robustez e Confiabilidade**
- Eliminação de estados inconsistentes
- Prevenção de mudanças temporalmente incorretas
- Validação em múltiplas camadas (frontend + backend)

### 2. **Melhor Experiência do Usuário**
- Feedback visual claro e imediato
- Prevenção de erros acidentais
- Confirmações inteligentes baseadas no contexto

### 3. **Rastreabilidade e Auditoria**
- Histórico completo de todas as mudanças
- Identificação de quem fez cada alteração
- Possibilidade de análise de padrões operacionais

### 4. **Facilidade de Manutenção**
- Lógica centralized de validação
- Fácil adição de novos status e regras
- Testes automatizados para todas as transições

## 🚀 Plano de Implementação

### Fase 1: Fundação (1-2 semanas)
1. Implementar modelo de auditoria no backend
2. Criar serviço de validação de transições
3. Atualizar endpoint de mudança de status

### Fase 2: Frontend Básico (1 semana)
1. Implementar validação client-side
2. Criar sistema de notificações
3. Adicionar loading states

### Fase 3: UX Avançado (1 semana)
1. Implementar modais de confirmação
2. Adicionar componente de histórico
3. Melhorar feedback visual

### Fase 4: Refinamento (1 semana)
1. Testes de integração
2. Ajustes baseados em feedback
3. Documentação final

## 📊 Métricas de Sucesso

1. **Redução de Estados Inconsistentes**: Meta de 95% de redução
2. **Tempo de Resposta**: Manter abaixo de 200ms para mudanças de status
3. **Satisfação do Usuário**: Pesquisa pós-implementação
4. **Auditoria**: 100% das mudanças registradas

## 🔍 Considerações Adicionais

### Novos Status Propostos (Opcional)
- `RESCHEDULED`: Para remarcar agendamentos
- `IN_PROGRESS`: Para serviços em andamento
- `LATE`: Para clientes atrasados

### Integrações Futuras
- Notificações por SMS/email automáticas
- Sincronização com calendários externos
- Dashboard de métricas operacionais

---

*Este documento serve como guia técnico e de negócio para a implementação do sistema aprimorado de status. Deve ser revisado e aprovado pelas equipes de desenvolvimento, produto e negócio antes da implementação.*
