// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const TermsOfServiceModal: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-surface rounded-2xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-text-header mb-4">Ketentuan Layanan</h2>
                <div className="overflow-y-auto space-y-2 text-sm text-text-body">
                   <p>Selamat datang di desain.fun! Dengan menggunakan layanan kami, Anda setuju dengan ketentuan ini.</p>
                   <p><strong>Penggunaan Layanan:</strong> Layanan ini disediakan "sebagaimana adanya". Anda bertanggung jawab penuh atas penggunaan konten yang dihasilkan untuk tujuan komersial, termasuk melakukan pengecekan merek dagang (trademark) secara mandiri.</p>
                   <p><strong>Akun:</strong> Anda bertanggung jawab untuk menjaga keamanan akun Anda.</p>
                   <p><strong>Konten:</strong> Kami tidak bertanggung jawab atas kesesuaian atau keunikan konten yang dihasilkan AI. Verifikasi adalah tanggung jawab Anda.</p>
                </div>
                <button onClick={onClose} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg self-start">Saya Mengerti</button>
            </div>
        </div>
    );
};

export default TermsOfServiceModal;
