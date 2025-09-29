import React, { useState } from 'react';
import type { Project } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ImageModal from './common/ImageModal';
import CopyButton from './common/CopyButton';
import LoadingMessage from './common/LoadingMessage';

interface Props {
  project: Project;
  onStartNew: () => void;
  onGoToCaptionGenerator: (projectId: number) => void;
  onGoToInstantContent: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
  // --- Regeneration Handlers ---
  onRegenerateContentCalendar: () => Promise<void>;
  onRegenerateSocialKit: () => Promise<void>;
  onRegenerateProfiles: () => Promise<void>;
  onRegenerateSocialAds: () => Promise<void>;
  onRegeneratePackaging: () => Promise<void>;
  onRegeneratePrintMedia: (mediaType: 'banner' | 'roll_banner') => Promise<void>;
}

const BrandHubSidebar: React.FC = () => {
    const navItems = [
        { id: 'strategi', name: 'Strategi Brand', icon: '⭐' },
        { id: 'logo', name: 'Paket Logo', icon: '⭐' },
        { id: 'sosmed-kit', name: 'Social Media Kit', icon: '🖼️' },
        { id: 'profil-sosmed', name: 'Profil Sosmed & Teks Iklan', icon: '✍️' },
        { id: 'kalender-konten', name: 'Kalender Konten', icon: '📅' },
        { id: 'visual-konten', name: 'Aset Visual', icon: '🎨' },
        { id: 'tools', name: 'Tools Lanjutan', icon: '🛠️' },
    ];
    return (
        <aside className="w-full lg:w-1/4 xl:w-1/5">
            <div className="sticky top-24 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Navigasi Brand Hub</h3>
                <nav>
                    <ul className="space-y-2">
                        {navItems.map(item => (
                            <li key={item.id}>
                                <a href={`#${item.id}`} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700/50 hover:text-white transition-colors">
                                    <span>{item.icon}</span>
                                    <span>{item.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    )
}


const ProjectSummary: React.FC<Props> = (props) => {
  const { project, onStartNew, onGoToCaptionGenerator, onGoToInstantContent, onDeleteProject } = props;
  const { brandInputs, selectedPersona, selectedSlogan, selectedLogoUrl, logoVariations, contentCalendar, socialMediaKit, socialProfiles, socialAds, selectedPackagingUrl, printMediaAssets } = project.project_data;
  
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  const handleRegenerate = async (assetKey: string, regenFunc: () => Promise<void>) => {
    setRegenerating(assetKey);
    await regenFunc();
    setRegenerating(null);
  };
  
  const businessHandle = brandInputs.businessName.toLowerCase().replace(/\s/g, '');

  return (
    <>
      <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-400 mb-2">
            Brand Hub untuk "{brandInputs.businessName}"
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Selamat! Ini pusat kendali brand lo. Aset inti (Strategi & Logo) sudah dipatenkan. Lo bisa generate ulang aset turunan kapan aja.
          </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <BrandHubSidebar />

        {/* Main Content */}
        <main className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
            <section id="strategi" className="md:col-span-2">
                <Card title="⭐ Strategi Brand (Master)">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xl font-bold text-gray-100">{brandInputs.businessName}</h4>
                        <p className="text-indigo-300 italic mt-1 selectable-text">"{selectedSlogan}"</p>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h5 className="font-semibold text-gray-200 mb-2">Persona: {selectedPersona.nama_persona}</h5>
                            <p className="text-sm text-gray-300 selectable-text">{selectedPersona.deskripsi_singkat}</p>
                        </div>
                      </div>
                      <div>
                         <h5 className="font-semibold text-gray-200 mb-2">Palet Warna</h5>
                         <div className="flex items-center gap-3">
                          {selectedPersona.palet_warna_hex.map((hex, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-full border-2 border-gray-500" style={{ backgroundColor: hex }}></div>
                              <span className="text-xs text-gray-400 selectable-text">{hex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                  </div>
                </Card>
            </section>

            <section id="logo" className="md:col-span-2">
                <Card title="⭐ Paket Logo (Master)">
                    {logoVariations && (
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                           <div><h5 className="font-semibold text-gray-200 mb-2 text-sm">Logo Utama</h5><div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(selectedLogoUrl)}><img src={selectedLogoUrl} alt="Logo Utama" className="max-w-full max-h-24 object-contain group-hover:scale-105" loading="lazy"/></div></div>
                           <div><h5 className="font-semibold text-gray-200 mb-2 text-sm">Versi Tumpuk</h5><div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(logoVariations.stacked)}><img src={logoVariations.stacked} alt="Logo Tumpuk" className="max-w-full max-h-24 object-contain group-hover:scale-105" loading="lazy"/></div></div>
                           <div><h5 className="font-semibold text-gray-200 mb-2 text-sm">Versi Datar</h5><div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(logoVariations.horizontal)}><img src={logoVariations.horizontal} alt="Logo Datar" className="max-w-full max-h-24 object-contain group-hover:scale-105" loading="lazy"/></div></div>
                           <div><h5 className="font-semibold text-gray-200 mb-2 text-sm">Versi Monokrom</h5><div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(logoVariations.monochrome)}><img src={logoVariations.monochrome} alt="Logo Monokrom" className="max-w-full max-h-24 object-contain group-hover:scale-105" loading="lazy"/></div></div>
                       </div>
                    )}
                </Card>
            </section>
            
            <section id="sosmed-kit">
                <Card title="🖼️ Social Media Kit">
                    {regenerating === 'social_kit' ? <div className="h-48 flex items-center justify-center"><LoadingMessage/></div> : (
                        socialMediaKit ? (
                            <div className="space-y-4">
                                <div><h5 className="font-semibold text-gray-200 mb-2">Foto Profil</h5><div className="bg-white rounded-full p-2 w-32 h-32 mx-auto flex justify-center items-center cursor-pointer group" onClick={() => openModal(socialMediaKit.profilePictureUrl)}><img src={socialMediaKit.profilePictureUrl} alt="Foto Profil" className="max-w-full max-h-full object-contain rounded-full group-hover:scale-105" loading="lazy"/></div></div>
                                <div><h5 className="font-semibold text-gray-200 mb-2">Banner Header</h5><div className="bg-white p-2 rounded-lg cursor-pointer group" onClick={() => openModal(socialMediaKit.bannerUrl)}><img src={socialMediaKit.bannerUrl} alt="Banner" className="w-full object-contain group-hover:scale-105" loading="lazy"/></div></div>
                            </div>
                        ) : <p className="text-sm text-gray-500 italic">Aset ini belum dibuat.</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <Button size="small" variant="secondary" onClick={() => handleRegenerate('social_kit', props.onRegenerateSocialKit)} isLoading={regenerating === 'social_kit'}>{socialMediaKit ? 'Generate Ulang (2 Token)' : 'Generate (2 Token)'}</Button>
                    </div>
                </Card>
            </section>

            <section id="profil-sosmed">
                <div className="flex flex-col gap-8">
                    <Card title="✍️ Profil Sosmed & Marketplace">
                        {regenerating === 'profiles' ? <div className="h-48 flex items-center justify-center"><LoadingMessage/></div> : (
                            socialProfiles ? (
                                <div className="space-y-4">
                                    <div><h5 className="font-semibold text-gray-200 mb-2">Bio Instagram</h5><div className="relative bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-300 whitespace-pre-wrap pr-10 selectable-text">{socialProfiles.instagramBio}</p><CopyButton textToCopy={socialProfiles.instagramBio} className="absolute top-2 right-2"/></div></div>
                                    <div><h5 className="font-semibold text-gray-200 mb-2">Bio TikTok</h5><div className="relative bg-gray-700/50 p-3 rounded-lg"><p className="text-sm text-gray-300 whitespace-pre-wrap pr-10 selectable-text">{socialProfiles.tiktokBio}</p><CopyButton textToCopy={socialProfiles.tiktokBio} className="absolute top-2 right-2"/></div></div>
                                </div>
                            ) : <p className="text-sm text-gray-500 italic">Aset ini belum dibuat.</p>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <Button size="small" variant="secondary" onClick={() => handleRegenerate('profiles', props.onRegenerateProfiles)} isLoading={regenerating === 'profiles'}>{socialProfiles ? 'Generate Ulang (1 Token)' : 'Generate (1 Token)'}</Button>
                        </div>
                    </Card>

                    <Card title="✍️ Teks Iklan Sosmed">
                        {regenerating === 'social_ads' ? <div className="h-48 flex items-center justify-center"><LoadingMessage/></div> : (
                            socialAds && socialAds.length > 0 ? (
                                <div className="space-y-4 max-h-64 overflow-auto">
                                    {socialAds.map((ad, index) => (
                                      <div key={index} className="border-b border-gray-700 pb-3 last:border-b-0 last:pb-0"><h5 className="font-semibold text-gray-200 mb-2">Iklan {ad.platform}</h5><div className="relative bg-gray-900/50 p-3 rounded-lg"><p className="text-sm text-gray-300 whitespace-pre-wrap pr-10 selectable-text">{ad.adCopy}</p><CopyButton textToCopy={ad.adCopy} className="absolute top-2 right-2"/></div></div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-500 italic">Aset ini belum dibuat.</p>
                        )}
                         <div className="mt-4 pt-4 border-t border-gray-700">
                            <Button size="small" variant="secondary" onClick={() => handleRegenerate('social_ads', props.onRegenerateSocialAds)} isLoading={regenerating === 'social_ads'}>{socialAds ? 'Generate Ulang (1 Token)' : 'Generate (1 Token)'}</Button>
                        </div>
                    </Card>
                </div>
            </section>
            
            <section id="kalender-konten" className="md:col-span-2">
                 <Card title="📅 Kalender Konten Mingguan">
                    {regenerating === 'content' ? <div className="h-48 flex items-center justify-center"><LoadingMessage/></div> : (
                        contentCalendar && contentCalendar.length > 0 ? (
                            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto">
                                {contentCalendar.map((item, index) => (
                                  <div key={index} className="border-b border-gray-700 pb-3 last:border-b-0 text-sm"><h5 className="font-bold text-gray-200">{item.hari} - <span className="text-indigo-300">{item.tipe_konten}</span></h5><p className="text-xs text-gray-400 mt-1 selectable-text">{item.ide_konten}</p><div className="relative"><p className="text-gray-300 whitespace-pre-wrap mt-2 text-xs pr-10 selectable-text">{item.draf_caption}</p><CopyButton textToCopy={item.draf_caption} className="absolute top-2 right-0"/></div></div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-500 italic">Aset ini belum dibuat.</p>
                    )}
                     <div className="mt-4 pt-4 border-t border-gray-700">
                        <Button size="small" variant="secondary" onClick={() => handleRegenerate('content', props.onRegenerateContentCalendar)} isLoading={regenerating === 'content'}>{contentCalendar ? 'Generate Ulang (1 Token)' : 'Generate (1 Token)'}</Button>
                    </div>
                  </Card>
            </section>

            <section id="visual-konten">
                <div className="flex flex-col gap-8">
                     <Card title="🎨 Desain Kemasan">
                        {regenerating === 'packaging' ? <div className="h-48 flex items-center justify-center"><LoadingMessage/></div> : (
                            selectedPackagingUrl ? (
                              <div className="bg-white rounded-lg p-2 flex items-center justify-center aspect-[4/3] cursor-pointer group" onClick={() => openModal(selectedPackagingUrl)}><img src={selectedPackagingUrl} alt="Kemasan" className="max-h-48 object-contain group-hover:scale-105" loading="lazy"/></div>
                            ) : <p className="text-sm text-gray-500 italic">Aset ini belum dibuat.</p>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <Button size="small" variant="secondary" onClick={() => handleRegenerate('packaging', props.onRegeneratePackaging)} isLoading={regenerating === 'packaging'}>{selectedPackagingUrl ? 'Generate Ulang (1 Token)' : 'Generate (1 Token)'}</Button>
                        </div>
                    </Card>
                    
                    <Card title="🎨 Aset Media Cetak">
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-semibold text-gray-200 mb-2 text-sm">Spanduk (Horizontal)</h5>
                                {regenerating === 'banner' ? <div className="h-24 flex items-center justify-center"><LoadingMessage/></div> : (
                                    printMediaAssets?.bannerUrl ? <div className="bg-white p-2 rounded-lg cursor-pointer group" onClick={() => openModal(printMediaAssets.bannerUrl!)}><img src={printMediaAssets.bannerUrl} alt="Spanduk" className="w-full object-contain"/></div> : <p className="text-xs text-gray-500 italic">Belum dibuat.</p>
                                )}
                                <div className="mt-2"><Button size="small" variant="secondary" onClick={() => handleRegenerate('banner', () => props.onRegeneratePrintMedia('banner'))} isLoading={regenerating === 'banner'}>{printMediaAssets?.bannerUrl ? 'Ulang' : 'Generate'} (1 Token)</Button></div>
                            </div>
                            <div className="pt-4 border-t border-gray-700">
                                <h5 className="font-semibold text-gray-200 mb-2 text-sm">Roll Banner (Vertikal)</h5>
                                 {regenerating === 'roll_banner' ? <div className="h-24 flex items-center justify-center"><LoadingMessage/></div> : (
                                    printMediaAssets?.rollBannerUrl ? <div className="bg-white p-2 rounded-lg cursor-pointer group" onClick={() => openModal(printMediaAssets.rollBannerUrl!)}><img src={printMediaAssets.rollBannerUrl} alt="Roll Banner" className="w-full object-contain"/></div> : <p className="text-xs text-gray-500 italic">Belum dibuat.</p>
                                )}
                                <div className="mt-2"><Button size="small" variant="secondary" onClick={() => handleRegenerate('roll_banner', () => props.onRegeneratePrintMedia('roll_banner'))} isLoading={regenerating === 'roll_banner'}>{printMediaAssets?.rollBannerUrl ? 'Ulang' : 'Generate'} (1 Token)</Button></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
            
            <section id="tools">
                  <Card title="🛠️ Tools Lanjutan">
                      <div className="space-y-6">
                          <div><h5 className="font-semibold text-gray-200 mb-2">Generator Konten Instan ✨</h5><p className="text-sm text-gray-400 mb-3">Butuh ide & visual cepat? Masukin topiknya, Mang AI bikinin konten lengkap.</p><Button size="small" variant="secondary" onClick={() => onGoToInstantContent(project.id)}>Buat Konten Instan</Button></div>
                          <div className="pt-6 border-t border-gray-700"><h5 className="font-semibold text-gray-200 mb-2">Generator Caption Sosmed</h5><p className="text-sm text-gray-400 mb-3">Udah punya gambar? Pake tool ini buat generate beberapa pilihan caption.</p><Button size="small" variant="secondary" onClick={() => onGoToCaptionGenerator(project.id)}>Buat Caption Aja</Button></div>
                      </div>
                  </Card>
            </section>

             <section id="actions" className="md:col-span-2">
                 <div className="mt-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-wrap gap-4 justify-center items-center">
                    <Button onClick={onStartNew}>Bikin Project Baru</Button>
                    <Button onClick={() => onDeleteProject(project.id)} variant="secondary" className="!border-red-500/50 !text-red-400 hover:!bg-red-500/20">Hapus Project Ini</Button>
                </div>
             </section>
        </main>
      </div>
      
      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText="Preview Aset"
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default ProjectSummary;
