// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

const Input: React.FC<InputProps> = ({ label, name, className = '', ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-text-muted mb-1">{label}</label>
      <input
        id={name}
        name={name}
        className={`w-full px-3 py-2 bg-background border border-border-main rounded-md text-text-body focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
