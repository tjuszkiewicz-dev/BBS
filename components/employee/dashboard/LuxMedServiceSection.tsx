import React, { useState } from 'react';
import { Stethoscope, Heart, Brain, ShieldCheck, CheckCircle2, ArrowRight, Star, Users, Clock } from 'lucide-react';

interface LuxMedServiceSectionProps {
    onSelectPackage: (packageName: string, price: number) => void;
}

interface MedPackage {
    id: string;
    name: string;
    subtitle: string;
    price: number;
    priceLabel: string;
    color: string;
    accentColor: string;
    borderColor: string;
    icon: React.ReactNode;
    badge?: string;
    features: string[];
    extras?: string[];
    popular?: boolean;
}

const PACKAGES: MedPackage[] = [
    {
        id: 'LUXMED_CLASSIC',
        name: 'LuxMed Classic',
        subtitle: 'Podstawowa opieka medyczna',
        price: 89,
        priceLabel: 'miesięcznie',
        color: 'bg-white',
        accentColor: 'text-emerald-600',
        borderColor: 'border-slate-200',
        icon: <Stethoscope className="text-emerald-500" size={28} />,
        features: [
            'Lekarz pierwszego kontaktu',
            'Pediatra bez kolejki',
            'Internista i specjaliści',
            'Badania laboratoryjne podstawowe',
            'Recepty i zwolnienia online',
            'Infolinia medyczna 24/7',
        ],
    },
    {
        id: 'LUXMED_COMFORT',
        name: 'LuxMed Comfort',
        subtitle: 'Pełna opieka ambulatoryjna',
        price: 149,
        priceLabel: 'miesięcznie',
        color: 'bg-white',
        accentColor: 'text-bbs-600',
        borderColor: 'border-bbs-300',
        icon: <Heart className="text-bbs-500" size={28} />,
        badge: 'Najpopularniejszy',
        popular: true,
        features: [
            'Wszystko z pakietu Classic',
            'Kardiolog, dermatolog, ortopeda',
            'USG jamy brzusznej i tarczycy',
            'EKG i spirometria',
            'Badania laboratoryjne rozszerzone',
            'Teleporady z dowolnym specjalistą',
        ],
        extras: [
            'Mammografia raz w roku',
            'Stomatolog: przegląd + RTG',
        ],
    },
    {
        id: 'LUXMED_PREMIUM',
        name: 'LuxMed Premium',
        subtitle: 'Kompleksowa opieka VIP',
        price: 249,
        priceLabel: 'miesięcznie',
        color: 'bg-gradient-to-br from-bbs-900 to-bbs-700',
        accentColor: 'text-white',
        borderColor: 'border-bbs-600',
        icon: <Brain className="text-bbs-300" size={28} />,
        badge: 'VIP',
        features: [
            'Wszystko z pakietu Comfort',
            'Rezonans magnetyczny (MRI)',
            'Tomografia komputerowa (CT)',
            'Onkolog i endokrynolog',
            'Pakiet chirurgii jednego dnia',
            'Case Manager — osobisty koordynator',
        ],
        extras: [
            'Nielimitowane wizyty domowe',
            'Pakiet rehabilitacji (10 wizyt)',
            'Psycholog — 4 sesje w roku',
        ],
    },
];

