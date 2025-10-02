import React, { useEffect, useRef } from 'react';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/desainfun-assets@main/';

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
            <p className="text-sm text-gray-400">Terakhir diperbarui: 12 September 2025</p>
        </header>

        <main className="p-6 overflow-y-auto text-gray-300 text-sm space-y-4">
            <p>Selamat datang di desain.fun ("Aplikasi", "Layanan")! Dengan mengakses atau menggunakan Aplikasi kami, Anda ("Pengguna") setuju untuk terikat oleh Ketentuan Layanan ini.</p>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">1. Akun dan Privasi Data</h3>
                <p>Untuk menggunakan Layanan, Anda harus login menggunakan akun Google Anda (Google Authentication). Dengan melakukannya, Anda mengizinkan kami untuk mengakses informasi dasar profil Anda (nama, alamat email, foto profil) sesuai dengan <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">kebijakan privasi Google</a>. Data ini kami gunakan semata-mata untuk keperluan identifikasi akun, personalisasi pengalaman, dan penyimpanan proyek Anda di database kami yang dikelola oleh <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Supabase</a>. Kami berkomitmen untuk menjaga privasi Anda; kami tidak akan menjual atau membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum.</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">2. Layanan "AS IS" (Apa Adanya)</h3>
                <p>Semua konten yang dihasilkan oleh AI kami, termasuk namun tidak terbatas pada logo, slogan, persona brand, dan kalender konten ("Konten yang Dihasilkan"), disediakan atas dasar "SEBAGAIMANA ADANYA" dan "SEBAGAIMANA TERSEDIA". Kami tidak memberikan jaminan dalam bentuk apa pun, baik tersurat maupun tersirat, bahwa Konten yang Dihasilkan akan unik, bebas dari pelanggaran hak cipta atau merek dagang pihak ketiga, atau cocok untuk tujuan tertentu.</p>
            </div>

             <div className="space-y-2">
                <h3 className="font-bold text-white text-base">3. Kepemilikan Konten dan Tanggung Jawab Pengguna</h3>
                <p>Anda memegang hak untuk menggunakan Konten yang Dihasilkan untuk keperluan pribadi maupun komersial. Namun, Anda, sebagai pengguna, memikul tanggung jawab penuh atas penggunaan tersebut. Sebelum menggunakan logo atau aset brand lainnya untuk tujuan komersial, Anda <strong className="text-yellow-400">WAJIB</strong> melakukan uji tuntas (due diligence) Anda sendiri. Ini termasuk, namun tidak terbatas pada:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                        Melakukan pencarian merek dagang (trademark) pada database pemerintah yang relevan (misalnya,{' '}
                        <a href="https://pdki-indonesia.dgip.go.id/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                            Pangkalan Data Kekayaan Intelektual - PDKI di Indonesia
                        </a>).
                    </li>
                    <li>Memastikan desain tidak melanggar hak cipta yang ada.</li>
                    <li>Memverifikasi bahwa penggunaan aset tidak akan menyebabkan kebingungan konsumen dengan merek lain.</li>
                </ul>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">4. Batasan Tanggung Jawab</h3>
                <p>Sejauh diizinkan oleh hukum yang berlaku, <strong className="text-yellow-400">desain.fun dan para pengembangnya tidak akan bertanggung jawab</strong> atas segala kerugian, kerusakan, atau klaim (termasuk biaya pengacara) yang timbul dari atau sehubungan dengan penggunaan Anda atas Konten yang Dihasilkan. Ini termasuk klaim pelanggaran merek dagang, pelanggaran hak cipta, atau persaingan tidak sehat yang diajukan oleh pihak ketiga.</p>
            </div>
            
            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">5. Sistem Kredit</h3>
                <p>Layanan ini menggunakan sistem kredit untuk fitur generasi gambar. Setiap pengguna diberikan sejumlah kredit gratis setiap hari. Kredit ini tidak dapat diakumulasikan dan akan di-reset setiap hari. Kami berhak mengubah jumlah kredit yang diberikan atau biaya kredit per generasi di masa mendatang.</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">6. Penggunaan yang Dilarang</h3>
                 <p>Anda setuju untuk tidak menggunakan Layanan untuk tujuan apa pun yang melanggar hukum atau dilarang oleh Ketentuan ini. Anda tidak boleh menggunakan Layanan untuk:</p>
                 <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Membuat konten yang bersifat melecehkan, memfitnah, cabul, diskriminatif, atau melanggar hukum.</li>
                    <li>Melanggar hak kekayaan intelektual atau hak privasi pihak lain.</li>
                    <li>Mencoba merekayasa balik (reverse engineer), mendekompilasi, atau membongkar bagian mana pun dari Aplikasi.</li>
                    <li>Menyebarkan virus, malware, atau kode berbahaya lainnya.</li>
                </ul>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">7. Ganti Rugi (Indemnifikasi)</h3>
                <p>Anda setuju untuk membela, mengganti rugi, dan membebaskan desain.fun dan para pengembangnya dari segala klaim, kerusakan, kewajiban, kerugian, dan pengeluaran yang timbul dari penggunaan Konten yang Dihasilkan oleh Anda yang melanggar hak pihak ketiga atau melanggar Ketentuan Layanan ini.</p>
            </div>

             <div className="space-y-2">
                <h3 className="font-bold text-white text-base">8. Hukum yang Mengatur</h3>
                <p>Ketentuan Layanan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia, tanpa memperhatikan pertentangan ketentuan hukum.</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-white text-base">9. Perubahan dan Penghentian Layanan</h3>
                <p>Kami berhak untuk mengubah atau menghentikan Layanan (atau bagian apa pun darinya) kapan saja dengan atau tanpa pemberitahuan. Kami juga berhak untuk menangguhkan atau menghentikan akun pengguna yang melanggar Ketentuan ini.</p>
            </div>

            <p className="pt-4 border-t border-gray-700">Dengan melanjutkan penggunaan Aplikasi, Anda mengakui bahwa Anda telah membaca, memahami, dan menyetujui Ketentuan Layanan ini secara penuh.</p>
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