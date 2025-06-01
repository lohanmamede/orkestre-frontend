// Exemplo simples para src/components/common/Button.js
import React from 'react';

const Button = ({ children, onClick, type = 'button', className = '' }) => {
  const baseStyle = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline";
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${className}`} // Permite adicionar mais classes
    >
      {children}
    </button>
  );
};
export default Button;