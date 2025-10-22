// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface Props {
  title: string;
  icon: React.ReactNode;
  status: 'completed' | 'active' | 'locked';
  isOpen: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const WorkflowStep: React.FC<Props> = ({ title, icon, status, isOpen, onClick, children }) => {
  const isLocked = status === 'locked';

  const getStatusIndicator = () => {
    if (status === 'completed') {
      return (
        <div className="w-6 h-6 flex items-center justify-center bg-primary rounded-full text-white">
          ✓
        </div>
      );
    }
    return (
      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-lg ${isOpen ? 'bg-primary/20 text-primary' : 'bg-surface'}`}>
        {icon}
      </div>
    );
  };
  
  return (
    <div className={`workflow-step rounded-xl transition-all duration-300 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isOpen ? 'bg-background shadow-lg' : 'hover:bg-surface'}`}>
      <div
        className="flex items-center justify-between p-3"
        onClick={isLocked ? undefined : onClick}
        role="button"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {getStatusIndicator()}
          <h3 className={`font-semibold transition-colors ${isOpen ? 'text-primary' : 'text-text-header'}`}>
            {title}
          </h3>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-text-muted transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {children && (
         <div className={`step-content px-4 ${isOpen ? 'open' : ''}`}>
           {children}
         </div>
      )}
    </div>
  );
};

export default WorkflowStep;
