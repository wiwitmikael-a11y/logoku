import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';

const loadingMessages = [
    "Sabar, Mang AI lagi ngopi item dulu...",
    "Lagi corat-coret di buku sketsa...", // NEW
    "Tunggu bentar, lagi ngeracik ide cemerlang...",
    "Lagi manasin mesin kreativitas, nih...",
    "Mang AI lagi meditasi, nyari inspirasi ilahi...",
    "Lagi interview target pasar...", // NEW
    "Lagi nyeduh Indomie, biar gak panik...",
    "Tahan... Mang AI lagi milih font yang estetik...",
    "Lagi riset tren di TikTok...", // NEW
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
        // Pick a random starting message
        setMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        
        const interval = setInterval(() => {
            setMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        }, 3000); // Change message every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-center">
            <Spinner />
            <span className="text-indigo-300">{message}</span>
        </div>
    );
};

export default LoadingMessage;