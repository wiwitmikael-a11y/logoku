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
    {
      id: 'sambal_jar_set',
      name: 'Set Sambal, Bumbu & Selai',
      prompt: 'Create a single, cohesive, high-quality product photoshoot emphasizing texture and fresh ingredients. The image must feature three variations for "{{businessName}}", a brand selling "{{businessDetail}}". The composition on a rustic wooden surface must showcase:\n\n1.  **Center Focus:** The product in a clear glass jar with a branded label.\n2.  **Front:** A small amount of the product on a spoon or in a mini traditional bowl (cobek) to show its rich texture.\n3.  **Background:** Artfully arranged fresh raw ingredients like chili peppers, onions, or strawberries.\nThe overall style is {{personaStyle}}, natural, and appetizing.'
    },
    {
      id: 'bakery_set',
      name: 'Sajian Kue & Roti (Bakery)',
      prompt: 'Create a single, elegant, high-quality bakery photoshoot. The image must feature three perspectives for "{{businessName}}", which sells "{{businessDetail}}". The composition must showcase:\n\n1.  **Center Focus:** The whole cake or loaf of bread on a stylish stand.\n2.  **Front:** A single slice of the product on a plate, revealing the inner texture and layers.\n3.  **Background:** A premium, branded cake box for takeaway.\nThe lighting should be soft and inviting, with a style of {{personaStyle}}.'
    },
    {
      id: 'hampers_pack',
      name: 'Paket Hampers & Katering',
      prompt: 'Create a single, luxurious, high-quality flat lay photograph of a food hamper from "{{businessName}}". The image must showcase the "{{businessDetail}}" package from three perspectives:\n\n1.  **Center Focus:** The beautifully wrapped, closed hamper basket or box.\n2.  **Arranged Around:** A top-down view of all the individual food items from the hamper, artfully arranged.\n3.  **Prominently Placed:** A close-up of a branded greeting card or tag featuring the provided logo.\nThe overall style should be {{personaStyle}}, premium, and celebratory.'
    }
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
    {
      id: 'tea_set',
      name: 'Rangkaian Teh & Tisane',
      prompt: 'Create a single, serene, and high-quality product photoshoot for a tea brand named "{{businessName}}". The image must showcase the process of enjoying "{{businessDetail}}" in three stages:\n\n1.  **Background:** The loose-leaf tea in its branded packaging (a pouch or a tin can).\n2.  **Center Focus:** The tea being steeped in a clear glass teapot, showing the beautiful color of the infusion.\n3.  **Foreground:** A single, elegant teacup filled with the ready-to-drink tea, with a wisp of steam rising.\nThe style should be {{personaStyle}}, calm, and minimalist.'
    },
    {
      id: 'powdered_drink_trio',
      name: 'Trio Minuman Bubuk (Cokelat, Matcha, Susu)',
      prompt: 'Create a single, clean, and dynamic product photoshoot for a powdered drink brand, "{{businessName}}", which sells "{{businessDetail}}". The composition must showcase:\n\n1.  **Background:** The main product packaging (pouch or can) with the provided logo.\n2.  **Mid-ground:** A scoop or spoon showing the fine texture of the powder.\n3.  **Foreground:** A tall glass of the prepared beverage (hot or iced), looking delicious and ready to drink.\nThe overall style is {{personaStyle}}, modern, and energetic.'
    }
  ],
  'Fashion': [
    { 
      id: 'apparel_pack', 
      name: 'Paket Brand Apparel (Baju, Hang Tag, Box)', 
      prompt: 'Create a single, clean, high-end flat lay product photograph for a fashion e-commerce store called "{{businessName}}", which sells "{{businessDetail}}". The background is a neutral, textured surface. The composition must showcase:\n\n1.  **Center Focus:** A neatly folded t-shirt or piece of clothing.\n2.  **On the clothing:** A close-up of a stylish cardboard hang-tag featuring the provided logo.\n3.  **Next to it:** A sleek, branded mailer box or polymailer for shipping.\nThe overall aesthetic must be {{personaStyle}}, chic and stylish.' 
    },
    {
      id: 'hijab_set',
      name: 'Set Hijab & Scarf',
      prompt: 'Create a single, elegant flat lay photograph for a hijab brand, "{{businessName}}". The image must emphasize texture, pattern, and premium packaging. The composition must showcase:\n\n1.  **Main:** The hijab folded gracefully to highlight the branded label.\n2.  **Detail:** A close-up, macro shot of the fabric\'s texture or a key part of the pattern.\n3.  **Packaging:** An exclusive pouch or thin box used for packaging.\nThe style is {{personaStyle}}, sophisticated, and modest.'
    },
    {
      id: 'accessories_trio',
      name: 'Trio Aksesoris (Tas, Sepatu, Dompet)',
      prompt: 'Create a single, cohesive, high-quality commercial product photoshoot for an accessories brand, "{{businessName}}", which sells "{{businessDetail}}". The composition must showcase:\n\n1.  **Main:** The full view of the product (e.g., handbag, pair of shoes).\n2.  **Detail:** A close-up shot focusing on a specific detail like stitching, a buckle, or the material texture.\n3.  **Packaging:** The protective dust bag or branded box it comes with.\nThe style should be {{personaStyle}}, clean, and focused on craftsmanship.'
    }
  ],
  'Kecantikan & Perawatan Diri': [
    { 
      id: 'skincare_product_line', 
      name: 'Rangkaian Produk Skincare', 
      prompt: 'Create a single, cohesive, high-quality cosmetic product photoshoot against a clean, elegant background. The image must feature three packaging variations for "{{businessName}}", a brand selling "{{businessDetail}}". The composition must showcase:\n\n1.  **Center Focus:** A serum bottle with a dropper.\n2.  **Left:** A cosmetic cream jar.\n3.  **Right:** The outer product box for one of the items.\nAll items must feature the provided logo and look like a cohesive product line. The style is {{personaStyle}}, premium, and clean.' 
    },
    {
      id: 'makeup_demo',
      name: 'Demo Produk Makeup (Lipstik, Foundation)',
      prompt: 'Create a single, chic, high-quality cosmetic product photoshoot. The image must demonstrate the product "{{businessDetail}}" from "{{businessName}}". The composition must showcase:\n\n1.  **Product:** The primary packaging of the product (e.g., lipstick tube, foundation bottle).\n2.  **Texture/Color:** A textural smear or swatch of the product on a clean, flat surface (like a piece of acrylic) to show its true color and texture.\n3.  **Packaging:** The secondary outer box for the product.\nThe style should be {{personaStyle}}, clean, modern, and macro-focused.'
    },
    {
      id: 'body_care_set',
      name: 'Set Perawatan Tubuh (Sabun, Lulur, Minyak)',
      prompt: 'Create a single, spa-like, relaxing product photoshoot for a body care brand, "{{businessName}}". The image must showcase "{{businessDetail}}" in an appealing way. The composition, arranged on a surface like slate or wood, must include:\n\n1.  **Product:** The main product (e.g., a bar of soap, a jar of body scrub).\n2.  **Texture:** A demonstration of its texture (e.g., rich lather, scrub granules).\n3.  **Ingredients:** Natural props related to its ingredients (e.g., dried flowers, coffee beans, a slice of lemon).\nThe style should be {{personaStyle}}, natural, and serene.'
    }
  ],
  'Jasa': [
    { 
      id: 'service_branding_kit', 
      name: 'Branding Kit untuk Jasa Profesional', 
      prompt: 'Create a single, cohesive, high-quality mockup showcasing a branding kit for a service-based business, "{{businessName}}", which offers "{{businessDetail}}". The style is professional and trustworthy. The flat lay composition on a clean desk must include:\n\n1.  **Center Focus:** A business card featuring the provided logo and contact details.\n2.  **Left:** A branded A4 letterhead or folder.\n3.  **Right:** A smartphone or tablet screen displaying the hero section of a website, with the logo clearly visible.\nThe overall aesthetic must be {{personaStyle}}.' 
    },
    {
      id: 'creative_service_demo',
      name: 'Proses & Hasil Jasa Kreatif',
      prompt: 'Create a single, professional mockup image to visualize a creative service by "{{businessName}}". The image should show a "process and result" concept. The composition must include:\n\n1.  **Process:** A "behind-the-scenes" element like a camera or a design software interface on a screen.\n2.  **Result:** The final output of the service (a printed photo, a finished design on a screen).\n3.  **Testimonial:** A mockup of a client testimonial quote displayed on a smartphone screen.\nThe style should be {{personaStyle}}, modern, and results-oriented.'
    },
    {
      id: 'physical_service_demo',
      name: 'Paket Jasa Layanan Fisik',
      prompt: 'Create a single, compelling "before and after" diptych image for a service like laundry, cleaning, or a workshop called "{{businessName}}". The composition must showcase:\n\n1.  **Before:** An object in its "before" state (e.g., a dirty shoe).\n2.  **After:** The same object in its clean, pristine "after" state.\n3.  **Branding:** The final product being handed over in a branded bag or box with the provided logo.\nThe style should be clean and emphasize the dramatic, positive transformation.'
    }
  ],
  'Kerajinan Tangan & Dekorasi Rumah': [
    { 
      id: 'generic_product_trio', 
      name: 'Trio Produk Serbaguna', 
      prompt: 'Create a single, cohesive, high-quality commercial product photoshoot. The image must feature three packaging variations for "{{businessName}}", a brand selling "{{businessDetail}}". The style is {{personaStyle}}. The composition must showcase:\n\n1.  **Center Focus:** The main product in a premium cardboard box.\n2.  **Left:** The product itself, unboxed and presented attractively.\n3.  **Right:** A branded paper bag or pouch for the product.\nThe entire scene must look professional and ready for an e-commerce website.' 
    },
    {
      id: 'aromatherapy_set',
      name: 'Set Produk Aromaterapi (Lilin, Diffuser)',
      prompt: 'Create a single, cozy, and atmospheric product photoshoot for an aromatherapy brand "{{businessName}}" selling "{{businessDetail}}". The composition must showcase:\n\n1.  **Product:** The product in its container (a candle in a glass jar, a diffuser bottle).\n2.  **In Use:** A detail of the product in action (the flickering flame of the candle, the reed sticks in the diffuser).\n3.  **Packaging:** The elegant outer box for the product.\nThe lighting should be warm and soft, creating a tranquil mood. The style is {{personaStyle}}.'
    },
    {
      id: 'stationery_set',
      name: 'Rangkaian Alat Tulis & Kertas',
      prompt: 'Create a single, beautiful flat lay photograph for a stationery brand, "{{businessName}}". The image must showcase the quality and design of "{{businessDetail}}". The composition must include:\n\n1.  **Cover:** The front cover of the product (e.g., a journal, planner).\n2.  **Interior:** The product opened to a sample inner page.\n3.  **Detail:** A close-up of a unique feature (e.g., a holographic sticker, the spiral binding, a custom bookmark).\nThe style should be {{personaStyle}}, creative, and well-organized.'
    }
  ],
   'Agrikultur & Produk Tani': [
    {
      id: 'fresh_produce_trio',
      name: 'Trio Hasil Panen (Buah, Sayur, Madu)',
      prompt: 'Create a single, fresh, and vibrant product photoshoot for an agricultural business, "{{businessName}}", selling "{{businessDetail}}". The image must emphasize freshness and natural quality. The composition must include:\n\n1.  **Packaging:** The produce in its delivery packaging (a rustic basket, a branded box).\n2.  **Produce:** The fresh produce itself, artfully arranged and looking delicious.\n3.  **Detail:** A close-up shot showing a detail like a drop of honey, condensation on a fruit, or the texture of a vegetable.\nThe style should be {{personaStyle}}, bright, and organic.'
    },
    {
      id: 'gardening_kit',
      name: 'Set Benih & Perlengkapan Berkebun',
      prompt: 'Create a single, hopeful, and inspiring product photoshoot for a gardening brand, "{{businessName}}". The image should show a complete starter kit for "{{businessDetail}}". The composition must include:\n\n1.  **Seeds:** The branded seed packet.\n2.  **Supplies:** A bag of potting soil or other necessary supplies.\n3.  **Result:** A small, healthy plant seedling growing in a pot, representing the successful outcome.\nThe style should be {{personaStyle}}, earthy, and encouraging.'
    }
  ]
};
// Map old categories to new ones for compatibility
const categoryMap: { [key: string]: string } = {
  'Makanan': 'Makanan',
  'Minuman': 'Minuman',
  'Fashion': 'Fashion',
  'Jasa': 'Jasa',
  'Kecantikan': 'Kecantikan & Perawatan Diri',
  'Kerajinan Tangan': 'Kerajinan Tangan & Dekorasi Rumah',
  'Lainnya': 'Kerajinan Tangan & Dekorasi Rumah'
};

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
  
  const rawCategory = projectData.brandInputs?.businessCategory || 'Lainnya';
  const mappedCategory = categoryMap[rawCategory] || 'Kerajinan Tangan & Dekorasi Rumah';
  const availableOptions = packagingConfigs[mappedCategory] || packagingConfigs['Kerajinan Tangan & Dekorasi Rumah'];
  
  const [selectedPackagingTypeId, setSelectedPackagingTypeId] = useState<string>(availableOptions[0].id);

  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);

  useEffect(() => {
    // Reset selected option if the category changes or doesn't have the current selection
    const currentOptions = packagingConfigs[mappedCategory] || [];
    const selectionExists = currentOptions.some(opt => opt.id === selectedPackagingTypeId);
    if (!selectionExists && currentOptions.length > 0) {
      setSelectedPackagingTypeId(currentOptions[0].id);
    }
  }, [mappedCategory, selectedPackagingTypeId]);
  
  useEffect(() => {
    if (!projectData.brandInputs || !projectData.selectedPersona) return;

    const { brandInputs, selectedPersona } = projectData;
    const options = packagingConfigs[mappedCategory] || packagingConfigs['Kerajinan Tangan & Dekorasi Rumah'];
    const config = options.find(opt => opt.id === selectedPackagingTypeId) || options[0];
    
    const personaStyle = selectedPersona.kata_kunci.join(', ');

    const initialPrompt = config.prompt
        .replace(/\{\{businessName\}\}/g, brandInputs.businessName)
        .replace(/\{\{businessDetail\}\}/g, brandInputs.businessDetail)
        .replace(/\{\{personaStyle\}\}/g, personaStyle);

    setPrompt(initialPrompt);
  }, [projectData, mappedCategory, selectedPackagingTypeId]);

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
      // FIX: The uploadImageFromBase64 function is deprecated. Using the base64 result directly.
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
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 6: Foto Produk & Kemasan 3-in-1</h2>
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
            <p className="text-sm text-gray-400 md:pt-8">Pilihan ini disesuaikan berdasarkan kategori bisnis "<span className="font-semibold text-indigo-300">{rawCategory}</span>", dan menggunakan skenario untuk "<span className="font-semibold text-indigo-300">{mappedCategory}</span>".</p>
        </div>

        <Textarea
          label="Prompt Foto Produk (Sudah Otomatis, Bisa Diedit)"
          name="packagingPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="cth: Kotak minimalis untuk biji kopi, warna earth tone..."
          rows={10}
        />
        <div className="self-start">
          <Button type="submit" isLoading={isLoading} disabled={!prompt.trim() || credits < GENERATION_COST}>
            Jepret Foto Produknya, Mang! ({GENERATION_COST} Token)
          </Button>
        </div>
      </form>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {designs.length > 0 && (
        <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg p-4 flex items-start gap-4 text-left">
            <div className="flex-shrink-0 pt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <div>
                <h4 className="font-bold text-yellow-300">Peringatan Penyimpanan Lokal!</h4>
                <p className="text-sm text-yellow-200 mt-1">
                    Aset visual ini hanya disimpan sementara di browser. Segera lanjutkan ke langkah berikutnya untuk menyimpan progres. <strong>Progres akan hilang jika lo me-refresh atau menutup halaman ini.</strong>
                </p>
            </div>
        </div>
      )}

      {designs.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2">Hasil Foto Produk 3-in-1:</h3>
          </div>
          <div className="flex justify-center w-full max-w-lg animate-image-appear">
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