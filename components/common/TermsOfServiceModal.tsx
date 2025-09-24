import React, { useEffect, useRef } from 'react';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const TermsOfServiceModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus(); // Focus the modal for screen readers
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) {
    return null;
  }
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tos-title"
      tabIndex={-1}
    >
      <div className="relative max-w-2xl w-full bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <header className="p-6 border-b border-gray-700 flex-shrink-0">
             <h2 id="tos-title" className="text-2xl font-bold text-indigo-400">
                Ketentuan Layanan (Terms of Service)
            </h2>
            <p className="text-sm text-gray-400">Terakhir diperbarui: 25 Mei 2024</p>
        </header>

        <main className="p-6 overflow-y-auto text-gray-300 text-sm space-y-4">
            <p>Selamat datang di logo.ku ("Aplikasi")! Dengan mengakses atau menggunakan Aplikasi kami, Anda setuju untuk terikat oleh Ketentuan Layanan ini.</p>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">1. Layanan "AS IS" (Apa Adanya)</h3>
                <p>Semua konten yang dihasilkan oleh AI kami, termasuk namun tidak terbatas pada logo, slogan, persona brand, dan kalender konten ("Konten yang Dihasilkan"), disediakan atas dasar "SEBAGAIMANA ADANYA" dan "SEBAGAIMANA TERSEDIA". Kami tidak memberikan jaminan dalam bentuk apa pun, baik tersurat maupun tersirat, bahwa Konten yang Dihasilkan akan unik, bebas dari pelanggaran hak cipta atau merek dagang pihak ketiga, atau cocok untuk tujuan tertentu.</p>
            </div>

             <div className="space-y-2">
                <h3 className="font-bold text-white text-base">2. Tanggung Jawab Pengguna</h3>
                <p>Anda, sebagai pengguna, memikul tanggung jawab penuh atas penggunaan Konten yang Dihasilkan. Sebelum menggunakan logo atau aset brand lainnya untuk tujuan komersial, Anda <strong className="text-yellow-400">WAJIB</strong> melakukan uji tuntas (due diligence) Anda sendiri. Ini termasuk, namun tidak terbatas pada:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Melakukan pencarian merek dagang (trademark) pada database pemerintah yang relevan (misalnya, Pangkalan Data Kekayaan Intelektual - PDKI di Indonesia).</li>
                    <li>Memastikan desain tidak melanggar hak cipta yang ada.</li>
                    <li>Memverifikasi bahwa penggunaan aset tidak akan menyebabkan kebingungan konsumen dengan merek lain.</li>
                </ul>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">3. Batasan Tanggung Jawab</h3>
                <p>Sejauh diizinkan oleh hukum yang berlaku, <strong className="text-yellow-400">logo.ku dan para pengembangnya tidak akan bertanggung jawab</strong> atas segala kerugian, kerusakan, atau klaim (termasuk biaya pengacara) yang timbul dari atau sehubungan dengan penggunaan Anda atas Konten yang Dihasilkan. Ini termasuk klaim pelanggaran merek dagang, pelanggaran hak cipta, atau persaingan tidak sehat yang diajukan oleh pihak ketiga.</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">4. Ganti Rugi (Indemnifikasi)</h3>
                <p>Anda setuju untuk membela, mengganti rugi, dan membebaskan logo.ku dan para pengembangnya dari segala klaim, kerusakan, kewajiban, kerugian, dan pengeluaran yang timbul dari penggunaan Konten yang Dihasilkan oleh Anda yang melanggar hak pihak ketiga.</p>
            </div>
            
             <div className="space-y-2">
                <h3 className="font-bold text-white text-base">5. Status Hak Intelektual</h3>
                <p>Status hukum kepemilikan hak cipta atas karya yang dihasilkan oleh AI masih kompleks dan bervariasi antar yurisdiksi. Tidak ada jaminan bahwa Anda akan dapat mendaftarkan hak cipta atas logo yang dihasilkan oleh Aplikasi ini.</p>
            </div>

            <p className="pt-4 border-t border-gray-700">Dengan melanjutkan penggunaan Aplikasi, Anda mengakui bahwa Anda telah membaca, memahami, dan menyetujui Ketentuan Layanan ini.</p>
        </main>

        <footer className="p-6 border-t border-gray-700 flex-shrink-0 flex justify-end">
            <Button onClick={onClose}>
                Saya Mengerti
            </Button>
        </footer>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;