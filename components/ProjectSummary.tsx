import React, { useState } from 'react';
import type { Project } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import ImageModal from './common/ImageModal';

interface Props {
  project: Project;
  onStartNew: () => void;
}

const ProjectSummary: React.FC<Props> = ({ project, onStartNew }) => {
  // Destructure the nested project_data object
  const { brandInputs, selectedPersona, selectedSlogan, selectedLogoUrl, logoVariations, contentCalendar, searchSources, selectedPrintMedia, selectedPackagingUrl, selectedMerchandiseUrl } = project.project_data;
  
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);
  
  const handleDownload = () => {
      window.print();
  }

  return (
    <>
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-card {
             background-color: #f3f4f6 !important;
             border: 1px solid #d1d5db !important;
             color: black !important;
             box-shadow: none !important;
             -webkit-print-color-adjust: exact;
             color-adjust: exact;
          }
          .print-text-color { color: black !important; }
          .print-text-brand { color: #4338ca !important; }
          .print-bg-brand { background-color: #4338ca !important; }
          .print-bg-gray { background-color: #e5e7eb !important; }
        }
      `}</style>
      <div id="brand-kit-summary" className="flex flex-col gap-10 items-center text-center print-container">
        <div className="no-print">
          <h2 className="text-3xl font-extrabold text-indigo-400 mb-2">
            Brand Kit untuk "{brandInputs.businessName}" Udah Jadi!
          </h2>
          <p className="text-gray-400 max-w-3xl">
            Selamat! Ini adalah rangkuman lengkap identitas brand lo. Semua aset siap pakai, dari strategi sampai konten.
          </p>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          
          {/* Column 1: Strategy */}
          <div className="flex flex-col gap-6">
            <Card title="Strategi Brand" className="print-card">
              <h4 className="text-xl font-bold text-gray-100 print-text-color">{brandInputs.businessName}</h4>
              <p className="text-indigo-300 italic mt-1 print-text-brand">"{selectedSlogan}"</p>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h5 className="font-semibold text-gray-200 mb-2 print-text-color">Persona: {selectedPersona.nama_persona}</h5>
                <p className="text-sm text-gray-300 print-text-color">{selectedPersona.deskripsi_singkat}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                 <h5 className="font-semibold text-gray-200 mb-2 print-text-color">Palet Warna</h5>
                 <div className="flex items-center gap-3">
                  {selectedPersona.palet_warna_hex.map((hex, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full border-2 border-gray-500" style={{ backgroundColor: hex }}></div>
                      <span className="text-xs text-gray-400 print-text-color">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

             <Card title="Gaya Bicara (Brand Voice)" className="print-card">
                 <p className="text-sm text-gray-300 mb-4 print-text-color">{selectedPersona.brand_voice.deskripsi}</p>
                 <div className="text-xs space-y-2">
                     <p><strong className="text-green-400">GUNAKAN:</strong> {selectedPersona.brand_voice.kata_yang_digunakan.join(', ')}</p>
                     <p><strong className="text-red-400">HINDARI:</strong> {selectedPersona.brand_voice.kata_yang_dihindari.join(', ')}</p>
                 </div>
             </Card>

             <Card title="Avatar Pelanggan" className="print-card">
                 <div className="space-y-3">
                 {selectedPersona.customer_avatars.map((avatar, i) => (
                    <div key={i} className="text-xs p-2 bg-gray-700/50 rounded-md print-bg-gray">
                        <strong className="print-text-color">{avatar.nama_avatar}</strong>
                        <p className="text-gray-300 print-text-color">{avatar.deskripsi_demografis}</p>
                        <p className="text-gray-400 mt-1 print-text-color">Pain points: {avatar.pain_points.join(', ')}</p>
                    </div>
                 ))}
                 </div>
             </Card>
          </div>

          {/* Column 2: Visual Assets */}
          <div className="flex flex-col gap-6">
            <Card title="Paket Logo Lengkap" className="print-card">
              <div className="space-y-4">
                  <div>
                      <h5 className="font-semibold text-gray-200 mb-2 print-text-color">Logo Utama</h5>
                      <div className="bg-white p-4 rounded-lg flex justify-center items-center cursor-pointer group" onClick={() => openModal(selectedLogoUrl)}>
                          <img src={selectedLogoUrl} alt="Logo Utama" className="max-w-full max-h-32 object-contain group-hover:scale-105 transition-transform"/>
                      </div>
                  </div>
                   {logoVariations && (
                       <div className="grid grid-cols-2 gap-4 text-center">
                           <div>
                                <h5 className="font-semibold text-gray-200 mb-2 text-sm print-text-color">Versi Ikon</h5>
                               <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(logoVariations.icon)}>
                                   <img src={logoVariations.icon} alt="Ikon Logo" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/>
                               </div>
                           </div>
                            <div>
                               <h5 className="font-semibold text-gray-200 mb-2 text-sm print-text-color">Versi Monokrom</h5>
                               <div className="bg-white p-2 rounded-lg aspect-square flex justify-center items-center cursor-pointer group" onClick={() => openModal(logoVariations.monochrome)}>
                                   <img src={logoVariations.monochrome} alt="Logo Monokrom" className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform"/>
                               </div>
                           </div>
                       </div>
                   )}
              </div>
            </Card>

            {selectedPrintMedia && (selectedPrintMedia.cardUrl || selectedPrintMedia.flyerUrl || selectedPrintMedia.bannerUrl || selectedPrintMedia.rollBannerUrl) && (
                <Card title="Aset Media Cetak" className="print-card">
                    <div className="space-y-4">
                        {selectedPrintMedia.cardUrl && (
                            <div>
                                <h5 className="font-semibold text-gray-200 mb-2 print-text-color">Kartu Nama</h5>
                                <div className="bg-white p-2 rounded-lg cursor-pointer group" onClick={() => openModal(selectedPrintMedia.cardUrl!)}>
                                    <img src={selectedPrintMedia.cardUrl} alt="Desain Kartu Nama" className="w-full object-contain group-hover:scale-105 transition-transform"/>
                                </div>
                            </div>
                        )}
                        {selectedPrintMedia.flyerUrl && (
                            <div>
                                <h5 className="font-semibold text-gray-200 mb-2 print-text-color">Flyer Promosi</h5>
                                <div className="bg-white p-2 rounded-lg cursor-pointer group" onClick={() => openModal(selectedPrintMedia.flyerUrl!)}>
                                    <img src={selectedPrintMedia.flyerUrl} alt="Desain Flyer" className="w-full object-contain group-hover:scale-105 transition-transform"/>
                                </div>
                            </div>
                        )}
                        {selectedPrintMedia.bannerUrl && (
                            <div>
                                <h5 className="font-semibold text-gray-200 mb-2 print-text-color">Spanduk (Banner)</h5>
                                <div className="bg-white p-2 rounded-lg cursor-pointer group" onClick={() => openModal(selectedPrintMedia.bannerUrl!)}>
                                    <img src={selectedPrintMedia.bannerUrl} alt="Desain Spanduk" className="w-full object-contain group-hover:scale-105 transition-transform"/>
                                </div>
                            </div>
                        )}
                         {selectedPrintMedia.rollBannerUrl && (
                            <div>
                                <h5 className="font-semibold text-gray-200 mb-2 print-text-color">Roll Banner</h5>
                                <div className="bg-white p-2 rounded-lg cursor-pointer group" onClick={() => openModal(selectedPrintMedia.rollBannerUrl!)}>
                                    <img src={selectedPrintMedia.rollBannerUrl} alt="Desain Roll Banner" className="w-full object-contain group-hover:scale-105 transition-transform"/>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
             {selectedPackagingUrl && (
                  <Card title="Desain Kemasan" className="print-card">
                      <div className="bg-white rounded-lg p-2 flex items-center justify-center aspect-[4/3] cursor-pointer group" onClick={() => openModal(selectedPackagingUrl)}>
                        <img src={selectedPackagingUrl} alt="Selected Packaging" className="max-h-48 object-contain transition-transform duration-300 group-hover:scale-105" />
                      </div>
                  </Card>
              )}
               {selectedMerchandiseUrl && (
                  <Card title="Mockup Merchandise" className="print-card">
                      <div className="bg-white rounded-lg p-2 flex items-center justify-center aspect-square cursor-pointer group" onClick={() => openModal(selectedMerchandiseUrl)}>
                        <img src={selectedMerchandiseUrl} alt="Selected Merchandise" className="max-h-48 object-contain transition-transform duration-300 group-hover:scale-105" />
                      </div>
                  </Card>
              )}
          </div>
          
          {/* Column 3: Content */}
          <div className="flex flex-col gap-6">
             <Card title="Kalender Konten Mingguan" className="max-h-[800px] overflow-y-auto print-card">
                  <div className="flex flex-col gap-4">
                      {contentCalendar && contentCalendar.map((item, index) => (
                          <div key={index} className="border-b border-gray-700 pb-3 last:border-b-0 last:pb-0 text-sm">
                              <h5 className="font-bold text-gray-200 print-text-color">{item.hari} - <span className="text-indigo-300 print-text-brand">{item.tipe_konten}</span></h5>
                              <p className="text-xs text-gray-400 mt-1 print-text-color">{item.ide_konten}</p>
                              <p className="text-gray-300 whitespace-pre-wrap mt-2 text-xs print-text-color">{item.draf_caption}</p>
                              <p className="text-indigo-400 text-xs break-words mt-2 print-text-brand">{item.rekomendasi_hashtag.join(' ')}</p>
                          </div>
                      ))}
                      {searchSources && searchSources.length > 0 && (
                          <div className="pt-3 border-t border-gray-700 no-print">
                              <h5 className="font-semibold text-gray-200 mb-2 text-sm">Sumber Riset Konten:</h5>
                              <div className="flex flex-wrap gap-1">
                                  {searchSources.map((source, i) => source.web && (
                                    <a href={source.web.uri} key={i} target="_blank" rel="noopener noreferrer" className="bg-gray-600 text-gray-200 text-[10px] px-2 py-0.5 rounded-full hover:bg-gray-500">{source.web.title}</a>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </Card>
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4 justify-center no-print">
            <Button onClick={handleDownload}>Download Brand Kit (PDF)</Button>
            <Button onClick={onStartNew}>Bikin Brand Kit Baru</Button>
        </div>
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