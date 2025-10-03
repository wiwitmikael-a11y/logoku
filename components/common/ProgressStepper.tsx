import React from 'react';

interface ProgressStepperProps {
  currentStep: number;
}

const steps = ["Persona", "Logo", "Detail", "Sosmed Kit", "Profil", "Kemasan", "Media Cetak", "Kalender", "Iklan", "Merch"];

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep }) => {
  return (
    <div className="mb-12 overflow-x-auto pb-4 -mx-4 px-4">
        <ol className="relative flex items-center w-full min-w-[700px]">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;

                return (
                    <li key={step} className="relative flex w-full items-center">
                        <div className="flex items-center w-full">
                            <div className={`flex z-10 items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 flex-shrink-0 ${
                                isCompleted ? 'bg-sky-500' :
                                isActive ? 'bg-sky-500 ring-4 ring-sky-200' :
                                'bg-slate-200'
                            }`}>
                               {isCompleted ? <CheckIcon /> : <span className={isActive ? 'text-white' : 'text-slate-500'}>{index + 1}</span>}
                            </div>
                            <p className={`absolute top-10 left-1/2 -translate-x-1/2 font-medium text-center text-xs md:text-sm whitespace-nowrap ${
                                isActive ? 'text-sky-600' : 'text-slate-500'
                            }`}>{step}</p>
                        </div>

                         {index < steps.length - 1 && (
                             <div className={`flex-auto border-t-2 transition-colors duration-500 ${isCompleted ? 'border-sky-500' : 'border-slate-300'}`}></div>
                         )}
                    </li>
                );
            })}
        </ol>
    </div>
  );
};

export default ProgressStepper;