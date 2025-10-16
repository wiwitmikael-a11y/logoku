// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const LoadingMessage: React.FC = () => {
    const messages = ["Meracik ide...", "Menghubungi Mang AI...", "Memanaskan kreativitas...", "Sedang di jalan..."];
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 2000);
        return () => clearInterval(intervalId);
    }, []);

    return <span className="text-sm font-semibold">{message}</span>;
};

export default LoadingMessage;
