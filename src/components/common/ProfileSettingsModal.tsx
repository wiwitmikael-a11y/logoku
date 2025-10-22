// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { getSupabaseClient } from '../../services/supabaseClient';
import Button from './Button';
import Input from './Input';
import Select from './Select';

interface Props {
  show: boolean;
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<Props> = ({ show, onClose }) => {
  const { profile, refreshProfile } = useAuth();
  const { language, setLanguage } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile, show]);

  if (!show || !profile) return null;

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, language: language })
      .eq('id', profile.id);

    if (error) {
      setError(`Gagal menyimpan: ${error.message}`);
    } else {
      setSuccess('Profil berhasil disimpan!');
      await refreshProfile();
      setTimeout(() => setSuccess(''), 2000);
    }
    setIsLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-md w-full bg-surface rounded-2xl shadow-xl p-8">
        <button onClick={onClose} title="Tutup" className="absolute top-4 right-4 p-2 text-primary rounded-full hover:bg-background transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-text-header mb-6">Pengaturan Profil</h2>
        
        <div className="space-y-4">
          <Input label="Email" name="email" value={profile.email || ''} disabled />
          <Input label="Nama Lengkap" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Lengkap Juragan" />
          <Select
            label="Bahasa"
            name="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
            options={[
              { value: 'id', label: 'Bahasa Indonesia' },
              { value: 'en', label: 'English' }
            ]}
          />
        </div>

        <div className="mt-6 flex justify-between items-center">
          <Button onClick={handleSave} isLoading={isLoading}>Simpan</Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
