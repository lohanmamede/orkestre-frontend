import React from 'react';

const Card = ({ 
  children, 
  className = '',
  padding = 'lg',
  shadow = 'soft',
  hover = false,
  onClick,
  ...props 
}) => {
  const baseClasses = "bg-white rounded-xl border border-secondary-200 transition-all duration-200";
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const shadows = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
  };

  const hoverClasses = hover ? 'hover:shadow-medium hover:-translate-y-1 cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${paddings[padding]} ${shadows[shadow]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
