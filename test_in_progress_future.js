// Teste para agendamento IN_PROGRESS futuro (situação anômala)
const { getAllowedButtons, AppointmentStatus } = require('./src/services/statusValidationService.js');

// Simular agendamento IN_PROGRESS para amanhã (situação anômala)
const appointmentInProgressFuture = {
  status: AppointmentStatus.IN_PROGRESS,
  start_time: '2025-06-27T12:09:00Z' // Amanhã às 12:09 (futuro)
};

console.log('=== TESTE: Agendamento IN_PROGRESS futuro (ANÔMALO) ===');
console.log('Status atual:', appointmentInProgressFuture.status);
console.log('Horário:', appointmentInProgressFuture.start_time);
console.log('Horário atual:', new Date().toISOString());

const allowedButtons = getAllowedButtons(appointmentInProgressFuture);
console.log('Botões permitidos:', allowedButtons);
console.log('Deve mostrar: [confirmed, cancelled_by_client, cancelled_by_establishment]');
console.log('(Para corrigir a inconsistência de IN_PROGRESS futuro)');

// Verificar se está correto
const expected = ['confirmed', 'cancelled_by_client', 'cancelled_by_establishment'];
const isCorrect = expected.every(btn => allowedButtons.includes(btn)) && 
                 allowedButtons.every(btn => expected.includes(btn));

console.log('✅ Teste passou:', isCorrect);

// Teste adicional: agendamento IN_PROGRESS que já passou (normal)
const appointmentInProgressPast = {
  status: AppointmentStatus.IN_PROGRESS,
  start_time: '2025-06-26T12:09:00Z' // Hoje às 12:09 (já passou)
};

console.log('\n=== TESTE: Agendamento IN_PROGRESS passado (NORMAL) ===');
const allowedButtonsPast = getAllowedButtons(appointmentInProgressPast);
console.log('Botões permitidos:', allowedButtonsPast);
console.log('Deve mostrar: [completed, cancelled_by_client, cancelled_by_establishment]');
