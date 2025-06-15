# Exemplos Práticos: Implementação do Fluxo de Status

## 📖 Casos de Uso Detalhados

### Caso 1: Confirmação de Agendamento
**Cenário:** Profissional recebe novo agendamento PENDING às 14:00 para amanhã às 10:00

```javascript
// Frontend: componente mostra apenas opções válidas
const AvailableActions = () => {
  // Status atual: PENDING
  // Opções disponíveis: CONFIRMED, CANCELLED
  
  return (
    <div className="action-buttons">
      <button 
        className="btn-confirm"
        onClick={() => handleStatusChange('CONFIRMED')}
      >
        ✅ Confirmar
      </button>
      <button 
        className="btn-cancel"
        onClick={() => handleStatusChange('CANCELLED')}
      >
        ❌ Cancelar
      </button>
    </div>
  );
};
```

### Caso 2: Tentativa de Reverter Confirmação (Dentro do Prazo)
**Cenário:** Agendamento CONFIRMED para hoje às 14:00, são 11:30

```javascript
// Validação client-side permite reverter (ainda há mais de 2h)
const validation = validateStatusTransition(appointment, 'PENDING');
// Resultado: { valid: true, message: "Transição válida", requiresConfirmation: false }

// Backend também validará e permitirá a mudança
```

### Caso 3: Tentativa de Reverter Confirmação (Fora do Prazo)
**Cenário:** Agendamento CONFIRMED para hoje às 14:00, são 13:00

```javascript
// Validação client-side bloqueia
const validation = validateStatusTransition(appointment, 'PENDING');
// Resultado: { 
//   valid: false, 
//   message: "Só é possível reverter confirmação até 2 horas antes do agendamento",
//   requiresConfirmation: false 
// }

// UI mostra erro e não permite a ação
```

### Caso 4: Marcar Como Concluído
**Cenário:** Agendamento CONFIRMED para hoje às 14:00, são 14:30

```javascript
// 1. Usuário clica em "Concluído"
// 2. Sistema valida: horário OK (após agendamento)
// 3. Mostra modal de confirmação dupla
const handleCompleted = () => {
  setShowModal(true);
  setModalType('DOUBLE_CONFIRMATION');
};

// 4. Modal exige checkbox + confirmação
<DoubleConfirmationModal
  title="Marcar como Concluído"
  message="Esta ação não pode ser desfeita. Confirma que o serviço foi realizado?"
  onConfirm={confirmCompletion}
  onCancel={cancelAction}
/>

// 5. Após confirmação, chama API
const confirmCompletion = async () => {
  await updateAppointmentStatus(appointmentId, {
    status: 'COMPLETED',
    confirmed: true
  });
};
```

### Caso 5: Cancelamento com Motivo
**Cenário:** Cancelar agendamento confirmado

```javascript
// 1. Sistema detecta que CANCELLED requer motivo
// 2. Mostra modal com campo de texto obrigatório
<CancellationModal
  appointment={appointment}
  onConfirm={(reason) => handleCancellation(reason)}
  onCancel={closeModal}
/>

const CancellationModal = ({ appointment, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    setIsValid(reason.trim().length >= 10); // Mínimo 10 caracteres
  }, [reason]);
  
  return (
    <Modal>
      <h3>Cancelar Agendamento</h3>
      <p>Agendamento: {format(appointment.start_time, 'dd/MM/yyyy HH:mm')}</p>
      <p>Cliente: {appointment.customer_name}</p>
      
      <div className="form-group">
        <label>Motivo do cancelamento*</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Informe o motivo do cancelamento..."
          required
        />
        <small>Mínimo 10 caracteres</small>
      </div>
      
      <div className="modal-actions">
        <button onClick={onCancel}>Voltar</button>
        <button 
          onClick={() => onConfirm(reason)}
          disabled={!isValid}
          className="btn-danger"
        >
          Confirmar Cancelamento
        </button>
      </div>
    </Modal>
  );
};
```

