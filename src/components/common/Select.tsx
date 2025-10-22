// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, name, options, className = '', ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-text-muted mb-1">{label}</label>
      <select
        id={name}
        name={name}
        className={`w-full px-3 py-2 bg-background border border-border-main rounded-md text-text-body focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${className}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

export default Select;
