import React, { useState } from 'react';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const SupabaseKeyErrorScreen = ({ error }: { error: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const userFriendlyMessage = "Waduh, Juragan! Kayaknya ada yang nyabut kabel server Mang AI, nih. Jadi nggak bisa nyambung ke database.";
    const secretErrorCode = "[ERROR: KABEL_SBLS]";

    const handleCopy = () => {
        navigator.clipboard.writeText(`${userFriendlyMessage}\n\n${secretErrorCode}\n(Internal: ${error})`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4 text-center transition-colors duration-300">
        <div className="max-w-xl w-full flex flex-col items-center gap-6">
            <img 
                src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
                alt="Mang AI tersandung kabel"
                className="w-40 h-40 object-contain animate-tripped-ai"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="bg-surface border border-border-main p-6 rounded-lg shadow-md w-full">
                <h2 className="text-2xl font-bold text-accent mb-2">Koneksi Gagal!</h2>
                <p className="text-text-body">{userFriendlyMessage}</p>
                 <p className="mt-4 text-sm text-text-muted font-mono bg-background inline-block px-2 py-1 rounded">
                    {secretErrorCode}
                </p>
                <details className="mt-6 text-left text-sm text-text-muted">
                    <summary className="cursor-pointer font-semibold text-primary hover:underline">Tampilkan Cara Perbaikan (Untuk Developer)</summary>
                    <div className="mt-3 p-4 bg-background rounded-md border border-border-main space-y-3">
                        <p className="font-semibold text-text-header">Penyebab:</p>
                        <p>Aplikasi ini tidak bisa menemukan kunci koneksi ke database Supabase. Kunci ini harus diatur sebagai "Environment Variables" di platform hosting (misalnya Vercel, Netlify).</p>
                        
                        <p className="font-semibold text-text-header mt-2">Solusi:</p>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Buka dasbor proyek Anda di <strong className="text-text-header">Vercel</strong>.</li>
                            <li>Pergi ke <strong className="text-text-header">Settings &rarr; Environment Variables</strong>.</li>
                            <li>Tambahkan dua variabel berikut:</li>
                            <ul className="list-disc list-inside pl-6 mt-1 font-mono text-xs bg-surface/50 p-2 rounded">
                                <li>
                                    <code className="text-accent">VITE_SUPABASE_URL</code>: Isi dengan URL proyek Supabase Anda.
                                </li>
                                <li>
                                    <code className="text-accent">VITE_SUPABASE_ANON_KEY</code>: Isi dengan "anon" key proyek Supabase Anda.
                                </li>
                            </ul>
                            <li>
                                <strong className="text-accent">PENTING:</strong> Pastikan nama variabel diawali dengan <code className="font-mono text-xs">VITE_</code>. Ini wajib agar aplikasi bisa membacanya.
                            </li>
                            <li>Setelah disimpan, <strong className="text-text-header">Redeploy</strong> (deploy ulang) proyek Anda agar perubahan terbaca.</li>
                        </ol>
                    </div>
                </details>
            </div>
            <Button onClick={handleCopy} variant="secondary" size="small" className="!border-accent/50 !text-accent hover:!bg-accent/10">
                {isCopied ? 'Info Tersalin!' : 'Salin Info Error'}
            </Button>
        </div>
    </div>
    );
};

export default SupabaseKeyErrorScreen;
