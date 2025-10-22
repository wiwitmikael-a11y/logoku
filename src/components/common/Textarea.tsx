// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, name, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-text-muted mb-1">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      className="w-full bg-surface border border-border-main rounded-lg px-3 py-2 text-text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
      {...props}
    />
  </div>
);

export default Textarea;
