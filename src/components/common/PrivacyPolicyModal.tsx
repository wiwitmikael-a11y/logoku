// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const PrivacyPolicyModal: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-text-header mb-4">Kebijakan Privasi</h2>
                <div className="overflow-y-auto space-y-2 text-sm text-text-body">
                   <p>Kami menghargai privasi Anda.</p>
                   <p><strong>Data yang Kami Kumpulkan:</strong> Kami mengumpulkan informasi dasar akun dari Google (email, nama, avatar) untuk otentikasi. Kami tidak menjual data Anda.</p>
                   <p><strong>Penggunaan Data:</strong> Data Anda digunakan untuk personalisasi pengalaman aplikasi dan menyimpan progres proyek Anda.</p>
                   <p><strong>Pihak Ketiga:</strong> Kami menggunakan Supabase untuk backend dan otentikasi, serta Google Gemini untuk fitur AI. Silakan merujuk pada kebijakan privasi mereka untuk informasi lebih lanjut.</p>
                </div>
                <button onClick={onClose} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg self-start">Saya Mengerti</button>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
