import React, { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { generateLogoOptions } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import type { BrandPersona } from '../types';
import Button from './common/Button';
import Textarea from './common/Textarea';
import LoadingMessage from './common/LoadingMessage';
import ImageModal from './common/ImageModal';
import ErrorMessage from './common/ErrorMessage';
import CalloutPopup from './common/CalloutPopup';

const LegalDisclaimerModal = React.lazy(() => import('./common/LegalDisclaimerModal'));

interface Props {
  persona: BrandPersona;
  businessName: string;
  onComplete: (data: { logoBase64: string; prompt: string }) => void;
}

const LOGO_GENERATION_COST = 2; // Increased cost for 4 images

const logoStyles = [
    {
        id: 'minimalist',
        name: 'Modern & Simpel',
        description: 'Gaya ini mengedepankan kesederhanaan. Bersih, mudah diingat, dan serbaguna di berbagai media. Cocok untuk brand yang ingin terlihat modern dan efisien.',
        promptTemplate: 'logo design for a company named "{{businessName}}", {{personaDescription}}. Style: {{personaKeywords}}, vector, minimalist, flat design, white background.'
    },
    {
        id: 'mascot',
        name: 'Maskot / Fun',
        description: 'Gaya ini paling juara untuk menarik perhatian. Bikin brand jadi lebih "manusiawi" dan gampang diingat. Cocok Untuk: Bisnis F&B (ayam geprek, boba), produk anak, laundry, pet shop.',
        promptTemplate: 'logo design for a company named "{{businessName}}", a friendly and cute character mascot that represents the business. The mascot should look cheerful and inviting, reflecting a personality that is {{personaKeywords}}. Style: fun, cartoon mascot, playful, rounded font, vibrant colors, white background.'
    },
    {
        id: 'rustic',
        name: 'Rustic / Handmade',
        description: 'Gaya ini memberi kesan otentik, alami, dan berkualitas. Cocok Untuk: Produk organik, kerajinan tangan, coffee roastery, bakery, bisnis hampers, produk berbahan dasar alam.',
        promptTemplate: 'logo design for an artisanal company named "{{businessName}}", a hand-drawn illustration of an element related to the business. The text has a slight texture. Style: rustic, handmade, vintage, stamp effect, organic, earth tone colors, white background.'
    },
    {
        id: 'elegant',
        name: 'Elegan / Klasik',
        description: 'Gaya ini cocok untuk UMKM yang mau naik kelas, menargetkan pasar yang lebih premium. Kesannya bersih, mahal, dan terpercaya. Cocok Untuk: Brand fashion, hampers premium, patisserie, jasa MUA, produk kecantikan.',
        promptTemplate: 'logo design for a premium company named "{{businessName}}", an elegant and clean design, maybe using the initials in a classic emblem or a beautiful script font. Style: elegant, luxurious, classic, monogram, clean, minimalist, gold and white color scheme, white background.'
    },
    {
        id: 'ethnic',
        name: 'Etnik / Kultural',
        description: 'Gaya ini menonjolkan akar budaya Indonesia. Punya nilai jual yang sangat kuat karena keunikannya. Cocok Untuk: Restoran masakan daerah, oleh-oleh khas, jamu, produk batik atau tenun.',
        promptTemplate: 'logo design for a company named "{{businessName}}", a stylized icon infused with a simple Indonesian ethnic pattern (like batik or tenun). The font is modern but has a traditional feel. Style: ethnic, traditional, cultural, modern twist, authentic, white background.'
    },
    {
        id: 'wordmark',
        name: 'Fokus Pada Teks',
        description: 'Logo terbaik adalah nama brand itu sendiri, yang didesain dengan font yang sangat khas. Cocok Untuk: Hampir semua jenis bisnis, terutama jasa, brand personal, dan fashion.',
        promptTemplate: 'logo design for a company named "{{businessName}}", a text-only wordmark logo. The font is a custom, unique, and memorable {{personaKeywords}} typeface. Style: wordmark, typography logo, minimalist, clean, text-based, white background.'
    },
    {
        id: 'badge',
        name: 'Badge / Emblem',
        description: 'Gaya ini membungkus nama brand dan ikon dalam sebuah bentuk (lingkaran, perisai). Memberi kesan mapan dan berkualitas. Cocok Untuk: Komunitas, barbershop, coffee shop tema industrial, brand clothing.',
        promptTemplate: 'logo design for a company named "{{businessName}}", a circular badge emblem logo. In the center, there is a simple icon representing the business. The text "{{businessName}}" is wrapped inside the badge. Style: badge, emblem, vintage, retro, classic, monochrome, white background.'
    },
    {
        id: 'urban',
        name: 'Urban / Street Style',
        description: 'Gaya ini terinspirasi dari budaya jalanan dan seni grafiti, cocok untuk menargetkan pasar anak muda dan Gen Z. Cocok Untuk: Distro/clothing, barbershop modern, studio kreatif, food truck.',
        promptTemplate: 'logo design for a modern brand named "{{businessName}}", the name is written in a bold, urban stencil-style or graffiti-style font. The design feels edgy and contemporary. Style: urban, street style, modern, bold, edgy, monochrome, white background.'
    },
    {
        id: 'geometric',
        name: 'Geometris / Modern',
        description: 'Gaya ini menggunakan bentuk-bentuk dasar geometri (garis, segitiga, kotak) untuk menciptakan logo yang cerdas dan futuristik. Cocok Untuk: Jasa digital, logistik, agensi, brand teknologi.',
        promptTemplate: 'logo design for a company named "{{businessName}}", a minimalist icon made of clean geometric lines forming an abstract shape related to the business. Style: geometric, modern, tech, minimalist, line art, precise, white background.'
    }
];

const LogoGenerator: React.FC<Props> = ({ persona, businessName, onComplete }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState('');
  const [logos, setLogos] = useState<string[]>([]); // Will now hold Base64 strings
  const [selectedLogoBase64, setSelectedLogoBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('minimalist');
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showNextStepNudge, setShowNextStepNudge] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const openModal = (url: string) => setModalImageUrl(url);
  const closeModal = () => setModalImageUrl(null);
  
  useEffect(() => {
    const selectedStyle = logoStyles.find(s => s.id === selectedStyleId);
    if (selectedStyle) {
        const newPrompt = selectedStyle.promptTemplate
            .replace(/\{\{businessName\}\}/g, businessName)
            .replace(/\{\{personaDescription\}\}/g, persona.deskripsi_singkat.toLowerCase())
            .replace(/\{\{personaKeywords\}\}/g, persona.kata_kunci.join(', '));
        setPrompt(newPrompt);
    }
  }, [selectedStyleId, persona, businessName]);

  useEffect(() => {
    if (logos.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [logos]);
  
   useEffect(() => {
    if (selectedLogoBase64) {
      const timer = setTimeout(() => setShowNextStepNudge(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowNextStepNudge(false);
    }
  }, [selectedLogoBase64]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (credits < LOGO_GENERATION_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setLogos([]);
    setSelectedLogoBase64(null);
    setShowNextStepNudge(false);
    playSound('start');

    try {
      const results = await generateLogoOptions(prompt); // Returns array of Base64
      await deductCredits(LOGO_GENERATION_COST);
      setLogos(results);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, credits, deductCredits, setShowOutOfCreditsModal]);
  
  const handleContinue = () => {
    if (selectedLogoBase64) {
      onComplete({ logoBase64: selectedLogoBase64, prompt });
    }
  };
  
  const selectedStyleInfo = logoStyles.find(s => s.id === selectedStyleId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 2: Desain Logo Lo</h2>
        <p className="text-gray-400">Pilih gaya yang pas sama brand lo. Mang AI bakal kasih 4 pilihan sekaligus. Lo juga bisa edit prompt-nya kalo mau.</p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="block text-sm font-medium text-gray-300">Pilih Gaya Logo:</label>
        <div className="flex flex-wrap gap-3">
          {logoStyles.map(style => (
            <button
              key={style.id}
              onClick={() => {
                  playSound('select');
                  setSelectedStyleId(style.id);
              }}
              onMouseEnter={() => playSound('hover')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                selectedStyleId === style.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {selectedStyleInfo && (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h4 className="font-bold text-indigo-400">Gaya: {selectedStyleInfo.name}</h4>
          <p className="text-gray-400 mt-1 text-sm">{selectedStyleInfo.description}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Textarea
          label="Prompt Deskripsi Logo (Bisa Diedit)"
          name="logoPrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="cth: Kepala singa megah, gaya geometris, warna emas dan hitam..."
          rows={5}
        />
        <div className="self-start">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt.trim() || credits < LOGO_GENERATION_COST}>
            Spill 4 Logo-nya, Mang AI! ({LOGO_GENERATION_COST} Kredit)
          </Button>
           <p className="text-xs text-gray-500 mt-2">Logo dibuat oleh AI. Lakukan pengecekan merek dagang sebelum dipakai untuk komersial.</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {logos.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
            <div>
              <h3 className="text-lg md:text-2xl font-bold mb-2">Pilih Logo Jagoan Lo:</h3>
            </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
              {logos.map((logo, index) => (
                <div 
                    key={index}
                    className={`bg-white rounded-lg p-2 aspect-square flex items-center justify-center shadow-lg cursor-pointer group transition-all duration-200 ${selectedLogoBase64 === logo ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-indigo-500' : 'opacity-80 hover:opacity-100'}`}
                    onClick={() => {
                        playSound('select');
                        setSelectedLogoBase64(logo);
                    }}
                >
                    <img src={logo} alt={`Generated logo option ${index + 1}`} className="object-contain rounded-md max-w-full max-h-full group-hover:scale-105 transition-transform" />
                </div>
              ))}
          </div>
           <div className="self-center flex items-center gap-4 relative">
             {showNextStepNudge && (
              <CalloutPopup className="absolute bottom-full right-0 mb-2 w-max animate-fade-in">
                Mantap! Klik di sini buat lanjut.
              </CalloutPopup>
            )}
             <Button onClick={() => handleSubmit()} variant="secondary" isLoading={isLoading} disabled={credits < LOGO_GENERATION_COST}>
                Generate Ulang ({LOGO_GENERATION_COST} Kredit)
            </Button>
            <Button onClick={() => setShowDisclaimer(true)} disabled={!selectedLogoBase64}>
              Pilih & Finalisasi Logo &rarr;
            </Button>
          </div>
        </div>
      )}

      {modalImageUrl && (
        <ImageModal 
          imageUrl={modalImageUrl}
          altText={`Logo untuk ${businessName}`}
          onClose={closeModal}
        />
      )}

      <Suspense fallback={null}>
        {showDisclaimer && (
            <LegalDisclaimerModal 
                onClose={() => setShowDisclaimer(false)}
                onConfirm={handleContinue}
            />
        )}
      </Suspense>
    </div>
  );
};

export default LogoGenerator;
