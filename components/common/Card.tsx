import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, onClick, isSelected, className }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 border rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${className} ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/50'
          : 'border-gray-700 hover:border-indigo-500/50'
      }`}
    >
      <div className="p-5">
        <h3 className="text-lg font-bold text-indigo-400 mb-3">{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Card;
