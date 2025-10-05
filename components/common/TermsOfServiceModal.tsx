import React, { useEffect, useRef } from 'react';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<Props> = ({ show, onClose }) => {
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
      aria-labelledby="tos-title"
      tabIndex={-1}
    >
      <div className="relative max-w-2xl w-full bg-surface rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        <header className="p-6 border-b border-border-main flex-shrink-0">
             <h2 id="tos-title" className="text-4xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)'}}> Ketentuan Layanan (Terms of Service) </h2>
            <p className="text-sm text-text-muted">Terakhir diperbarui: 13 September 2025</p>
        </header>

        <main className="p-6 overflow-y-auto text-text-body text-sm space-y-4">
            <p>Selamat datang di desain.fun ("Aplikasi", "Layanan")! Layanan kami mencakup serangkaian alat branding AI, termasuk generator persona dan logo, editor gambar ("Sotoshop"), forum komunitas ("WarKop Juragan"), sistem gamifikasi (XP & Level), dan asisten digital ("AIPet"). Dengan mengakses atau menggunakan Aplikasi kami, Anda ("Pengguna") setuju untuk terikat oleh Ketentuan Layanan ini.</p>
            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">1. Akun dan Privasi Data</h3>
                <p>Untuk menggunakan Layanan, Anda harus login menggunakan akun Google Anda. Dengan melakukannya, Anda mengizinkan kami untuk mengakses informasi dasar profil Anda (nama, email, foto profil) sesuai dengan <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">kebijakan privasi Google</a>. Data ini kami gunakan untuk identifikasi akun, personalisasi, dan penyimpanan proyek Anda di database kami yang dikelola oleh <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase</a>. Kami tidak akan menjual atau membagikan data pribadi Anda.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">2. Layanan "AS IS" (Apa Adanya)</h3>
                <p>Semua konten yang dihasilkan oleh AI ("Konten yang Dihasilkan") disediakan atas dasar "SEBAGAIMANA ADANYA". Kami tidak memberikan jaminan bahwa Konten yang Dihasilkan akan unik, bebas dari pelanggaran hak cipta/merek dagang, atau cocok untuk tujuan tertentu.</p>
            </div>
             <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">3. Kepemilikan Konten dan Tanggung Jawab Pengguna</h3>
                <p>Anda memegang hak untuk menggunakan Konten yang Dihasilkan untuk keperluan pribadi maupun komersial. Namun, Anda, sebagai pengguna, memikul tanggung jawab penuh atas penggunaan tersebut. Sebelum menggunakan logo untuk tujuan komersial, Anda <strong className="text-splash">WAJIB</strong> melakukan uji tuntas (due diligence) Anda sendiri, termasuk:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li> Melakukan pencarian merek dagang di <a href="https://pdki-indonesia.dgip.go.id/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">database resmi pemerintah (PDKI)</a>. </li>
                    <li>Memastikan desain tidak melanggar hak cipta yang ada.</li>
                </ul>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">4. Batasan Tanggung Jawab</h3>
                <p>Sejauh diizinkan oleh hukum, <strong className="text-splash">desain.fun dan pengembangnya tidak akan bertanggung jawab</strong> atas segala kerugian atau klaim (termasuk biaya hukum) yang timbul dari penggunaan Anda atas Konten yang Dihasilkan, termasuk klaim pelanggaran merek dagang atau hak cipta oleh pihak ketiga.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">5. Sistem Token, Gamifikasi, dan Kebijakan Gratis</h3>
                <p>Layanan ini menggunakan sistem token. Pengguna baru akan mendapatkan bonus sambutan. Jika token harian pengguna kurang dari batas minimum, token akan diisi ulang secara otomatis setiap hari. Kami berhak mengubah jumlah bonus, isi ulang harian, dan biaya token di masa mendatang. Aplikasi ini juga mencakup sistem gamifikasi seperti Poin Pengalaman (XP) dan Level. Poin dan level ini adalah untuk tujuan keterlibatan (engagement) dan tidak memiliki nilai moneter di dunia nyata.</p>
            </div>
             <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">6. Penyimpanan Data dan Aset Visual</h3>
                <p>Aplikasi ini menyimpan data tekstual (seperti detail bisnis, persona, caption) yang terkait dengan akun Anda. Namun, untuk menjaga agar layanan ini tetap dapat diakses secara gratis, <strong className="text-splash">semua aset visual yang dihasilkan AI (logo, gambar, mockup) TIDAK disimpan secara permanen di server kami.</strong> Aset-aset ini hanya tersimpan sementara di sesi browser Anda. Anda bertanggung jawab penuh untuk mengunduh dan menyimpan semua aset visual ke perangkat Anda sendiri. Kami tidak bertanggung jawab atas kehilangan aset visual karena cache browser yang dibersihkan, pergantian perangkat, atau sebab lainnya.</p>
            </div>
             <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">7. Konten Buatan Pengguna & Etika Komunitas</h3>
                <p>Layanan kami menyediakan fitur komunitas seperti forum "WarKop Juragan". Anda bertanggung jawab penuh atas konten (teks, gambar) yang Anda posting. Anda setuju untuk tidak memposting konten yang melanggar hukum, kasar, mengandung SARA, atau bersifat spam. Kami berhak, tetapi tidak berkewajiban, untuk memoderasi atau menghapus konten yang kami anggap tidak pantas tanpa pemberitahuan. Untuk menjaga kualitas diskusi dan mencegah spam, kemampuan untuk memposting tautan eksternal (link) adalah sebuah keistimewaan yang diberikan kepada pengguna yang telah mencapai Level 3 ke atas.</p>
            </div>
             <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">8. Ganti Rugi (Indemnifikasi)</h3>
                <p>Anda setuju untuk mengganti rugi dan membebaskan desain.fun dari segala klaim atau kerusakan yang timbul dari penggunaan Konten yang Dihasilkan oleh Anda yang melanggar hak pihak ketiga atau melanggar Ketentuan Layanan ini.</p>
            </div>
             <div className="space-y-2">
                <h3 className="font-bold text-text-header text-base">9. Perubahan dan Penghentian Layanan</h3>
                <p>Kami berhak untuk mengubah atau menghentikan Layanan (atau bagian apa pun darinya) kapan saja dengan atau tanpa pemberitahuan. Kami juga berhak menangguhkan akun pengguna yang melanggar Ketentuan ini.</p>
            </div>
            <p className="pt-4 border-t border-border-main">Dengan melanjutkan, Anda mengakui bahwa Anda telah membaca, memahami, dan menyetujui Ketentuan Layanan ini.</p>
        </main>
        <footer className="p-4 bg-background border-t border-border-main flex-shrink-0 flex justify-end">
            <Button onClick={onClose} variant="secondary"> Saya Mengerti </Button>
        </footer>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;