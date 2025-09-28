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
  onComplete: (data: { allLogos: string[]; logoBase64: string; prompt: string }) => void;
  onGoToDashboard: () => void;
}

const INITIAL_LOGO_COST = 1;
const ADDITIONAL_LOGO_COST = 3;


const logoStyles = [
    {
        id: 'minimalist',
        name: 'Modern & Simpel',
        description: 'Gaya ini mengedepankan kesederhanaan. Bersih, mudah diingat, dan serbaguna di berbagai media. Cocok untuk brand yang ingin terlihat modern dan efisien.',
        promptTemplate: 'an ultra-minimalist logomark for "{{businessName}}", using clever negative space or the golden ratio. Style: {{personaKeywords}}, geometric precision, clean vector lines, high contrast, single color, solid white background.'
    },
    {
        id: 'mascot',
        name: 'Maskot / Fun',
        description: 'Bikin brand jadi lebih "manusiawi" dan gampang diingat. Cocok Untuk: Bisnis F&B, produk anak, laundry, pet shop.',
        promptTemplate: 'a professional character mascot logo for "{{businessName}}", in a dynamic and expressive pose. Style: modern vector illustration, clean lines, vibrant colors, fun, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'elegant',
        name: 'Elegan / Klasik',
        description: 'Cocok untuk UMKM yang mau naik kelas. Kesannya bersih, mahal, dan terpercaya. Cocok Untuk: Brand fashion, hampers premium, patisserie, jasa MUA.',
        promptTemplate: 'an ultra-luxurious and elegant logo for "{{businessName}}", inspired by art deco design. Featuring clean lines and a sophisticated serif monogram. Style: premium, classic, refined, {{personaKeywords}}, high contrast, solid white background.'
    },
    {
        id: 'geometric',
        name: 'Geometris / Abstrak',
        description: 'Menggunakan bentuk-bentuk dasar untuk menciptakan logo yang cerdas dan modern. Cocok Untuk: Jasa digital, logistik, agensi, brand teknologi.',
        promptTemplate: 'a clever abstract mark for "{{businessName}}", constructed from precise and symmetrical geometric shapes and lines. Style: modern, tech, line art, intelligent design, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'badge',
        name: 'Badge / Emblem',
        description: 'Membungkus nama brand dan ikon dalam sebuah bentuk. Memberi kesan mapan dan berkualitas. Cocok Untuk: Komunitas, barbershop, coffee shop, brand clothing.',
        promptTemplate: 'a classic circular badge emblem logo for "{{businessName}}", with a detailed icon in the center and sharp, clean text. Style: vintage, retro, detailed line work, premium, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'rustic',
        name: 'Rustic / Handmade',
        description: 'Memberi kesan otentik, alami, dan berkualitas. Cocok Untuk: Produk organik, kerajinan tangan, coffee roastery, bakery.',
        promptTemplate: 'an artisanal, hand-drawn logo for "{{businessName}}", with an organic texture and a woodcut illustration style. Style: rustic, handmade, vintage, stamp effect, earthy tones, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'ethnic',
        name: 'Etnik / Kultural',
        description: 'Menonjolkan akar budaya Indonesia. Punya nilai jual yang sangat kuat karena keunikannya. Cocok Untuk: Restoran masakan daerah, oleh-oleh khas, jamu, batik.',
        promptTemplate: 'a modern interpretation of a traditional Indonesian ethnic pattern (e.g., stylized Batik Mega Mendung, Dayak ornament) as a logomark for "{{businessName}}". Style: ethnic, cultural, elegant, minimalist twist, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'kawaii',
        name: 'Kawaii / Cute',
        description: 'Gaya imut dan menggemaskan dari Jepang. Sangat menarik perhatian dan disukai target pasar muda. Cocok untuk: Bisnis dessert, aksesoris, ATK, produk karakter.',
        promptTemplate: 'an ultra-cute chibi character logo for "{{businessName}}". Style: Japanese kawaii, soft pastel gradients, rounded shapes, adorable and simple, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'tech',
        name: 'Tech / Futuristik',
        description: 'Memberi kesan canggih, inovatif, dan terdepan. Garis-garis tajam dan warna-warna cerah. Cocok untuk: Startup teknologi, jasa digital, e-sports, gadget.',
        promptTemplate: 'a futuristic and innovative logo for a tech company named "{{businessName}}", incorporating abstract circuit board patterns or data visualization elements. Style: digital, sharp vector lines, neon glow, vibrant blue and purple, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'graffiti',
        name: 'Graffiti / Street Art',
        description: 'Terinspirasi dari budaya jalanan, memberi kesan berani, enerjik, dan anti-mainstream. Cocok untuk: Distro, barbershop, studio kreatif, event musik.',
        promptTemplate: 'a bold urban tag logo for "{{businessName}}", with a dynamic spray paint texture and subtle drip effects. Style: graffiti, street art, edgy, energetic, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'gradient',
        name: 'Modern & Gradasi',
        description: 'Menggunakan perpaduan warna gradasi yang halus untuk menciptakan efek 3D dan kesan modern. Cocok untuk: Startup, aplikasi mobile, brand teknologi.',
        promptTemplate: 'a modern 3D icon logo for "{{businessName}}", using vibrant color gradients and a subtle glassmorphism effect. Style: futuristic, clean, digital, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'hand_drawn',
        name: 'Ilustrasi Tangan',
        description: 'Memberi sentuhan personal dan artistik. Cocok untuk brand yang ingin menonjolkan kreativitas dan keunikan. Cocok untuk: Ilustrator, studio seni, produk custom.',
        promptTemplate: 'a charming and whimsical hand-drawn illustration logo for "{{businessName}}", with sketchy yet clean organic lines. Style: creative, artistic, personal touch, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'esports',
        name: 'E-sports / Gaming',
        description: 'Desain garang dan dinamis, seringkali menggunakan bentuk perisai, hewan buas, atau senjata. Cocok untuk: Tim e-sports, channel gaming, turnamen, atau brand yang menargetkan komunitas gamer.',
        promptTemplate: 'an aggressive and dynamic esports team logo for "{{businessName}}", featuring a fierce mascot like a dragon or wolf. Style: shield emblem, metallic sheen, neon glow effect, sharp vector lines, high contrast, detailed illustration, {{personaKeywords}}, solid white background.'
    },
    {
        id: 'gen_z',
        name: 'Gaya Gen Z / Y2K',
        description: 'Terinspirasi dari estetika tahun 2000-an (Y2K), gaya ini menggunakan warna-warna cerah, font yang unik, dan elemen desain yang fun. Cocok untuk: Brand fashion, thrift store, event, atau produk yang menyasar pasar Gen Z.',
        promptTemplate: 'a fun and trendy logo for "{{businessName}}", inspired by Y2K aesthetics and early 2000s internet culture. Style: glossy 3D letters, bubble font, chrome effect, iridescent colors, vibrant pinks and blues, {{personaKeywords}}, solid white background.'
    }
];

