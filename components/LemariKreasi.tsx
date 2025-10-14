// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import type { LemariAsset } from '../types';
import Button from './common/Button';
import LoadingMessage from './common/LoadingMessage';
import ErrorMessage from './common/ErrorMessage';
import { playSound } from '../services/soundService';

const LemariKreasi: React.FC = () => {
  const { user } = useAuth();
  const { toggleSotoshop } = useUI();
  const [assets, setAssets] = useState<LemariAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('lemari_kreasi')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(`Gagal memuat aset: ${error.message}`);
    } else {
      setAssets(data as LemariAsset[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = async (assetId: number) => {
    playSound('error');
    if (!window.confirm('Yakin mau hapus aset ini dari lemari? Gak bisa dibalikin lho.')) return;
    
    const originalAssets = [...assets];
    setAssets(assets.filter(a => a.id !== assetId)); // Optimistic update
    const { error } = await supabase.from('lemari_kreasi').delete().eq('id', assetId);
    if (error) {
      setError(`Gagal menghapus aset: ${error.message}`);
      setAssets(originalAssets); // Revert on error
    } else {
        playSound('success');
    }
  };

  const handleDownload = (asset: LemariAsset) => {
    let base64Url: string | undefined;
    if (asset.asset_type === 'mascot' && asset.asset_data.urls) {
      base64Url = asset.asset_data.urls[0];
    } else if (asset.asset_type === 'moodboard' && asset.asset_data.images) {
      base64Url = asset.asset_data.images[0];
    } else {
      base64Url = asset.asset_data.url;
    }

    if (base64Url) {
      const link = document.createElement('a');
      link.href = base64Url;
      link.download = `${(asset.name || 'asset').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
        alert("Tidak ada gambar yang bisa diunduh untuk aset ini.");
    }
  };

  const handleSendToSotoshop = (asset: LemariAsset) => {
    let base64Url: string | undefined;
    if (asset.asset_type === 'mascot' && asset.asset_data.urls) {
      base64Url = asset.asset_data.urls[0];
    } else if (asset.asset_type === 'moodboard' && asset.asset_data.images) {
      base64Url = asset.asset_data.images[0];
    } else {
      base64Url = asset.asset_data.url;
    }
    
    if (base64Url) {
        sessionStorage.setItem('sotoshop_preload_image', base64Url);
        toggleSotoshop(true);
    } else {
        alert("Aset ini tidak bisa dikirim ke Sotoshop.");
    }
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    const type = asset.asset_type || 'lainnya';
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {} as { [key: string]: LemariAsset[] });

  const renderAsset = (asset: LemariAsset) => {
    let preview: React.ReactNode;
    switch (asset.asset_type) {
        case 'pattern':
        case 'scene_mixer':
        case 'photo_studio':
            preview = <img src={asset.asset_data.url} alt={asset.name} className="w-full h-32 object-cover rounded-t-lg bg-background" loading="lazy" />;
            break;
        case 'mascot':
            preview = <div className="grid grid-cols-2 gap-1 h-32"><img src={asset.asset_data.urls[0]} className="w-full h-full object-cover rounded-tl-lg bg-background" loading="lazy" /><img src={asset.asset_data.urls[1]} className="w-full h-full object-cover rounded-tr-lg bg-background" loading="lazy" /></div>
            break;
        case 'moodboard':
            const images = asset.asset_data?.images;
            preview = (
                <div className="grid grid-cols-2 gap-px h-32 bg-background">
                    {/* FIX: Explicitly cast `images` to a string array after the `Array.isArray` check to satisfy stricter type rules and resolve the `.map` error. */}
                    {Array.isArray(images) && (images as string[]).slice(0, 4).map((img: string, i: number) => (
                        <img key={i} src={img} className={`w-full h-full object-cover ${i === 0 ? 'rounded-tl-lg' : ''} ${i === 1 ? 'rounded-tr-lg' : ''}`} loading="lazy" />
                    ))}
                </div>
            );
            break;
        default:
            preview = <div className="h-32 bg-background flex items-center justify-center text-text-muted">No Preview</div>
    }
    
    return (
        <div key={asset.id} className="bg-surface border border-border-main rounded-lg flex flex-col shadow-md">
            {preview}
            <div className="p-3 flex flex-col flex-grow">
                <p className="text-sm font-semibold text-text-header truncate" title={asset.name}>{asset.name}</p>
                <p className="text-xs text-text-muted">{new Date(asset.created_at).toLocaleDateString('id-ID')}</p>
                <div className="mt-auto pt-3 flex flex-wrap gap-2">
                    <Button size="small" variant="secondary" onClick={() => handleDownload(asset)}>Unduh</Button>
                    <Button size="small" variant="secondary" onClick={() => handleSendToSotoshop(asset)}>Edit</Button>
                    <Button size="small" variant="secondary" onClick={() => handleDelete(asset.id)} className="!text-red-400 !border-red-500/20 hover:!bg-red-500/10">Hapus</Button>
                </div>
            </div>
        </div>
    );
  }

  if (isLoading) return <LoadingMessage />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-8 animate-content-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold text-fuchsia-400 mb-2 text-center" style={{fontFamily: 'var(--font-display)'}}>Lemari Kreasi</h2>
        <p className="text-center text-text-muted max-w-2xl mx-auto -mt-6">Semua aset yang kamu simpan dari 'AI Creator' ada di sini. Kelola, unduh, atau edit lagi kapan aja.</p>
        
        {assets.length === 0 ? (
            <div className="text-center text-text-muted border-2 border-dashed border-border-main rounded-lg p-12">
                <p className="text-4xl mb-4">📦</p>
                <h3 className="font-bold text-text-header text-lg">Lemarimu Masih Kosong!</h3>
                <p className="mt-1">Buka tab 'AI Creator', buat aset keren, lalu klik 'Simpan ke Lemari' buat ngumpulin di sini.</p>
            </div>
        ) : (
            Object.entries(groupedAssets).map(([type, assetList]) => (
                <div key={type}>
                    <h3 className="text-xl font-bold text-text-header capitalize mb-4 pb-2 border-b-2 border-border-main" style={{fontFamily: 'var(--font-display)'}}>{type.replace(/_/g, ' ')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {assetList.map(renderAsset)}
                    </div>
                </div>
            ))
        )}
    </div>
  )
}

export default LemariKreasi;
