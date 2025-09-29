import React from 'react';

interface ProgressStepperProps {
  currentStep: number;
}

const steps = ["Persona", "Logo", "Detail", "Konten", "Sosmed Kit", "Profil", "Iklan", "Kemasan", "Media Cetak"];

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep }) => {
  return (
    <div className="mb-12 overflow-x-auto pb-4">
        <ol className="flex items-start w-full min-w-[700px]">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                
                const circleClasses = `flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 flex-shrink-0 ${
                    isCompleted ? 'bg-indigo-600' :
                    isActive ? 'bg-indigo-600 ring-4 ring-indigo-500/30' :
                    'bg-gray-700 border-2 border-gray-600'
                }`;
                const textClasses = `font-medium mt-3 text-center text-xs md:text-sm ${
                    isCompleted ? 'text-gray-400' :
                    isActive ? 'text-indigo-300' :
                    'text-gray-500'
                }`;
                 const lineClasses = `flex-auto border-t-2 transition-all duration-500 mx-2 ${
                    isCompleted ? 'border-indigo-600' : 'border-gray-700'
                }`;


                return (
                    <React.Fragment key={step}>
                        <li className="flex flex-col items-center relative flex-1">
                           <div className={circleClasses}>
                               {isCompleted ? <CheckIcon /> : <span className={isActive ? 'text-white' : 'text-gray-400'}>{index + 1}</span>}
                           </div>
                           <p className={textClasses}>{step}</p>
                        </li>
                         {index < steps.length - 1 && (
                            <li className={lineClasses}></li>
                        )}
                    </React.Fragment>
                );
            })}
        </ol>
    </div>
  );
};

export default ProgressStepper;