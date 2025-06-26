// src/components/common/CancellationModal.js
import React from 'react';
import { AppointmentStatus } from '../../services/statusValidationService';

/**
 * Modal específico para selecionar o tipo de cancelamento
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.isOpen - Se o modal está visível
 * @param {Function} props.onClose - Função chamada ao fechar o modal
 * @param {Function} props.onConfirm - Função chamada quando o usuário confirma um tipo de cancelamento
 */
const CancellationModal = ({
  isOpen,
  onClose,
  onConfirm,
  appointment
}) => {
  if (!isOpen) return null;
  
  const handleCancelByEstablishment = () => {
    onConfirm(AppointmentStatus.CANCELLED_BY_ESTABLISHMENT);
    onClose();
  };
  
  const handleCancelByClient = () => {
    onConfirm(AppointmentStatus.CANCELLED_BY_CLIENT);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay de fundo */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          aria-hidden="true" 
          onClick={onClose}
        ></div>

        {/* Alinhamento central */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal */}
        <div 
          className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-headline">
                  Selecione o tipo de cancelamento
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Por favor, selecione quem solicitou o cancelamento deste agendamento.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-col sm:gap-2">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-full sm:text-sm"
              onClick={handleCancelByEstablishment}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Cancelar pelo Estabelecimento
            </button>
            <button
              type="button"
              className="mt-2 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-500 text-base font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:w-full sm:text-sm"
              onClick={handleCancelByClient}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Cancelar pelo Cliente
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-full sm:text-sm"
              onClick={onClose}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;