## 🔧 Implementação Técnica por Etapas

### Etapa 1: Backend - Modelo de Auditoria

```sql
-- Migration para tabela de auditoria
CREATE TABLE appointment_audits (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_appointment_audits_appointment_id ON appointment_audits(appointment_id);
CREATE INDEX idx_appointment_audits_created_at ON appointment_audits(created_at);
```

### Etapa 2: Backend - Serviço de Validação

```python
# app/services/status_validation_service.py
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.models.appointment_model import AppointmentStatus

logger = logging.getLogger(__name__)

class StatusValidationService:
    """Serviço centralizado para validação de transições de status"""
    
    @staticmethod
    def can_transition(
        from_status: AppointmentStatus,
        to_status: AppointmentStatus,
        appointment_start_time: datetime,
        current_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Valida se uma transição é permitida
        
        Args:
            from_status: Status atual
            to_status: Status desejado
            appointment_start_time: Horário do agendamento
            current_time: Horário atual (para testes)
            
        Returns:
            Dict com resultado da validação
        """
        if current_time is None:
            current_time = datetime.utcnow()
            
        result = {
            'valid': False,
            'message': '',
            'requires_confirmation': False,
            'requires_reason': False,
            'code': 'INVALID_TRANSITION'
        }
        
        # Log da tentativa de transição
        logger.info(f"Validating transition: {from_status} -> {to_status}")
        
        # 1. Verificar matriz de transições
        if not StatusValidationService._is_transition_allowed(from_status, to_status):
            result['message'] = f'Transição de {from_status.value} para {to_status.value} não é permitida'
            result['code'] = 'FORBIDDEN_TRANSITION'
            return result
        
        # 2. Verificar regras temporais
        time_validation = StatusValidationService._validate_timing(
            from_status, to_status, appointment_start_time, current_time
        )
        
        if not time_validation['valid']:
            result.update(time_validation)
            return result
        
        # 3. Configurar requisitos de confirmação e motivo
        result['requires_confirmation'] = to_status in [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW
        ]
        
        result['requires_reason'] = to_status in [
            AppointmentStatus.CANCELLED
        ]
        
        result['valid'] = True
        result['message'] = 'Transição válida'
        result['code'] = 'VALID'
        
        return result
    
    @staticmethod
    def _is_transition_allowed(from_status: AppointmentStatus, to_status: AppointmentStatus) -> bool:
        """Verifica se a transição está na matriz de transições permitidas"""
        allowed_transitions = {
            AppointmentStatus.PENDING: [
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CANCELLED
            ],
            AppointmentStatus.CONFIRMED: [
                AppointmentStatus.PENDING,
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED,
                AppointmentStatus.NO_SHOW
            ],
            AppointmentStatus.COMPLETED: [],
            AppointmentStatus.CANCELLED: [],
            AppointmentStatus.NO_SHOW: []
        }
        
        return to_status in allowed_transitions.get(from_status, [])
    
    @staticmethod
    def _validate_timing(
        from_status: AppointmentStatus,
        to_status: AppointmentStatus,
        appointment_time: datetime,
        current_time: datetime
    ) -> Dict[str, Any]:
        """Valida regras temporais para a transição"""
        
        # Calcula diferença em minutos (positivo = após agendamento, negativo = antes)
        time_diff_minutes = (current_time - appointment_time).total_seconds() / 60
        
        # Regra: Reverter confirmação (CONFIRMED -> PENDING)
        if from_status == AppointmentStatus.CONFIRMED and to_status == AppointmentStatus.PENDING:
            if time_diff_minutes > -120:  # Menos de 2h antes
                return {
                    'valid': False,
                    'message': 'Só é possível reverter confirmação até 2 horas antes do agendamento',
                    'code': 'TIME_LIMIT_EXCEEDED'
                }
        
        # Regra: Marcar como concluído
        if to_status == AppointmentStatus.COMPLETED:
            if time_diff_minutes < 0:  # Antes do agendamento
                return {
                    'valid': False,
                    'message': 'Só é possível marcar como concluído a partir do horário agendado',
                    'code': 'TOO_EARLY'
                }
        
        # Regra: Marcar como falta
        if to_status == AppointmentStatus.NO_SHOW:
            if time_diff_minutes < 0:  # Antes do agendamento
                return {
                    'valid': False,
                    'message': 'Só é possível marcar como falta após o horário agendado',
                    'code': 'TOO_EARLY'
                }
            if time_diff_minutes > 30:  # Mais de 30min após
                return {
                    'valid': False,
                    'message': 'Só é possível marcar como falta até 30 minutos após o horário',
                    'code': 'TIME_LIMIT_EXCEEDED'
                }
        
        return {'valid': True}
```

