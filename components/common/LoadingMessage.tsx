import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';

const loadingMessages = [
    "Sabar, Mang AI lagi ngopi item dulu...",
    "Lagi corat-coret di buku sketsa...",
    "Tunggu bentar, lagi ngeracik ide cemerlang...",
    "Lagi manasin mesin kreativitas, nih...",
    "Mang AI lagi meditasi, nyari inspirasi ilahi...",
    "Lagi interview target pasar...",
    "Lagi nyeduh Indomie, biar gak panik...",
    "Tahan... Mang AI lagi milih font yang estetik...",
    "Lagi riset tren di TikTok...",
    "Don't panic, Mang AI-nya lagi gak nge-lag kok...",
    "Lagi proses, jangan diganggu, nanti ngambek...",
    "Mengumpulkan niat... eh, data maksudnya...",
    "Mang AI lagi dengerin sound horeg dulu…",
    "Nyeblak dulu yuk neng…",
    "Baksoooo…baksoooo…",
    "Mang, ayaaaaa mereuuunnn…",
    "Lagi nge-charge energi kreatif, lowbatt euy...",
    "Bentar, lagi scroll TikTok dulu nyari referensi...",
    "Tahan, lagi milih filter Instagram yang pas...",
    "Lagi nunggu ilham turun dari langit ke-7...",
];

const LoadingMessage: React.FC = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        setMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        
        const interval = setInterval(() => {
            setMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-center">
            <Spinner />
            <span className="text-splash">{message}</span>
        </div>
    );
};

export default LoadingMessage;