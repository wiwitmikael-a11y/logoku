// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

const Input: React.FC<InputProps> = ({ label, name, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-text-muted mb-1">
      {label}
    </label>
    <input
      id={name}
      name={name}
      className="w-full bg-surface border border-border-main rounded-lg px-3 py-2 text-text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
      {...props}
    />
  </div>
);

export default Input;
