// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const ProgressStepper: React.FC<{ steps: string[], currentStep: number }> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-between">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-primary text-white' : 'bg-surface text-text-muted'}`}>
                        {index + 1}
                    </div>
                    <p className={`ml-2 ${index <= currentStep ? 'text-text-header font-semibold' : 'text-text-muted'}`}>{step}</p>
                </div>
            ))}
        </div>
    );
};

export default ProgressStepper;
