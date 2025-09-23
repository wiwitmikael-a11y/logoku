
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, name, className, ...props }) => {
  return (
    <div className={className}>
      <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...props}
        className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      />
    </div>
  );
};

export default Input;