
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, name, className, ...props }) => {
  return (
    <div className={className}>
      <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-300">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        {...props}
        className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      />
    </div>
  );
};

export default Textarea;
