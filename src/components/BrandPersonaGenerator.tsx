// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { useUserActions } from '../contexts/UserActionsContext';
import { BrandInputs } from '../types';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Button from './common/Button';

const BrandPersonaGenerator: React.FC = () => {
    const { lastVoiceConsultationResult, setLastVoiceConsultationResult } = useUserActions();
    const [brandInputs, setBrandInputs] = useState<Partial<BrandInputs>>({
        businessName: '',
        industry: '',
        targetAudience: '',
        valueProposition: '',
        competitorAnalysis: '',
        businessDetail: '',
    });

    useEffect(() => {
        if (lastVoiceConsultationResult) {
            setBrandInputs(prev => ({ ...prev, ...lastVoiceConsultationResult }));
            // Clear the result from context so it doesn't trigger again on re-render
            setLastVoiceConsultationResult(null); 
        }
    }, [lastVoiceConsultationResult, setLastVoiceConsultationResult]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBrandInputs(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="p-4 bg-surface rounded-lg">
            <h3 className="font-bold text-text-header mb-4 text-lg">1. Detail Brand Anda</h3>
            <div className="space-y-4">
                 <Input 
                    label="Nama Bisnis / Brand" 
                    name="businessName" 
                    value={brandInputs.businessName || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Kopi Senja"
                />
                 <Input 
                    label="Industri / Bidang Usaha" 
                    name="industry" 
                    value={brandInputs.industry || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Kedai Kopi, Fashion, Jasa Digital"
                />
                 <Textarea 
                    label="Target Audiens" 
                    name="targetAudience"
                    value={brandInputs.targetAudience || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Mahasiswa dan pekerja kantoran, usia 18-30 tahun, suka tempat nongkrong yang nyaman"
                    rows={3}
                />
                <Textarea 
                    label="Keunggulan / Value Proposition" 
                    name="valueProposition" 
                    value={brandInputs.valueProposition || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Biji kopi asli Indonesia, harga terjangkau, suasana yang homey"
                    rows={3}
                />

                <Button className="w-full" variant="primary">
                    Lanjut ke Pembuatan Persona
                </Button>
            </div>
        </div>
    );
};

export default BrandPersonaGenerator;
