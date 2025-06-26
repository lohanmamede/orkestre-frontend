import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

const ProfessionalCard = ({ 
  professional, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onViewDetails 
}) => {
  const getStatusBadge = () => {
    if (professional.is_active) {
      return <Badge variant="success" size="sm">Ativo</Badge>;
    }
    return <Badge variant="secondary" size="sm">Inativo</Badge>;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Função para gerar cor de fundo baseada no nome
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white relative overflow-hidden">
      {/* Header compacto com foto e info básica */}
      <div className="p-4 pb-3">
        <div className="flex items-center space-x-3">
          {/* Avatar com foto ou iniciais */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${getAvatarColor(professional.name)}`}>
            {professional.photo ? (
              <img 
                src={professional.photo} 
                alt={professional.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{getInitials(professional.name)}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                {professional.name}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-blue-600 font-medium mt-0.5">
              {professional.specialty}
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas compactas */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg py-2 px-1">
            <p className="text-lg font-bold text-gray-900">{professional.total_appointments || 0}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-blue-50 rounded-lg py-2 px-1">
            <p className="text-lg font-bold text-blue-600">{professional.monthly_appointments || 0}</p>
            <p className="text-xs text-gray-600">Mês</p>
          </div>
          <div className="bg-yellow-50 rounded-lg py-2 px-1">
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-lg font-bold text-yellow-600">
                {professional.rating ? professional.rating.toFixed(1) : '5.0'}
              </span>
            </div>
            <p className="text-xs text-gray-600">Nota</p>
          </div>
        </div>
      </div>

      {/* Serviços - mais compacto */}
      {professional.services && professional.services.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {professional.services.slice(0, 2).map((service) => (
              <Badge key={service.id} variant="outline" size="xs" className="text-xs">
                {service.name}
              </Badge>
            ))}
            {professional.services.length > 2 && (
              <Badge variant="outline" size="xs" className="text-xs">
                +{professional.services.length - 2}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Footer com ações - mais clean */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver Detalhes
          </Button>

          <div className="flex items-center space-x-1">
            {/* Toggle Status */}
            <button
              onClick={onToggleStatus}
              className={`p-1.5 rounded-md transition-colors ${
                professional.is_active
                  ? 'text-orange-600 hover:bg-orange-100'
                  : 'text-green-600 hover:bg-green-100'
              }`}
              title={professional.is_active ? 'Desativar' : 'Ativar'}
            >
              {professional.is_active ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            {/* Edit */}
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors"
              title="Excluir"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfessionalCard;
