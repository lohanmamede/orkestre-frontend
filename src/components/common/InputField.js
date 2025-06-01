// Exemplo simples para src/components/common/InputField.js
import React from 'react';

const InputField = ({ label, type, name, value, onChange, placeholder, className = '' }) => {
  const baseStyle = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";
  return (
    <div className="mb-4">
      {label && <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>{label}</label>}
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseStyle} ${className}`}
      />
    </div>
  );
};
export default InputField;