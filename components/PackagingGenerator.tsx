import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generatePackagingDesign } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectData } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';
import { fetchImageAsBase64 } from '../utils/imageUtils';

interface Props {
  projectData: Partial<ProjectData>;
  onComplete: (packagingBase64: string) => void;
  onGoToDashboard: () => void;
}

const GENERATION_COST = 1;

interface PackagingOption {
  id: string;
  name: string;
  prompt: string;
}

interface PackagingCategory {
  [category: string]: PackagingOption[];
}

const packagingConfigs: PackagingCategory = {
  'Makanan': [
    { id: 'paper_bowl', name: 'Paper Bowl / Rice Bowl', prompt: 'Take the provided logo image. Create a realistic, high-quality product mockup of a white paper bowl, commonly used for rice bowl dishes in Indonesia. The bowl is filled with appetizing food like chicken katsu rice. Place the logo prominently and clearly on the side of the bowl. The brand is "{{businessName}}". The background is a clean, minimalist cafe setting. This is a commercial product photo, not a flat vector.' },
    { id: 'rice_box', name: 'Nasi Box Karton', prompt: 'Take the provided logo image. Create a realistic mockup of a folded cardboard takeaway box (nasi box). The box is a natural brown kraft paper color. Place the logo large and centered on the top lid. The brand is "{{businessName}}". The mockup should look like a professional photo for a food delivery service like GoFood/GrabFood.' },
    { id: 'standing_pouch', name: 'Standing Pouch (Snack/Frozen Food)', prompt: 'Take the provided logo image. Create a realistic product mockup of a sealed plastic or foil standing pouch (kemasan pouch) for snacks like chips (keripik) or frozen food. The pouch is on a clean, white surface. Place the logo prominently on the front. The brand is "{{businessName}}". The style is professional and ready for retail.' },
    { id: 'paper_wrap', name: 'Kertas Bungkus (Kebab/Burger)', prompt: 'Take the provided logo image. Create a realistic mockup of a burger or kebab wrapped in branded brown kraft paper. The logo is repeated as a pattern on the paper. The food is held by a hand. The brand is "{{businessName}}". The style is for a trendy street food stall.' },
  ],
  'Minuman': [
    { id: 'plastic_cup', name: 'Gelas Plastik (Kopi/Boba)', prompt: 'Take the provided logo image. Create a realistic photo mockup of a transparent plastic cup with a lid, filled with an iced coffee milk drink (es kopi susu). Place the logo clearly on the side of the cup. The brand is "{{businessName}}". The style is modern and trendy, suitable for a contemporary Indonesian coffee shop. Clean, bright background.' },
    { id: 'beverage_bottle', name: 'Botol Plastik (Jus/Kopi Literan)', prompt: 'Take the provided logo image. Create a realistic mockup of a 250ml or 1 liter plastic bottle, suitable for selling coffee, juice, or jamu. The logo is on a sticker label on the bottle. The brand is "{{businessName}}". The style is clean and modern.' },
  ],
  'Fashion': [
    { id: 'mailer_box', name: 'Mailer Box (Toko Online)', prompt: 'Take the provided logo image. Create a realistic mockup of a brown corrugated cardboard mailer box, suitable for e-commerce shipping. The box is closed. Place the logo on the top of the box as if it were printed or stamped. The brand is "{{businessName}}". The photo has a clean, minimalist aesthetic for an online store.' },
    { id: 'paper_bag', name: 'Paper Bag Belanja', prompt: 'Take the provided logo image. Create a realistic mockup of a stylish paper bag. Place the logo large and centered. The brand is "{{businessName}}". The style is {{personaStyle}}, chic, and stylish for a fashion brand.' },
  ],
  'Kecantikan': [
    { id: 'cosmetic_bottle', name: 'Botol Skincare (Serum/Toner)', prompt: 'Take the provided logo image. Create a realistic mockup of a cosmetic product bottle (e.g., with a pump or dropper) with an elegant box next to it. Place the logo prominently on both the bottle and the box. The brand name is "{{businessName}}". The style is {{personaStyle}}, elegant, and clean.' },
    { id: 'cosmetic_jar', name: 'Jar Kosmetik (Krim)', prompt: 'Take the provided logo image. Create a realistic mockup of a cosmetic cream jar. Place the logo on the lid and the side. The brand name is "{{businessName}}". The style is {{personaStyle}}, clean, and premium.' },
  ],
  'Jasa': [
      { id: 'service_mockup', name: 'Mockup Konseptual Jasa', prompt: 'Take the provided logo image. Create a conceptual mockup that represents a service for "{{businessDetail}}". This could be a branded folder, a clipboard, or a digital tablet screen showing a website. Place the logo prominently. The brand name is "{{businessName}}". The style is {{personaStyle}}, professional, and trustworthy.' },
  ],
  'Lainnya': [
    { id: 'generic_box', name: 'Box Produk Serbaguna', prompt: 'Take the provided logo image. Create a realistic mockup of a high-quality product box for "{{businessDetail}}". Place the logo prominently. The brand name is "{{businessName}}". The style is {{personaStyle}}, modern, and clean. This is a commercial product photo.' },
  ],
};
packagingConfigs['Kerajinan Tangan'] = packagingConfigs['Lainnya'];


