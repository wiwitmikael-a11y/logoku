import React from 'react';

interface CalloutPopupProps {
  children: React.ReactNode;
  className?: string;
}

const CalloutPopup: React.FC<CalloutPopupProps> = ({ children, className }) => {
  return (
    <div
      className={`
        bg-yellow-400 text-gray-900 text-sm font-bold px-4 py-2 rounded-lg shadow-lg z-10
        relative before:content-[''] before:absolute before:w-0 before:h-0
        before:border-x-8 before:border-x-transparent before:border-t-8 before:border-t-yellow-400
        before:left-1/2 before:-translate-x-1/2 before:bottom-[-8px]
        ${className}
      `}
      role="status"
    >
      {children}
    </div>
  );
};

export default CalloutPopup;