### Etapa 3: Frontend - Hook de Gerenciamento de Status

```javascript
// hooks/useStatusManager.js
import { useState, useCallback } from 'react';
import { updateAppointmentStatus } from '../services/appointmentService';
import { validateStatusTransition } from '../utils/statusValidation';
import { useNotification } from './useNotification';

export const useStatusManager = (appointment, onUpdate) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [validationError, setValidationError] = useState(null);
  
  const { showSuccess, showError, showWarning } = useNotification();
  
  const validateAndInitiateChange = useCallback((newStatus) => {
    setValidationError(null);
    
    // Validação client-side
    const validation = validateStatusTransition(appointment, newStatus);
    
    if (!validation.valid) {
      setValidationError(validation.message);
      showWarning(validation.message);
      return;
    }
    
    // Se requer confirmação, mostrar modal
    if (validation.requiresConfirmation) {
      setPendingAction({
        status: newStatus,
        requiresReason: validation.requiresReason
      });
      setShowConfirmationModal(true);
      return;
    }
    
    // Executar mudança diretamente
    executeStatusChange(newStatus);
  }, [appointment]);
  
  const executeStatusChange = useCallback(async (status, reason = null, confirmed = false) => {
    setIsLoading(true);
    
    try {
      const updatedAppointment = await updateAppointmentStatus(appointment.id, {
        status,
        reason,
        confirmed
      });
      
      // Sucesso
      onUpdate(updatedAppointment);
      showSuccess(getSuccessMessage(status));
      
      // Fechar modal se estava aberto
      setShowConfirmationModal(false);
      setPendingAction(null);
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar status';
      setValidationError(errorMessage);
      showError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  }, [appointment.id, onUpdate, showSuccess, showError]);
  
  const cancelPendingAction = useCallback(() => {
    setShowConfirmationModal(false);
    setPendingAction(null);
  }, []);
  
  const getAvailableStatuses = useCallback(() => {
    const allStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    
    return allStatuses.filter(status => {
      if (status === appointment.status) return false;
      
      const validation = validateStatusTransition(appointment, status);
      return validation.valid;
    });
  }, [appointment]);
  
  return {
    isLoading,
    validationError,
    clearValidationError: () => setValidationError(null),
    showConfirmationModal,
    pendingAction,
    getAvailableStatuses,
    initiateStatusChange: validateAndInitiateChange,
    executeStatusChange,
    cancelPendingAction
  };
};

// Mensagens de sucesso personalizadas
const getSuccessMessage = (status) => {
  const messages = {
    PENDING: 'Status alterado para pendente',
    CONFIRMED: 'Agendamento confirmado com sucesso!',
    COMPLETED: 'Serviço marcado como concluído',
    CANCELLED: 'Agendamento cancelado',
    NO_SHOW: 'Marcado como falta do cliente'
  };
  
  return messages[status] || 'Status atualizado';
};
```

### Etapa 4: Frontend - Componente de Status Aprimorado

