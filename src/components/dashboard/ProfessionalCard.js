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
      return <Badge variant="success">Ativo</Badge>;
    }
    return <Badge variant="secondary">Inativo</Badge>;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-lg">
              {getInitials(professional.name)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-secondary-900 truncate">
                {professional.name}
              </h3>
              {getStatusBadge()}
            </div>
            
            <p className="text-sm text-primary-600 font-medium">
              {professional.specialty}
            </p>
            
            <div className="flex items-center space-x-2 mt-1 text-sm text-secondary-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{professional.email}</span>
            </div>
            
            {professional.phone && (
              <div className="flex items-center space-x-2 mt-1 text-sm text-secondary-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{professional.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Descrição */}
      {professional.description && (
        <p className="text-sm text-secondary-600 mt-3" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {professional.description}
        </p>
      )}

      {/* Serviços */}
      {professional.services && professional.services.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-secondary-700 mb-2">
            Serviços ({professional.services.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {professional.services.slice(0, 3).map((service) => (
              <Badge key={service.id} variant="outline" size="sm">
                {service.name}
              </Badge>
            ))}
            {professional.services.length > 3 && (
              <Badge variant="outline" size="sm">
                +{professional.services.length - 3} mais
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="mt-4 pt-4 border-t border-secondary-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-secondary-600">Agendamentos</p>
            <p className="text-lg font-semibold text-secondary-900">
              {professional.total_appointments || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-secondary-600">Este Mês</p>
            <p className="text-lg font-semibold text-secondary-900">
              {professional.monthly_appointments || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-secondary-600">Avaliação</p>
            <div className="flex items-center justify-center space-x-1">
              <svg className="w-4 h-4 text-warning-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-semibold text-secondary-900">
                {professional.rating ? professional.rating.toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="mt-4 pt-4 border-t border-secondary-100">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="text-primary-600 hover:text-primary-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver Detalhes
          </Button>

          <div className="flex items-center space-x-2">
            {/* Toggle Status */}
            <button
              onClick={onToggleStatus}
              className={`p-2 rounded-lg transition-colors ${
                professional.is_active
                  ? 'text-warning-600 hover:bg-warning-100'
                  : 'text-success-600 hover:bg-success-100'
              }`}
              title={professional.is_active ? 'Desativar' : 'Ativar'}
            >
              {professional.is_active ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L12 12m6.364 6.364L12 12m0 0L5.636 5.636M12 12l6.364-6.364M12 12l-6.364 6.364" />
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
              className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              className="p-2 text-danger-600 hover:text-danger-900 hover:bg-danger-100 rounded-lg transition-colors"
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
