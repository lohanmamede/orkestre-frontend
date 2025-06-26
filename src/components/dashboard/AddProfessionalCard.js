import React from 'react';
import Card from '../common/Card';

const AddProfessionalCard = ({ onClick }) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 cursor-pointer h-full flex items-center justify-center"
          onClick={onClick}>
      <div className="text-center py-8">
        {/* Ícone de pessoa com + */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
          <div className="relative">
            {/* Bonequinho */}
            <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {/* Plus icon */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 group-hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors mb-2">
          Adicionar Profissional
        </h3>
        
        <p className="text-sm text-gray-500 group-hover:text-blue-500 transition-colors max-w-40 mx-auto">
          Clique para cadastrar um novo profissional
        </p>
        
        {/* Indicador visual adicional */}
        <div className="mt-4 w-12 h-1 bg-gray-300 group-hover:bg-blue-400 rounded-full mx-auto transition-colors"></div>
      </div>
    </Card>
  );
};

export default AddProfessionalCard;
