import React, { useState } from 'react';
import { ServiceItem } from '../../../types';
import { Wifi, Smartphone, Heart, ArrowRight, Zap, Globe, Shield } from 'lucide-react';

interface OrangeOfferSectionProps {
    services: ServiceItem[];
    onPurchase: (service: ServiceItem) => void;
}

type OrangeTab = 'ALL' | 'INTERNET' | 'ABONAMENT' | 'LOVE';

const SERVICE_META: Record<string, { category: string; badge?: string; highlight?: boolean; icon: React.ReactNode; specs: string[]; extras?: string[] }> = {
    'SRV-ORANGE-FIBER': {
        category: 'Internet domowy',
        badge: 'BESTSELLER',
        icon: <Wifi size={22} />,
        specs: ['do 600 Mb/s symetrycznie', 'Router Wi-Fi 6 w zestawie', 'Umowa na 24 miesiące'],
        extras: ['Brak limitu danych', 'Instalacja w 48h'],
    },
    'SRV-ORANGE-GSM': {
        category: 'Abonament komórkowy',
        highlight: true,
        icon: <Smartphone size={22} />,
        specs: ['100 GB internetu mobilnego', '5G Ready', 'Umowa na 24 miesiące'],
        extras: ['Rozmowy bez limitu', 'SMS/MMS bez limitu', 'Roaming UE', 'eSIM'],
    },
    'SRV-ORANGE-LOVE': {
        category: 'Pakiet rodzinny',
        badge: 'OSZCZĘDZASZ',
        icon: <Heart size={22} />,
        specs: ['Internet + komórka + TV', 'do 300 Mb/s', 'Umowa na 24 miesiące'],
        extras: ['Cała rodzina w planie', 'Orange TV w pakiecie'],
    },
};

