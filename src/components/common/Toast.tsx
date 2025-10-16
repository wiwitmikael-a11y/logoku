// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';

const Toast: React.FC = () => {
    const { toast, closeToast } = useUI();

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                closeToast();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, closeToast]);

    if (!toast.show) return null;

    return (
        <div className="fixed top-5 right-5 bg-surface shadow-lg rounded-lg p-4 text-text-body z-50 animate-content-fade-in">
            {toast.message}
        </div>
    );
};

export default Toast;
