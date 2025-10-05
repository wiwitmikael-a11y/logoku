// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef } from 'react';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (show) { document.addEventListener('keydown', handleKeyDown); modalRef.current?.focus(); }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      tabIndex={-1}
    >
      <div className="relative max-w-2xl w-full bg-surface rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        <header className="p-6 border-b border-border-main flex-shrink-0">
             <h2 id="privacy-title" className="text-4xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)'}}> Kebijakan Privasi </h2>
            <p className="text-sm text-text-muted">Terakhir diperbarui: 13 September 2025</p>
        </header>

        <main className="p-6 overflow-y-auto text-text-body text-sm space-y-4">
            <p>Privasi Anda penting bagi kami di desain.fun ("Layanan", "Kami"). Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.</p>
            
            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">1. Informasi yang Kami Kumpulkan</h3>
                <p>Saat Anda mendaftar dan masuk menggunakan Akun Google, kami mengumpulkan informasi dasar yang disediakan oleh Google, yaitu:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Nama Lengkap Anda</li>
                    <li>Alamat Email Anda</li>
                    <li>URL Foto Profil Anda</li>
                </ul>
                <p>Kami tidak mengumpulkan kata sandi atau informasi sensitif lainnya dari Akun Google Anda.</p>
            </div>
            
            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">2. Bagaimana Kami Menggunakan Informasi Anda</h3>
                <p>Informasi yang kami kumpulkan digunakan secara eksklusif untuk fungsi inti Layanan, termasuk:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Untuk membuat dan mengelola akun Anda di desain.fun.</li>
                    <li>Untuk menyimpan dan mengaitkan proyek-proyek yang Anda buat dengan akun Anda.</li>
                    <li>Untuk menampilkan nama dan foto profil Anda di dalam Aplikasi, seperti di menu pengguna dan di forum komunitas ("WarKop Juragan").</li>
                    <li>Untuk mempersonalisasi pengalaman Anda, seperti menyapa Anda dengan nama Anda.</li>
                </ul>
            </div>
            
            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">3. Penyimpanan dan Keamanan Data</h3>
                <p>Semua informasi profil dan data proyek Anda (kecuali aset visual, lihat Ketentuan Layanan) disimpan dengan aman di database kami yang disediakan oleh Supabase. Kami menerapkan langkah-langkah keamanan standar industri untuk melindungi data Anda dari akses yang tidak sah.</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">4. Berbagi Informasi dengan Pihak Ketiga</h3>
                <p>Kami <strong className="text-splash">tidak akan pernah menjual, menyewakan, atau membagikan informasi pribadi Anda</strong> kepada pihak ketiga untuk tujuan pemasaran. Informasi Anda hanya digunakan secara internal untuk operasional layanan desain.fun.</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">5. Cookie dan Penyimpanan Lokal</h3>
                <p>Kami menggunakan `localStorage` dan `sessionStorage` di browser Anda untuk menyimpan preferensi (seperti tema gelap/terang dan pilihan musik) serta untuk mengelola sesi workflow Anda. Data ini disimpan di perangkat Anda sendiri dan tidak digunakan untuk melacak Anda di situs lain.</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">6. Hak Anda</h3>
                <p>Anda memiliki hak untuk mengakses dan mengelola data Anda. Saat ini, fitur untuk menghapus akun secara mandiri sedang dalam pengembangan. Jika Anda ingin akun dan semua data terkait Anda dihapus, silakan hubungi kami melalui email yang tersedia di halaman Kontak Developer.</p>
            </div>
            
            <p className="pt-4 border-t border-border-main">Dengan menggunakan Layanan kami, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan ini. Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>
        </main>
        <footer className="p-4 bg-background border-t border-border-main flex-shrink-0 flex justify-end">
            <Button onClick={onClose} variant="secondary"> Saya Mengerti </Button>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