export const OrangeOfferSection: React.FC<OrangeOfferSectionProps> = ({ services, onPurchase }) => {
    const [activeTab, setActiveTab] = useState<OrangeTab>('ALL');

    let orangeServices = services.filter(s => s.id.startsWith('SRV-ORANGE'));
    if (orangeServices.length === 0) {
        orangeServices = [
            { id: 'SRV-ORANGE-FIBER', name: 'Światłowód Pro 2.0', description: 'Super szybki internet światłowodowy do Twojego domu.', price: 59, type: 'SUBSCRIPTION' as any, icon: 'Wifi' as any, isActive: true },
            { id: 'SRV-ORANGE-GSM',   name: 'Plan Firmowy L',     description: 'Nielimitowane rozmowy i SMSy, duży pakiet danych.',       price: 45, type: 'SUBSCRIPTION' as any, icon: 'Smartphone' as any, isActive: true },
            { id: 'SRV-ORANGE-LOVE',  name: 'Orange Love Mini',   description: 'Pakiet usług dla całej rodziny w jednej cenie.',           price: 89, type: 'SUBSCRIPTION' as any, icon: 'Heart' as any, isActive: true },
        ];
    }

    const filteredServices = orangeServices.filter(s => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'INTERNET' && s.id.includes('FIBER')) return true;
        if (activeTab === 'ABONAMENT' && s.id.includes('GSM')) return true;
        if (activeTab === 'LOVE' && s.id.includes('LOVE')) return true;
        return false;
    });

    return (
        <div className="mb-8 font-sans">
            {/* ── HERO HEADER ─────────────────────────────────────── */}
            <div className="relative rounded-t-2xl overflow-hidden bg-[#FF6600]" style={{ minHeight: 180 }}>
                {/* Decorative circles */}
                <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute right-24 top-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -left-8 bottom-0 w-48 h-48 rounded-full bg-black/10 pointer-events-none" />

                <div className="relative z-10 px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Brand block */}
                    <div className="flex items-center gap-5">
                        {/* Orange wordmark box */}
                        <div className="bg-white rounded-xl px-5 py-3 shadow-lg flex items-center gap-2 shrink-0">
                            <div className="w-4 h-4 rounded-full bg-[#FF6600]" />
                            <span className="text-[#FF6600] font-black text-xl tracking-tight leading-none">orange</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-black text-2xl md:text-3xl leading-none tracking-tight">Oferta dla pracowników</span>
                            </div>
                            <p className="text-white/80 text-sm font-medium">
                                Ekskluzywne warunki negocjowane specjalnie dla Twojej firmy
                            </p>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="flex items-center gap-6 shrink-0">
                        <div className="text-center">
                            <div className="text-white font-black text-xl leading-none">do&nbsp;40%</div>
                            <div className="text-white/70 text-xs mt-1">taniej niż cennik</div>
                        </div>
                        <div className="w-px h-10 bg-white/30" />
                        <div className="text-center">
                            <div className="text-white font-black text-xl leading-none">24/7</div>
                            <div className="text-white/70 text-xs mt-1">wsparcie klienta</div>
                        </div>
                        <div className="w-px h-10 bg-white/30" />
                        <div className="flex flex-col items-center">
                            <span className="bg-white text-[#FF6600] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Exclusive</span>
                        </div>
                    </div>
                </div>

                {/* Bottom wave */}
                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 28" fill="none" preserveAspectRatio="none" style={{ height: 28 }}>
                    <path d="M0 28 L0 14 Q360 0 720 14 Q1080 28 1440 14 L1440 28 Z" fill="white" />
                </svg>
            </div>

            {/* ── CONTENT AREA ────────────────────────────────────── */}
            <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-sm px-8 pt-6 pb-8">
                {/* Tabs */}
                <div className="flex gap-1 mb-7 bg-slate-100 rounded-xl p-1 w-fit">
                    {([
                        { id: 'ALL',       label: 'Wszystkie' },
                        { id: 'INTERNET',  label: 'Internet' },
                        { id: 'ABONAMENT', label: 'Abonamenty' },
                        { id: 'LOVE',      label: 'Pakiety Love' },
                    ] as { id: OrangeTab; label: string }[]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-white text-[#FF6600] shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {filteredServices.map(service => {
                        const meta = SERVICE_META[service.id] ?? {
                            category: 'Usługa', icon: <Globe size={22} />, specs: [], extras: [],
                        };
                        const isHighlighted = meta.highlight;

                        return (
                            <div
                                key={service.id}
                                className={`group relative flex flex-col rounded-2xl transition-all duration-300 overflow-hidden ${
                                    isHighlighted
                                        ? 'shadow-[0_8px_40px_-8px_rgba(255,102,0,0.35)] border-2 border-[#FF6600] scale-[1.02]'
                                        : 'border border-slate-200 hover:border-[#FF6600]/60 hover:shadow-[0_8px_32px_-8px_rgba(255,102,0,0.2)] hover:-translate-y-1'
                                }`}
                            >
                                {/* Highlighted badge ribbon */}
                                {isHighlighted && (
                                    <div className="bg-[#FF6600] text-white text-[10px] font-black tracking-widest uppercase text-center py-1.5 px-4">
                                        ★ Najpopularniejszy wybór
                                    </div>
                                )}

                                <div className={`flex-1 flex flex-col p-6 ${isHighlighted ? 'bg-white' : 'bg-white'}`}>
                                    {/* Card top */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meta.category}</span>
                                            <h3 className={`text-xl font-black mt-0.5 leading-tight ${isHighlighted ? 'text-[#FF6600]' : 'text-slate-900'}`}>
                                                {service.name}
                                            </h3>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3 ${
                                            isHighlighted ? 'bg-[#FF6600] text-white' : 'bg-orange-50 text-[#FF6600]'
                                        }`}>
                                            {meta.icon}
                                        </div>
                                    </div>

                                    {/* Optional badge */}
                                    {meta.badge && (
                                        <span className="self-start text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-orange-50 text-[#FF6600] border border-orange-200 mb-4">
                                            {meta.badge}
                                        </span>
                                    )}

                                    {/* Description */}
                                    <p className="text-slate-500 text-sm leading-relaxed mb-5">{service.description}</p>

                                    {/* Specs */}
                                    <ul className="space-y-2.5 mb-5 flex-1">
                                        {meta.specs.map((spec, i) => (
                                            <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isHighlighted ? 'bg-[#FF6600]' : 'bg-slate-400'}`} />
                                                <span className="font-medium">{spec}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Extras chips */}
                                    {meta.extras && meta.extras.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-5">
                                            {meta.extras.map((e, i) => (
                                                <span key={i} className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                                    {e}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="h-px bg-slate-100 mb-5" />

                                    {/* Price row */}
                                    <div className="flex items-end justify-between mb-4">
                                        <div>
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Miesięcznie</div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-slate-900 leading-none">{service.price}</span>
                                                <span className="text-lg font-bold text-[#FF6600] leading-none">pkt</span>
                                            </div>
                                        </div>
                                        {isHighlighted && (
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400 line-through">99 pkt</div>
                                                <div className="text-xs font-bold text-emerald-600">Oszczędzasz 54 pkt</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA */}
                                    <button
                                        onClick={() => onPurchase(service)}
                                        className={`w-full flex items-center justify-between font-black text-sm uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all duration-200 ${
                                            isHighlighted
                                                ? 'bg-[#FF6600] text-white hover:bg-[#e05500] shadow-lg shadow-orange-500/30'
                                                : 'bg-slate-900 text-white hover:bg-[#FF6600]'
                                        }`}
                                    >
                                        <span>Wybieram</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                    <Shield size={14} />
                    <span>Oferta dostępna wyłącznie dla pracowników firm posiadających umowę korporacyjną z Orange Polska S.A. Ceny podane w punktach benefitowych.</span>
                </div>
            </div>
        </div>
    );
};
