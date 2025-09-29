
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
  onComplete: (data: { packagingUrl: string }) => void;
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
    { 
      id: 'snack_trio', 
      name: 'Trio Kemasan Snack & Makanan Ringan', 
      prompt: 'Create a single, cohesive, high-quality commercial product photoshoot on a clean, minimalist surface. The image must feature three packaging variations for "{{businessName}}", a brand selling "{{businessDetail}}". The style should be {{personaStyle}}. The composition must showcase:\n\n1.  **Center Focus:** A modern standing pouch with a clear window showing the product inside. The provided logo is prominent.\n2.  **Left:** A smaller, sealed foil sachet for single servings, with the logo.\n3.  **Right:** A stack of the actual product (e.g., chips, cookies) next to an open pouch to show texture and appeal.' 
    },
    { 
      id: 'rice_box_set', 
      name: 'Set Nasi Box & Lauk Pauk', 
      prompt: 'Create a single, top-down (flat lay) photo for a food delivery service. The image must feature three variations for "{{businessName}}", a brand selling "{{businessDetail}}". The style should be modern and appetizing. The composition must showcase:\n\n1.  **Center Focus:** A closed brown kraft paper rice box with the provided logo stamped clearly on top.\n2.  **Left:** An open rice box showing the complete meal "{{businessDetail}}" neatly arranged inside.\n3.  **Right:** A separate paper bowl containing just the main lauk (side dish) from the meal, to highlight it.' 
    },
    { 
      id: 'frozen_food_lineup', 
      name: 'Line-up Frozen Food', 
      prompt: 'Create a single, cohesive, high-quality commercial product photoshoot against a clean, white background with subtle icy textures. The image must feature three packaging variations for "{{businessName}}", a brand selling frozen "{{businessDetail}}". The style is {{personaStyle}}. The composition must showcase:\n\n1.  **Center Focus:** A vacuum-sealed plastic pack showing the frozen product clearly.\n2.  **Left:** A designed cardboard box for the frozen food, ready for retail freezer display.\n3.  **Right:** The product "{{businessDetail}}" cooked and beautifully plated on a modern dish, to show the final result.' 
    },
  ],
  'Minuman': [
    { 
      id: 'coffee_shop_trio', 
      name: 'Trio Kopi Kekinian (Gelas, Botol, Biji)', 
      prompt: 'Create a single, cohesive, high-quality commercial product photoshoot on a minimalist cafe table with soft lighting. The image must feature three product variations for "{{businessName}}", which sells "{{businessDetail}}". The composition must showcase:\n\n1.  **Left:** A tall, iced plastic cup of the beverage with the provided logo clearly visible.\n2.  **Center Focus:** A sleek 1-liter bottle (botol kopi literan) with a branded label featuring the provided logo.\n3.  **Right:** A small, branded paper pouch filled with roasted coffee beans, with the logo on it.\nThe entire composition must look professional, trendy, and match the brand style: {{personaStyle}}.' 
    },
    { 
      id: 'jamu_herbal_set', 
      name: 'Set Jamu & Minuman Herbal', 
      prompt: 'Create a single, cohesive, high-quality product photo with an earthy, natural aesthetic. The image must feature three product variations for "{{businessName}}", a brand selling "{{businessDetail}}". The composition must showcase:\n\n1.  **Center Focus:** A classic amber or green glass bottle (botol kaca) with a simple, elegant label featuring the provided logo.\n2.  **Left:** A small, traditional glass (gelas sloki) filled with the beverage.\n3.  **Right:** The raw ingredients (e.g., turmeric, ginger, tamarind) used to make the beverage, arranged artfully next to the bottle.\nThe style should be {{personaStyle}}, emphasizing natural and healthy qualities.' 
    },
  ],
  'Fashion': [
    { 
      id: 'clothing_brand_pack', 
      name: 'Paket Brand Fashion (Baju, Hang Tag, Box)', 
      prompt: 'Create a single, clean, high-end flat lay product photograph for a fashion e-commerce store called "{{businessName}}", which sells "{{businessDetail}}". The background is a neutral, textured surface. The composition must showcase:\n\n1.  **Center Focus:** A neatly folded t-shirt or piece of clothing.\n2.  **On the clothing:** A close-up of a stylish cardboard hang-tag featuring the provided logo.\n3.  **Next to it:** A sleek, branded mailer box or paper bag, also with the logo.\nThe overall aesthetic must be {{personaStyle}}, chic and stylish.' 
    },
  ],
  'Kecantikan': [
    { 
      id: 'skincare_product_line', 
      name: 'Rangkaian Produk Skincare', 
      prompt: 'Create a single, cohesive, high-quality cosmetic product photoshoot against a clean, elegant background. The image must feature three packaging variations for "{{businessName}}", a brand selling "{{businessDetail}}". The composition must showcase:\n\n1.  **Center Focus:** A serum bottle with a dropper.\n2.  **Left:** A cosmetic cream jar.\n3.  **Right:** The outer product box for one of the items.\nAll items must feature the provided logo and look like a cohesive product line. The style is {{personaStyle}}, premium, and clean.' 
    },
  ],
  'Jasa': [
      { 
        id: 'service_branding_kit', 
        name: 'Branding Kit untuk Jasa', 
        prompt: 'Create a single, cohesive, high-quality mockup showcasing a branding kit for a service-based business, "{{businessName}}", which offers "{{businessDetail}}". The style is professional and trustworthy. The flat lay composition on a clean desk must include:\n\n1.  **Center Focus:** A business card featuring the provided logo and contact details.\n2.  **Left:** A branded A4 letterhead or folder.\n3.  **Right:** A smartphone or tablet screen displaying the hero section of a website, with the logo clearly visible.\nThe overall aesthetic must be {{personaStyle}}.' 
      },
  ],
  'Lainnya': [
    { 
      id: 'generic_product_trio', 
      name: 'Trio Produk Serbaguna', 
      prompt: 'Create a single, cohesive, high-quality commercial product photoshoot. The image must feature three packaging variations for "{{businessName}}", a brand selling "{{businessDetail}}". The style is {{personaStyle}}. The composition must showcase:\n\n1.  **Center Focus:** The main product in a premium cardboard box.\n2.  **Left:** The product itself, unboxed and presented attractively.\n3.  **Right:** A branded paper bag or pouch for the product.\nThe entire scene must look professional and ready for an e-commerce website.' 
    },
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
      const logoBase64 = await fetchImageAsBase64(projectData.selectedLogoUrl);
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
      onComplete({ packagingUrl: selectedDesignBase64 });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 8: Foto Produk & Kemasan 3-in-1</h2>
        <p className="text-gray-400">Level up! Mang AI bakal bikinin 1 foto produk profesional yang isinya 3 variasi kemasan atau penyajian sekaligus. Hemat token, hasil maksimal! Pilih skenario yang paling pas buat produk lo.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                 <label htmlFor="packagingType" className="block mb-2 text-sm font-medium text-gray-300">Pilih Skenario Foto Produk</label>
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
          label="Prompt Foto Produk (Sudah Otomatis, Bisa Diedit)"
          name="packagingPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="cth: Kotak minimalis untuk biji kopi, warna earth tone..."
          rows={8}
        />
        <div className="self-start">
          <Button type="submit" isLoading={isLoading} disabled={!prompt.trim() || credits < GENERATION_COST}>
            Jepret Foto Produknya, Mang! ({GENERATION_COST} Token)
          </Button>
        </div>
      </form>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2">Hasil Foto Produk 3-in-1:</h3>
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
                Foto produk siap!
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