const PackagingGenerator: React.FC<Props> = ({ projectData, onComplete, onGoToDashboard }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState('');
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedDesignBase64, setSelectedDesignBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  
  const category = projectData.brandInputs?.businessCategory || 'Lainnya';
  const availableOptions = packagingConfigs[category] || packagingConfigs['Lainnya'];
  
  const [selectedPackagingTypeId, setSelectedPackagingTypeId] = useState<string>(availableOptions[0].id);

  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    const options = packagingConfigs[category] || packagingConfigs['Lainnya'];
    setSelectedPackagingTypeId(options[0].id);
  }, [category]);
  
  useEffect(() => {
    if (!projectData.brandInputs || !projectData.selectedPersona) return;

    const { brandInputs, selectedPersona } = projectData;
    const options = packagingConfigs[category] || packagingConfigs['Lainnya'];
    const config = options.find(opt => opt.id === selectedPackagingTypeId) || options[0];
    
    const personaStyle = selectedPersona.kata_kunci.join(', ');

    const initialPrompt = config.prompt
        .replace(/\{\{businessName\}\}/g, brandInputs.businessName)
        .replace(/\{\{businessDetail\}\}/g, brandInputs.businessDetail)
        .replace(/\{\{personaStyle\}\}/g, personaStyle);

    setPrompt(initialPrompt);
  }, [projectData, category, selectedPackagingTypeId]);

  useEffect(() => {
    if (designs.length > 0 && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [designs]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (credits < GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }

    if (!prompt || !projectData.selectedLogoUrl) {
        setError("Data logo tidak ditemukan untuk membuat desain kemasan.");
        playSound('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setDesigns([]);
    setSelectedDesignBase64(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      // FIX: Fetch the logo as base64 and pass it to the service function.
      const logoBase64 = await fetchImageAsBase64(projectData.selectedLogoUrl);
      // FIX: Correctly call generatePackagingDesign with both prompt and logoBase64 arguments.
      const results = await generatePackagingDesign(prompt, logoBase64);
      await deductCredits(GENERATION_COST);
      setDesigns(results);
      setSelectedDesignBase64(results[0]);
      setShowNextStepNudge(true);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, projectData, credits, deductCredits, setShowOutOfCreditsModal]);

  const handleContinue = () => {
    if (selectedDesignBase64) {
      onComplete(selectedDesignBase64);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 8: Desain Kemasan Lo</h2>
        <p className="text-gray-400">Sentuhan terakhir! Pilih jenis kemasan yang paling pas buat produk lo. Mang AI udah siapin prompt cerdas, edit kalo perlu, terus generate konsepnya.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                 <label htmlFor="packagingType" className="block mb-2 text-sm font-medium text-gray-300">Pilih Jenis Kemasan Spesifik</label>
                 <select
                    id="packagingType"
                    name="packagingType"
                    value={selectedPackagingTypeId}
                    onChange={(e) => setSelectedPackagingTypeId(e.target.value)}
                    className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                 >
                    {availableOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                 </select>
            </div>
            <p className="text-sm text-gray-400 md:pt-8">Pilihan ini disesuaikan berdasarkan kategori bisnis "<span className="font-semibold text-indigo-300">{category}</span>" yang lo pilih di awal.</p>
        </div>

        <Textarea
          label="Prompt Deskripsi Kemasan (Sudah Otomatis, Bisa Diedit)"
          name="packagingPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="cth: Kotak minimalis untuk biji kopi, warna earth tone..."
          rows={5}
        />
        <div className="self-start">
          <Button type="submit" isLoading={isLoading} disabled={!prompt.trim() || credits < GENERATION_COST}>
            Bungkus Desainnya, Mang AI! ({GENERATION_COST} Kredit)
          </Button>
        </div>
      </form>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2">Desain Hasil Generate:</h3>
          </div>
          <div className="flex justify-center w-full max-w-lg">
            <div
                className="bg-white rounded-lg p-2 aspect-[4/3] flex items-center justify-center shadow-lg w-full ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500 cursor-pointer group"
                onClick={() => openModal(designs[0])}
            >
                <img src={designs[0]} alt="Generated packaging design" className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div className="self-center relative">
            {showNextStepNudge && (
              <CalloutPopup className="absolute bottom-full mb-2 w-max animate-fade-in">
                Desain kemasan siap!
              </CalloutPopup>
            )}
            <Button onClick={handleContinue} disabled={!selectedDesignBase64}>
              Lanjut ke Media Cetak &rarr;
            </Button>
          </div>
        </div>
      )}

      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Desain kemasan untuk ${projectData.brandInputs?.businessName}`}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default PackagingGenerator;