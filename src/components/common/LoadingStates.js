import React from 'react';

// Componente de Skeleton para melhor UX durante carregamento
export const SkeletonLoader = ({ className = "", children }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
};

// Skeleton específico para lista de serviços
export const ServiceSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <SkeletonLoader key={i}>
          <div className="border border-secondary-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="h-6 bg-secondary-200 rounded w-1/3 mr-3"></div>
                  <div className="h-5 bg-secondary-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-secondary-200 rounded w-2/3 mb-3"></div>
                <div className="flex space-x-6">
                  <div className="h-4 bg-secondary-200 rounded w-16"></div>
                  <div className="h-4 bg-secondary-200 rounded w-20"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 bg-secondary-200 rounded w-16"></div>
                <div className="h-8 bg-secondary-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </SkeletonLoader>
      ))}
    </div>
  );
};

// Componente de Loading com spinner mais elaborado
export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Componente de Loading State melhorado
export const LoadingState = ({ 
  message = "Carregando...", 
  showSpinner = true, 
  className = "",
  size = "md"
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      {showSpinner && (
        <LoadingSpinner size={size} className="text-primary-600 mb-4" />
      )}
      <p className="text-secondary-600 font-medium">{message}</p>
    </div>
  );
};

// Componente para botões com loading
export const ButtonWithLoading = ({ 
  loading = false, 
  disabled = false, 
  children, 
  loadingText,
  className = "",
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`
        relative inline-flex items-center justify-center
        ${loading ? 'cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2 text-current" />
      )}
      <span className={loading ? 'opacity-75' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
};

export default LoadingState;
