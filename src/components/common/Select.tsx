// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, name, options, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-text-muted mb-1">
      {label}
    </label>
    <select
      id={name}
      name={name}
      className="w-full bg-surface border border-border-main rounded-lg px-3 py-2 text-text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors appearance-none"
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value} className="bg-background text-text-body">
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default Select;