const LogoGenerator: React.FC<Props> = ({ persona, businessName, onComplete, onGoToDashboard }) => {
  const { profile, deductCredits, setShowOutOfCreditsModal } = useAuth();
  const credits = profile?.credits ?? 0;

  const [prompt, setPrompt] = useState('');
  const [logos, setLogos] = useState<string[]>([]); // Will now hold Base64 strings
  const [selectedLogoBase64, setSelectedLogoBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
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

    if (credits < INITIAL_LOGO_COST) {
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
      const results = await generateLogoOptions(prompt, 1);
      await deductCredits(INITIAL_LOGO_COST);
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

  const handleGenerateMore = useCallback(async () => {
    if (credits < ADDITIONAL_LOGO_COST) {
        setShowOutOfCreditsModal(true);
        playSound('error');
        return;
    }
    if (!prompt.trim()) return;

    setIsGeneratingMore(true);
    setError(null);
    playSound('start');

    try {
      const results = await generateLogoOptions(prompt, 3);
      await deductCredits(ADDITIONAL_LOGO_COST);
      setLogos(prev => [...prev, ...results]);
      playSound('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.';
      setError(errorMessage);
      playSound('error');
    } finally {
      setIsGeneratingMore(false);
    }
  }, [prompt, credits, deductCredits, setShowOutOfCreditsModal]);
  
  const handleContinue = () => {
    if (selectedLogoBase64) {
      onComplete({ allLogos: logos, logoBase64: selectedLogoBase64, prompt });
    }
  };
  
  const selectedStyleInfo = logoStyles.find(s => s.id === selectedStyleId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-400 mb-2">Langkah 2: Desain Logo Lo</h2>
        <p className="text-gray-400">Pilih gaya yang pas sama brand lo. Mang AI bakal kasih 1 pilihan dulu biar hemat. Lo juga bisa edit prompt-nya kalo mau.</p>
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
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt.trim() || credits < INITIAL_LOGO_COST}>
            Spill 1 Logo-nya, Mang AI! ({INITIAL_LOGO_COST} Kredit)
          </Button>
           <p className="text-xs text-gray-500 mt-2">Logo dibuat oleh AI. Lakukan pengecekan merek dagang sebelum dipakai untuk komersial.</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onGoToDashboard={onGoToDashboard} />}

      {logos.length > 0 && (
        <div ref={resultsRef} className="flex flex-col gap-6 items-center scroll-mt-24">
            <div>
              <h3 className="text-lg md:text-2xl font-bold mb-2">Pilih Logo Jagoan Lo:</h3>
            </div>
          <div className={`grid gap-4 w-full ${logos.length === 1 ? 'max-w-xs' : 'grid-cols-2 max-w-xl'}`}>
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
             {logos.length < 4 && (
                <Button onClick={handleGenerateMore} variant="secondary" isLoading={isGeneratingMore} disabled={isGeneratingMore || credits < ADDITIONAL_LOGO_COST}>
                    Kasih 3 Pilihan Lain! ({ADDITIONAL_LOGO_COST} Kredit)
                </Button>
             )}
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