// Teste rápido para verificar a lógica de IN_PROGRESS
const { getAllowedButtons, AppointmentStatus } = require('./src/services/statusValidationService.js');

// Simular agendamento IN_PROGRESS que já passou do horário (como na imagem)
const appointmentInProgress = {
  status: AppointmentStatus.IN_PROGRESS,
  start_time: '2025-06-26T12:09:00Z' // 12:09 hoje (já passou)
};

console.log('=== TESTE: Agendamento IN_PROGRESS que passou do horário ===');
console.log('Status atual:', appointmentInProgress.status);
console.log('Horário:', appointmentInProgress.start_time);
console.log('Horário atual:', new Date().toISOString());

const allowedButtons = getAllowedButtons(appointmentInProgress);
console.log('Botões permitidos:', allowedButtons);
console.log('Deve mostrar: [completed, cancelled_by_client, cancelled_by_establishment]');

// Verificar se está correto
const expected = ['completed', 'cancelled_by_client', 'cancelled_by_establishment'];
const isCorrect = expected.every(btn => allowedButtons.includes(btn)) && 
                 allowedButtons.every(btn => expected.includes(btn));

console.log('✅ Teste passou:', isCorrect);
