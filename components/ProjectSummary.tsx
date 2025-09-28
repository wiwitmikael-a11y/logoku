
import React, { useState } from 'react';
import { uploadAndSyncProjectAssets } from '../services/storageService';
import { playSound } from '../services/soundService';
import { supabase } from '../services/supabaseClient';
import type { Project, ProjectData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  projectData: ProjectData;
  activeProject: Project;
  onGoToDashboard: () => void;
  onOpenCaptionGenerator: () => void;
  onOpenInstantContent: () => void;
  onSyncComplete: () => void;
}

const isBase64 = (str: string) => str.startsWith('data:image');

const ProjectSummary: React.FC<Props> = ({ projectData, activeProject, onGoToDashboard, onOpenCaptionGenerator, onOpenInstantContent, onSyncComplete }) => {
  const { brandInputs, selectedPersona, selectedSlogan, selectedLogoUrl, logoVariations, contentCalendar, socialMediaKit, socialProfiles, socialAds, selectedPackagingUrl, printMediaAssets } = projectData;
  const { profile } = useAuth();

  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const hasUnsyncedAssets = 
      isBase64(selectedLogoUrl) ||
      (logoVariations && Object.values(logoVariations).some(isBase64)) ||
      (socialMediaKit && Object.values(socialMediaKit).some(isBase64)) ||
      (contentCalendar && contentCalendar.some(c => c.imageUrl && isBase64(c.imageUrl))) ||
      (selectedPackagingUrl && isBase64(selectedPackagingUrl)) ||
      (printMediaAssets && Object.values(printMediaAssets).some(url => url && isBase64(url)));

  const handleSyncAssets = async () => {
      if (!activeProject || !hasUnsyncedAssets) return;
      setIsSyncing(true);
      playSound('start');
      try {
          const syncedProjectData = await uploadAndSyncProjectAssets(activeProject);
          
          // Update the project in Supabase with the new URLs
          const { error } = await supabase
              .from('projects')
              .update({ project_data: syncedProjectData, status: 'completed' })
              .eq('id', activeProject.id);

          if (error) throw error;
          
          playSound('success');
          onSyncComplete(); // This will refetch projects and show a toast
      } catch (error) {
          console.error("Failed to sync assets:", error);
          playSound('error');
          // TODO: Show an error message to the user
      } finally {
          setIsSyncing(false);
      }
  };


  const openModal = (url: string | undefined) => {
    if (url) setModalImageUrl(url);
  };
  const closeModal = () => setModalImageUrl(null);
  
  const businessHandle = brandInputs.businessName.toLowerCase().replace(/\s/g, '') || 'bisniskeren';

  return (
    <div className="flex flex-col gap-12 animate-content-fade-in">
      {/* Header */}
      <div className="text-center">
        <img src={selectedLogoUrl} alt="Logo Utama" className="w-24 h-24 mx-auto mb-4 bg-white p-2 rounded-xl shadow-lg" />
        <h1 className="text-3xl md:text-4xl font-bold text-white">{brandInputs.businessName}</h1>
        <p className="text-lg md:text-xl text-indigo-300 italic mt-2">"{selectedSlogan}"</p>
      </div>

       {hasUnsyncedAssets && (
            <div className="w-full max-w-2xl mx-auto bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 flex items-center gap-4 text-left">
                <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" /></svg>
                </div>
                <div>
                <h4 className="font-bold text-white">Satu Langkah Terakhir!</h4>
                <p className="text-sm text-yellow-200">
                    Aset visual lo masih disimpan sementara di browser. Klik "Simpan & Sinkronkan" untuk mengunggah semuanya ke penyimpanan permanen dan mendapatkan URL publik.
                </p>
                 <Button onClick={handleSyncAssets} isLoading={isSyncing} size="small" className="mt-3">
                    {isSyncing ? 'Mengunggah Aset...' : 'Simpan & Sinkronkan Aset'}
                </Button>
                </div>
            </div>
        )}
      
       {/* Quick Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
         <Card title="Butuh Caption Cepat?" className="text-center !border-indigo-600/50">
            <p className="text-sm text-gray-400 mb-4">Ubah ide jadi caption sosmed dalam sekejap pakai persona brand lo.</p>
            <Button onClick={onOpenCaptionGenerator}>Buka Generator Caption</Button>
         </Card>
         <Card title="Mau Ngonten Sat-Set?" className="text-center !border-indigo-600/50">
             <p className="text-sm text-gray-400 mb-4">Bikin gambar + caption siap posting dari satu topik aja. Cepat dan praktis!</p>
            <Button onClick={onOpenInstantContent}>Buka Konten Instan</Button>
         </Card>
      </div>


      {/* Brand Persona Section */}
      <section>
        <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">Intisari Brand</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Persona Brand" className="lg:col-span-1">
                 <h3 className="text-xl font-bold text-white mb-2">{selectedPersona.nama_persona}</h3>
                 <p className="text-gray-300 mb-4 selectable-text">{selectedPersona.deskripsi_singkat}</p>
                 <div className="flex flex-wrap gap-2 mb-4">
                     {selectedPersona.kata_kunci.map(kw => <span key={kw} className="bg-gray-700 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{kw}</span>)}
                 </div>
                 <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-200 mb-2">Palet Warna:</h4>
                    <div className="flex items-center gap-3">
                        {selectedPersona.palet_warna_hex.map((hex) => (
                            <div key={hex} className="w-10 h-10 rounded-full border-2 border-gray-500 shadow-md" style={{ backgroundColor: hex }} title={hex}></div>
                        ))}
                    </div>
                 </div>
            </Card>
            <Card title="Gaya Bicara & Target Pelanggan" className="lg:col-span-1">
                 <div className="space-y-4">
                    <div className="selectable-text">
                        <h4 className="font-semibold text-gray-200 mb-2">Gaya Bicara (Brand Voice):</h4>
                        <p className="text-sm text-gray-400"><strong>Deskripsi:</strong> {selectedPersona.brand_voice.deskripsi}</p>
                        <p className="text-sm text-gray-400 mt-1"><strong>Gunakan:</strong> {selectedPersona.brand_voice.kata_yang_digunakan.join(', ')}</p>
                        <p className="text-sm text-gray-400"><strong>Hindari:</strong> {selectedPersona.brand_voice.kata_yang_dihindari.join(', ')}</p>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-gray-200 mb-2">Avatar Pelanggan:</h4>
                        <div className="space-y-2">
                        {selectedPersona.customer_avatars.map((avatar, i) => (
                            <div key={i} className="text-sm p-2 bg-gray-700/50 rounded-md selectable-text">
                                <strong>{avatar.nama_avatar}:</strong> {avatar.deskripsi_demografis}. Aktif di {avatar.media_sosial.join(', ')}.
                            </div>
                        ))}
                        </div>
                    </div>
                 </div>
            </Card>
        </div>
      </section>

      {/* Logo & Visual Assets Section */}
      <section>
          <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">Aset Visual Utama</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
              {logoVariations && Object.entries(logoVariations).map(([key, url]) => (
                  <div key={key} className="flex flex-col items-center gap-2">
                      <div className="bg-white rounded-lg p-2 w-full aspect-square flex items-center justify-center shadow-lg cursor-pointer group" onClick={() => openModal(url)}>
                          <img src={url} alt={`Logo ${key}`} className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400 capitalize">{key}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* Social Media Kit Section */}
      {socialMediaKit && (
        <section>
          <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">Social Media Kit</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2 flex flex-col items-center gap-3">
                  <h4 className="font-semibold text-lg text-white">Foto Profil</h4>
                  <div className="bg-white rounded-full p-2 flex items-center justify-center shadow-lg w-48 h-48 cursor-pointer group" onClick={() => openModal(socialMediaKit.profilePictureUrl)}>
                    <img src={socialMediaKit.profilePictureUrl} alt="Foto Profil" className="object-contain rounded-full max-w-full max-h-full group-hover:scale-105 transition-transform" />
                  </div>
              </div>
              <div className="md:col-span-3 flex flex-col items-center gap-3">
                  <h4 className="font-semibold text-lg text-white">Banner / Header</h4>
                    <div className="bg-white rounded-lg p-2 flex items-center justify-center shadow-lg w-full aspect-video cursor-pointer group" onClick={() => openModal(socialMediaKit.bannerUrl)}>
                        <img src={socialMediaKit.bannerUrl} alt="Banner" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
                    </div>
              </div>
          </div>
        </section>
      )}

      {/* Social Media Content Section */}
      {(socialProfiles || socialAds) && (
        <section>
          <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">Amunisi Konten Sosmed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialProfiles && (
              <>
                <Card title="Bio Instagram">
                  <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                        {socialMediaKit && <img src={socialMediaKit.profilePictureUrl} alt="logo" className="w-12 h-12 rounded-full bg-white p-0.5" />}
                        <div><p className="font-bold text-white text-sm">{businessHandle}</p></div>
                    </div>
                    <div className="relative"><p className="text-sm text-gray-300 whitespace-pre-wrap selectable-text">{socialProfiles.instagramBio}</p><CopyButton textToCopy={socialProfiles.instagramBio} className="absolute top-0 right-0" /></div>
                  </div>
                </Card>
                <Card title="Bio TikTok">
                  <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                    {socialMediaKit && <img src={socialMediaKit.profilePictureUrl} alt="logo" className="w-16 h-16 rounded-full bg-white p-1 mx-auto" />}
                    <p className="font-bold text-white mt-2">@{businessHandle}</p>
                    <div className="relative mt-2"><p className="text-sm text-gray-300 whitespace-pre-wrap selectable-text">{socialProfiles.tiktokBio}</p><CopyButton textToCopy={socialProfiles.tiktokBio} className="absolute top-0 right-0" /></div>
                  </div>
                </Card>
                 <Card title="Deskripsi Toko Marketplace" className="md:col-span-2 lg:col-span-1">
                    <div className="relative"><p className="text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-auto selectable-text">{socialProfiles.marketplaceDescription}</p><CopyButton textToCopy={socialProfiles.marketplaceDescription} className="absolute top-0 right-0" /></div>
                </Card>
              </>
            )}
            {socialAds && socialAds.map((ad, index) => (
                <Card key={index} title={`Opsi Iklan untuk ${ad.platform}`}>
                    <div className="space-y-4">
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                             <div className="flex items-center gap-3 mb-3">
                                {socialMediaKit && <img src={socialMediaKit.profilePictureUrl} alt="logo" className="w-10 h-10 rounded-full bg-white p-0.5" />}
                                <div><p className="font-bold text-white text-sm">{businessHandle}</p><p className="text-xs text-gray-400">Sponsored</p></div>
                            </div>
                            <div className="relative"><p className="text-sm text-gray-300 whitespace-pre-wrap selectable-text">{ad.adCopy}</p><CopyButton textToCopy={ad.adCopy} className="absolute top-0 right-0" /></div>
                        </div>
                         <div className="relative"><p className="text-indigo-300 text-xs break-words selectable-text">{ad.hashtags.join(' ')}</p><CopyButton textToCopy={ad.hashtags.join(' ')} className="absolute top-0 right-0" /></div>
                    </div>
                </Card>
            ))}
          </div>
        </section>
      )}

      {/* Content Calendar Section */}
      {contentCalendar && (
        <section>
            <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">Kalender Konten</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentCalendar.map((item, index) => (
                <Card key={index} title={`${item.hari} - ${item.tipe_konten}`} className="relative">
                    <CopyButton textToCopy={`Ide Konten: ${item.ide_konten}\n\nDraf Caption:\n${item.draf_caption}\n\nHashtag:\n${item.rekomendasi_hashtag.join(' ')}`} className="absolute top-4 right-4 z-10" title="Salin semua info hari ini" />
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-200 text-sm mb-1">Ide Konten:</h4>
                            <p className="text-gray-300 text-sm selectable-text">{item.ide_konten}</p>
                        </div>
                        <div className="relative border-t border-gray-700 pt-3">
                            <h4 className="font-semibold text-gray-200 text-sm mb-1">Draf Caption:</h4>
                            <p className="text-gray-300 whitespace-pre-wrap text-sm pr-10 selectable-text">{item.draf_caption}</p>
                            <CopyButton textToCopy={item.draf_caption} className="absolute top-2 right-0"/>
                        </div>
                        <div className="relative border-t border-gray-700 pt-3">
                            <h4 className="font-semibold text-gray-200 text-sm mb-1">Hashtag:</h4>
                            <p className="text-indigo-300 text-xs break-words pr-10 selectable-text">{item.rekomendasi_hashtag.join(' ')}</p>
                            <CopyButton textToCopy={item.rekomendasi_hashtag.join(' ')} className="absolute top-2 right-0"/>
                        </div>
                        {item.imageUrl && (
                            <div className="border-t border-gray-700 pt-3">
                                <h4 className="font-semibold text-gray-200 text-sm mb-2">Aset Visual</h4>
                                <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(item.imageUrl)}>
                                    <img src={item.imageUrl} alt={`Visual untuk ${item.ide_konten}`} className="max-w-full max-h-48 object-contain group-hover:scale-105 transition-transform"/>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
                ))}
            </div>
        </section>
      )}

      {/* Packaging & Print Media */}
      {(selectedPackagingUrl || printMediaAssets) && (
        <section>
          <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">Aset Promosi & Kemasan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedPackagingUrl && (
              <div className="flex flex-col items-center gap-2">
                <h4 className="font-semibold text-lg text-white">Desain Kemasan</h4>
                <div className="bg-white rounded-lg p-2 w-full aspect-[4/3] flex items-center justify-center shadow-lg cursor-pointer group" onClick={() => openModal(selectedPackagingUrl)}>
                  <img src={selectedPackagingUrl} alt="Desain Kemasan" className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform" />
                </div>
              </div>
            )}
            {printMediaAssets?.bannerUrl && (
              <div className="flex flex-col items-center gap-2">
                <h4 className="font-semibold text-lg text-white">Spanduk</h4>
                <div className="bg-white rounded-lg p-2 w-full aspect-[3/1] flex items-center justify-center shadow-lg cursor-pointer group" onClick={() => openModal(printMediaAssets.bannerUrl)}>
                  <img src={printMediaAssets.bannerUrl} alt="Spanduk" className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform" />
                </div>
              </div>
            )}
             {printMediaAssets?.rollBannerUrl && (
              <div className="flex flex-col items-center gap-2">
                <h4 className="font-semibold text-lg text-white">Roll Banner</h4>
                <div className="bg-white rounded-lg p-2 w-full aspect-[9/16] flex items-center justify-center shadow-lg cursor-pointer group" onClick={() => openModal(printMediaAssets.rollBannerUrl)}>
                  <img src={printMediaAssets.rollBannerUrl} alt="Roll Banner" className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}


      <div className="mt-8 text-center">
        <Button onClick={onGoToDashboard} variant="secondary">
          &larr; Kembali ke Dashboard
        </Button>
      </div>

      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Aset untuk ${brandInputs.businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ProjectSummary;