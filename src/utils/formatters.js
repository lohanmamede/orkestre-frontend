/**
 * Formata um nome completo para exibição, truncando se necessário
 * @param {string} fullName - Nome completo
 * @param {number} maxLength - Comprimento máximo antes de truncar
 * @returns {string} Nome formatado
 */
export const formatCustomerName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return '';
  
  const nameParts = fullName.trim().split(' ');
  
  // Se o nome for curto, retorna ele mesmo
  if (fullName.length <= 15) return fullName;
  
  // Se tiver muitas partes, pega só a primeira e a última
  if (nameParts.length > 2) {
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  }
  
  return fullName;
};

/**
 * Formata um número de telefone para o formato (XX) XXXXX-XXXX
 * @param {string} phone - Número de telefone
 * @returns {string} Telefone formatado
 */
export const formatPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove todos os caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Verifica se é um número de celular brasileiro padrão
  if (digitsOnly.length === 11) {
    return `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}-${digitsOnly.substring(7)}`;
  }
  
  // Se for um número fixo (10 dígitos)
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 6)}-${digitsOnly.substring(6)}`;
  }
  
  // Se não seguir os padrões comuns, retorna formatado como está
  return phone;
};

/**
 * Formata um horário no formato HH:MM
 * @param {string} time - Horário no formato HH:MM ou objeto Date
 * @returns {string} Horário formatado
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  // Se for uma string já no formato HH:MM
  if (typeof time === 'string' && /^\d{1,2}:\d{2}$/.test(time)) {
    // Garante que tenha dois dígitos na hora
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Se for um objeto Date
  if (time instanceof Date) {
    return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Tratamento para outros formatos
  try {
    const date = new Date(time);
    if (!isNaN(date)) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  } catch (e) {
    console.error('Erro ao formatar horário:', e);
  }
  
  return time; // Retorna como está se não for possível formatar
};

/**
 * Formata um valor monetário em Real brasileiro
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado em R$
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