export const LuxMedServiceSection: React.FC<LuxMedServiceSectionProps> = ({ onSelectPackage }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            {/* Header */}
            <div className="p-8 relative overflow-hidden" style={{background: 'linear-gradient(to right, #0e2f4e, #1e4050, #065f46)'}}>
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 blur-[60px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 p-2">
                            <img src="/luxmed.png" alt="LuxMed" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                            <Stethoscope className="text-emerald-600 hidden" size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Benefity pracownicze</span>
                                <span className="bg-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-white/20">Platforma BBS</span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                Pakiety <span className="text-emerald-300">LuxMed</span>
                            </h2>
                            <p className="text-white/75 text-sm mt-0.5">Prywatna opieka medyczna dla Ciebie i Twojej rodziny</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Users size={16} className="text-white/60" />
                                <span className="text-xl font-bold">2 mln+</span>
                            </div>
                            <span className="text-white/60 text-[11px] uppercase font-semibold tracking-wide">Pacjentów</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Clock size={16} className="text-white/60" />
                                <span className="text-xl font-bold">24/7</span>
                            </div>
                            <span className="text-white/60 text-[11px] uppercase font-semibold tracking-wide">Teleporady</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Star size={16} className="text-yellow-400" />
                                <span className="text-xl font-bold">4.8</span>
                            </div>
                            <span className="text-white/60 text-[11px] uppercase font-semibold tracking-wide">Ocena</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages grid */}
            <div className="bg-white p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PACKAGES.map((pkg) => {
                        const isDark = pkg.id === 'LUXMED_PREMIUM';
                        const isHovered = hoveredId === pkg.id;

                        return (
                            <div
                                key={pkg.id}
                                onMouseEnter={() => setHoveredId(pkg.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 ${isDark ? '' : pkg.color} ${isDark ? 'border-[#2e6475]' : pkg.borderColor} ${isHovered ? 'shadow-xl -translate-y-1' : 'shadow-sm'} ${pkg.popular ? 'ring-2 ring-[#64abbd] ring-offset-2' : ''}`}
                                style={isDark ? {background: 'linear-gradient(135deg, #0e2f4e 0%, #2e6475 100%)'} : {}}
                            >
                                {/* Popular badge */}
                                {pkg.badge && (
                                    <div
                                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap shadow text-white"
                                        style={{background: pkg.popular ? '#4a95a9' : '#0e2f4e'}}
                                    >
                                        {pkg.badge}
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col">
                                    {/* Package header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                            {pkg.icon}
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {pkg.price} <span className={`text-lg font-bold ${isDark ? 'text-white/60' : 'text-slate-400'}`}>pkt</span>
                                            </div>
                                            <div className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-slate-400'}`}>{pkg.priceLabel}</div>
                                        </div>
                                    </div>

                                    <h3 className={`text-xl font-extrabold mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{pkg.name}</h3>
                                    <p className={`text-sm mb-5 ${isDark ? 'text-white/75' : 'text-slate-500'}`}>{pkg.subtitle}</p>

                                    {/* Features */}
                                    <ul className="space-y-2.5 flex-1 mb-5">
                                        {pkg.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2.5">
                                                <CheckCircle2 size={15} className={isDark ? 'text-emerald-400 flex-shrink-0' : 'text-emerald-500 flex-shrink-0'} />
                                                <span className={`text-sm ${isDark ? 'text-white/90' : 'text-slate-600'}`}>{f}</span>
                                            </li>
                                        ))}
                                        {pkg.extras && pkg.extras.map((f, i) => (
                                            <li key={`e${i}`} className="flex items-center gap-2.5">
                                                <Star size={13} className={isDark ? 'text-yellow-300 flex-shrink-0' : 'text-yellow-500 flex-shrink-0'} />
                                                <span className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-slate-700'}`}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => onSelectPackage(pkg.name, pkg.price)}
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 ${!isDark && !pkg.popular ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'hover:opacity-90'}`}
                                        style={isDark
                                            ? {background: '#ffffff', color: '#0e2f4e'}
                                            : pkg.popular
                                                ? {background: '#3a7d8f', color: '#ffffff'}
                                                : {}}
                                    >
                                        <ShieldCheck size={16} />
                                        Wybierz pakiet
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    Pakiety medyczne są rozliczane miesięcznie z salda punktów BBS. Aktywacja w ciągu 24h roboczych. Zakup zależy od dostępności w ramach limitu Twojego pracodawcy.
                </p>
            </div>
        </div>
    );
};