```javascript
// components/dashboard/AppointmentStatusDisplay.js
import React from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStatusManager } from '../../hooks/useStatusManager';
import StatusConfirmationModal from './StatusConfirmationModal';
import LoadingSpinner from '../common/LoadingSpinner';

const AppointmentStatusDisplay = ({ appointment, onUpdate, variant = 'default' }) => {
  const {
    isLoading,
    validationError,
    clearValidationError,
    showConfirmationModal,
    pendingAction,
    getAvailableStatuses,
    initiateStatusChange,
    executeStatusChange,
    cancelPendingAction
  } = useStatusManager(appointment, onUpdate);
  
  const formatRelativeDate = (date) => {
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const getStatusBadgeClass = (status) => {
    const classes = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
      NO_SHOW: 'status-no_show'
    };
    return `status-badge ${classes[status] || ''}`;
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      NO_SHOW: 'Falta'
    };
    return labels[status] || status;
  };
  
  const getStatusIcon = (status) => {
    const icons = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      COMPLETED: '✅',
      CANCELLED: '❌',
      NO_SHOW: '👻'
    };
    return icons[status] || '❓';
  };
  
  // Renderização compacta para timeline
  if (variant === 'compact') {
    return (
      <div className="status-display-compact">
        <span className={getStatusBadgeClass(appointment.status)}>
          {getStatusIcon(appointment.status)} {getStatusLabel(appointment.status)}
        </span>
      </div>
    );
  }
  
  // Renderização completa para detalhes
  return (
    <div className="status-display">
      {/* Status atual */}
      <div className="current-status">
        <h4>Status do Agendamento</h4>
        <div className={getStatusBadgeClass(appointment.status)}>
          {getStatusIcon(appointment.status)} {getStatusLabel(appointment.status)}
        </div>
        
        <div className="appointment-details">
          <p>
            📅 {formatRelativeDate(new Date(appointment.start_time))} às{' '}
            {format(new Date(appointment.start_time), 'HH:mm')}
          </p>
          <p>👤 {appointment.customer_name}</p>
          <p>💼 {appointment.service?.name}</p>
        </div>
      </div>
      
      {/* Erro de validação */}
      {validationError && (
        <div className="validation-error">
          <span>⚠️ {validationError}</span>
          <button onClick={clearValidationError} className="btn-close">×</button>
        </div>
      )}
      
      {/* Ações disponíveis */}
      <div className="status-actions">
        <h5>Ações Disponíveis</h5>
        
        {getAvailableStatuses().length === 0 ? (
          <p className="no-actions">Nenhuma ação disponível para este agendamento.</p>
        ) : (
          <div className="action-buttons">
            {getAvailableStatuses().map(status => (
              <button
                key={status}
                className={`btn-action btn-${status.toLowerCase()} ${isLoading ? 'loading' : ''}`}
                onClick={() => initiateStatusChange(status)}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="small" /> : (
                  <>
                    {getStatusIcon(status)} {getStatusLabel(status)}
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de confirmação */}
      {showConfirmationModal && pendingAction && (
        <StatusConfirmationModal
          appointment={appointment}
          targetStatus={pendingAction.status}
          requiresReason={pendingAction.requiresReason}
          onConfirm={executeStatusChange}
          onCancel={cancelPendingAction}
        />
      )}
    </div>
  );
};

export default AppointmentStatusDisplay;
```

### Etapa 5: CSS para Estados Visuais

```css
/* styles/status-display.css */

.status-display {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-confirmed {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-completed {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-no_show {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-action.loading {
  cursor: wait;
}

.btn-pending {
  background: #ffc107;
  color: #212529;
}

.btn-confirmed {
  background: #28a745;
  color: white;
}

.btn-completed {
  background: #17a2b8;
  color: white;
}

.btn-cancelled {
  background: #dc3545;
  color: white;
}

.btn-no_show {
  background: #6c757d;
  color: white;
}

.validation-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  border: 1px solid #f5c6cb;
}

.btn-close {
  background: none;
  border: none;
  color: #721c24;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.appointment-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.appointment-details p {
  margin: 0.25rem 0;
  color: #495057;
}

.no-actions {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

/* Variante compacta para timeline */
.status-display-compact .status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* Animações */
@keyframes statusChange {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.status-badge.status-changing {
  animation: statusChange 0.3s ease;
}

/* Responsividade */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .btn-action {
    justify-content: center;
    min-height: 44px; /* Mínimo para touch */
  }
}
```

