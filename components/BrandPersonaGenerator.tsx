import React, { useState, useCallback } from 'react';
import { generateBrandPersona, generateSlogans } from '../services/geminiService';
import type { BrandPersona, BrandInputs } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Spinner from './common/Spinner';
import Card from './common/Card';

interface Props {
  initialData?: BrandInputs;
  onComplete: (data: { inputs: BrandInputs; selectedPersona: BrandPersona; selectedSlogan: string }) => void;
}

const BrandPersonaGenerator: React.FC<Props> = ({ onComplete, initialData }) => {
  const [formData, setFormData] = useState<BrandInputs>(initialData || {
    businessName: 'Kopi Senja',
    industry: 'Minuman Kopi',
    targetAudience: 'Mahasiswa dan pekerja muda usia 18-28 tahun',
    valueProposition: 'Tempat yang nyaman untuk bekerja dan bersantai dengan harga terjangkau.',
    competitors: 'Starbucks, Kopi Kenangan',
  });
  const [personas, setPersonas] = useState<BrandPersona[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState<number | null>(null);
  const [selectedSlogan, setSelectedSlogan] = useState<string | null>(null);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);
  const [isLoadingSlogan, setIsLoadingSlogan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePersona = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPersona(true);
    setError(null);
    setPersonas([]);
    setSlogans([]);
    setSelectedPersonaIndex(null);
    setSelectedSlogan(null);

    try {
      const result = await generateBrandPersona(
        formData.businessName,
        formData.industry,
        formData.targetAudience,
        formData.valueProposition
      );
      setPersonas(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang nggak diketahui.');
    } finally {
      setIsLoadingPersona(false);
    }
  }, [formData]);
  
  const handleSelectPersona = async (index: number) => {
      setSelectedPersonaIndex(index);
      setSelectedSlogan(null);
      setSlogans([]);
      setIsLoadingSlogan(true);
      setError(null);
      try {
          const result = await generateSlogans(formData.businessName, personas[index], formData.competitors);
          setSlogans(result);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Gagal generate slogan.');
      } finally {
          setIsLoadingSlogan(false);
      }
  };

  const handleContinue = () => {
    if (selectedPersonaIndex !== null && selectedSlogan && personas[selectedPersonaIndex]) {
      onComplete({
        inputs: formData,
        selectedPersona: personas[selectedPersonaIndex],
        selectedSlogan: selectedSlogan,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Langkah 1: Fondasi Brand Lo</h2>
        <p className="text-gray-400">Ceritain bisnismu. AI akan meracik persona, target avatar, gaya bicara, sampai slogan yang paling pas.</p>
      </div>

      <form onSubmit={handleGeneratePersona} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
        <Input label="Nama Bisnis" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="cth: Kopi Senja" />
        <Input label="Industri / Bidang Usaha" name="industry" value={formData.industry} onChange={handleChange} placeholder="cth: F&B, Fashion" />
        <Textarea label="Target Pasar" name="targetAudience" value={formData.targetAudience} onChange={handleChange} placeholder="cth: Anak muda, keluarga" rows={3} />
        <Textarea label="Yang Bikin Beda (Value Proposition)" name="valueProposition" value={formData.valueProposition} onChange={handleChange} placeholder="cth: Organik, murah, mewah" rows={3} />
        <Textarea className="md:col-span-2" label="Sebutin 1-2 Kompetitor" name="competitors" value={formData.competitors} onChange={handleChange} placeholder="cth: Starbucks, Janji Jiwa" rows={2} />
        <div className="md:col-span-2">
          <Button type="submit" disabled={isLoadingPersona}>
            {isLoadingPersona ? <><Spinner /> Lagi Mikir Keras...</> : 'Generate Persona Brand'}
          </Button>
        </div>
      </form>

      {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}

      {personas.length > 0 && (
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Pilih Persona Brand Lo:</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {personas.map((persona, index) => (
              <Card 
                key={index} 
                title={persona.nama_persona}
                onClick={() => handleSelectPersona(index)}
                isSelected={selectedPersonaIndex === index}
              >
                <p className="text-gray-300 mb-4 h-20 overflow-auto">{persona.deskripsi_singkat}</p>
                
                {/* Tampilkan detail baru jika terpilih */}
                {selectedPersonaIndex === index && (
                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-gray-700">
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">Avatar Pelanggan:</h4>
                            {persona.customer_avatars.map((avatar, i) => (
                                <div key={i} className="text-xs p-2 bg-gray-700/50 rounded-md mb-2">
                                    <strong>{avatar.nama_avatar}:</strong> {avatar.deskripsi_demografis}. Aktif di {avatar.media_sosial.join(', ')}.
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">Gaya Bicara:</h4>
                            <p className="text-xs text-gray-400"><strong>Gunakan:</strong> {persona.brand_voice.kata_yang_digunakan.join(', ')}</p>
                            <p className="text-xs text-gray-400"><strong>Hindari:</strong> {persona.brand_voice.kata_yang_dihindari.join(', ')}</p>
                        </div>
                        <div>
                           <h4 className="font-semibold text-gray-200 mb-2">Palet Warna:</h4>
                           <div className="flex items-center gap-3">
                            {persona.palet_warna_hex.map((hex, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-500" style={{ backgroundColor: hex }}></div>
                            ))}
                           </div>
                        </div>
                    </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {isLoadingSlogan && <div className="flex items-center justify-center gap-2 text-gray-400"><Spinner/> Membuat slogan...</div>}

      {slogans.length > 0 && (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold mb-2">Pilih Slogan Andalan Lo:</h3>
            <div className="flex flex-wrap gap-3">
                {slogans.map((slogan, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedSlogan(slogan)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                            selectedSlogan === slogan
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {slogan}
                    </button>
                ))}
            </div>
        </div>
      )}

      {(selectedPersonaIndex !== null && selectedSlogan) && (
        <div className="self-center mt-4">
            <Button onClick={handleContinue}>
              Mantap, Lanjut Bikin Logo &rarr;
            </Button>
        </div>
      )}
    </div>
  );
};

export default BrandPersonaGenerator;
