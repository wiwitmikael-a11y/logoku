// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface FooterProps {
    onShowAbout: () => void;
    onShowContact: () => void;
    onShowToS: () => void;
    onShowPrivacy: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShowAbout, onShowContact, onShowToS, onShowPrivacy }) => {
    return (
        <footer className="bg-surface border-t border-border-main text-text-muted">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-text-header" style={{fontFamily: 'var(--font-display)'}}><span className="text-primary">des<span className="text-accent">ai</span>n</span>.fun</h3>
                        <p className="text-sm">Studio branding AI untuk UMKM juara. Ubah ide jadi brand siap tanding dalam hitungan menit.</p>
                        <div className="flex space-x-4">
                            <a href="https://www.instagram.com/rangga.p.h" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" title="Instagram Developer">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" /></svg>
                            </a>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-text-header">Navigasi</h4>
                        <ul className="space-y-1 text-sm">
                            <li><button onClick={onShowAbout} className="hover:text-primary transition-colors">Tentang Aplikasi</button></li>
                            <li><button onClick={onShowContact} className="hover:text-primary transition-colors">Kontak Developer</button></li>
                            <li><button onClick={onShowToS} className="hover:text-primary transition-colors">Ketentuan Layanan</button></li>
                            <li><button onClick={onShowPrivacy} className="hover:text-primary transition-colors">Kebijakan Privasi</button></li>
                        </ul>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold text-text-header">Legal</h4>
                        <p className="text-sm">Aplikasi ini disediakan "sebagaimana adanya". Pengguna bertanggung jawab penuh untuk melakukan pengecekan merek dagang sebelum penggunaan komersial.</p>
                    </div>
                </div>
                <div className="mt-8 pt-4 border-t border-border-main text-center text-xs">
                    <p>&copy; {new Date().getFullYear()} Atharrazka Core oleh Rangga.P.H. Dibangun dengan ❤️ untuk UMKM Indonesia.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;