## 🧪 Testes Automatizados

### Testes de Validação Backend

```python
# tests/test_status_validation.py
import pytest
from datetime import datetime, timedelta
from app.services.status_validation_service import StatusValidationService
from app.models.appointment_model import AppointmentStatus

class TestStatusValidation:
    
    def test_valid_pending_to_confirmed(self):
        """Testa transição válida de PENDING para CONFIRMED"""
        result = StatusValidationService.can_transition(
            from_status=AppointmentStatus.PENDING,
            to_status=AppointmentStatus.CONFIRMED,
            appointment_start_time=datetime.utcnow() + timedelta(hours=2)
        )
        
        assert result['valid'] is True
        assert result['requires_confirmation'] is False
    
    def test_invalid_completed_to_pending(self):
        """Testa transição inválida de COMPLETED para PENDING"""
        result = StatusValidationService.can_transition(
            from_status=AppointmentStatus.COMPLETED,
            to_status=AppointmentStatus.PENDING,
            appointment_start_time=datetime.utcnow() - timedelta(hours=1)
        )
        
        assert result['valid'] is False
        assert 'não é permitida' in result['message']
    
    def test_time_limit_confirmed_to_pending(self):
        """Testa limite de tempo para reverter confirmação"""
        # Tentativa 1 hora antes (deve falhar)
        result = StatusValidationService.can_transition(
            from_status=AppointmentStatus.CONFIRMED,
            to_status=AppointmentStatus.PENDING,
            appointment_start_time=datetime.utcnow() + timedelta(hours=1),
            current_time=datetime.utcnow()
        )
        
        assert result['valid'] is False
        assert '2 horas antes' in result['message']
        
    def test_completed_requires_confirmation(self):
        """Testa que COMPLETED requer confirmação"""
        result = StatusValidationService.can_transition(
            from_status=AppointmentStatus.CONFIRMED,
            to_status=AppointmentStatus.COMPLETED,
            appointment_start_time=datetime.utcnow() - timedelta(minutes=30)
        )
        
        assert result['valid'] is True
        assert result['requires_confirmation'] is True
```

### Testes Frontend

```javascript
// tests/statusValidation.test.js
import { validateStatusTransition } from '../utils/statusValidation';
import { addHours, subHours } from 'date-fns';

describe('Status Validation', () => {
  const baseAppointment = {
    id: 1,
    status: 'PENDING',
    start_time: addHours(new Date(), 2).toISOString(),
    customer_name: 'João Silva'
  };
  
  test('should allow PENDING to CONFIRMED', () => {
    const result = validateStatusTransition(baseAppointment, 'CONFIRMED');
    
    expect(result.valid).toBe(true);
    expect(result.requiresConfirmation).toBe(false);
  });
  
  test('should block COMPLETED to PENDING', () => {
    const appointment = { ...baseAppointment, status: 'COMPLETED' };
    const result = validateStatusTransition(appointment, 'PENDING');
    
    expect(result.valid).toBe(false);
    expect(result.message).toContain('não é possível alterar');
  });
  
  test('should require confirmation for COMPLETED', () => {
    const appointment = {
      ...baseAppointment,
      status: 'CONFIRMED',
      start_time: subHours(new Date(), 1).toISOString() // 1 hora atrás
    };
    
    const result = validateStatusTransition(appointment, 'COMPLETED');
    
    expect(result.valid).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
  });
});
```

---

*Este documento de exemplos práticos complementa o guia principal e oferece implementações concretas para cada aspecto do sistema de status aprimorado.*
