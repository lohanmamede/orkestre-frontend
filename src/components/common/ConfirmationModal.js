// src/components/common/ConfirmationModal.js
import React from 'react';

/**
 * Modal de confirmação para ações que requerem aprovação do usuário
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.isOpen - Se o modal está visível
 * @param {Function} props.onClose - Função chamada ao fechar o modal
 * @param {Function} props.onConfirm - Função chamada quando o usuário confirma a ação
 * @param {String} props.title - Título do modal
 * @param {String|React.ReactNode} props.message - Mensagem a ser exibida
 * @param {String} props.confirmButtonText - Texto do botão de confirmação
 * @param {String} props.confirmButtonColor - Cor do botão ("red", "blue", "green", "yellow")
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmação',
  message = 'Tem certeza que deseja realizar esta ação?',
  confirmButtonText = 'Confirmar',
  confirmButtonColor = 'blue'
}) => {
  if (!isOpen) return null;
  
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700'
  };
  
  const buttonClass = colorClasses[confirmButtonColor] || colorClasses.blue;
  
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
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-headline">
                  {title}
                </h3>
                <div className="mt-2">
                  {typeof message === 'string' ? (
                    <p className="text-sm text-gray-500">{message}</p>
                  ) : (
                    message
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${buttonClass} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmButtonText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
