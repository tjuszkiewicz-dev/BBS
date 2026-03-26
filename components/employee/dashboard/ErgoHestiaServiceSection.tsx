import React, { useState } from 'react';
import { Shield, Heart, Star, CheckCircle2, ArrowRight, ShieldCheck, Users, Award, Zap } from 'lucide-react';

interface ErgoHestiaServiceSectionProps {
    onSelectPackage: (packageName: string, price: number) => void;
}

interface HestiaPackage {
    id: string;
    name: string;
    subtitle: string;
    price: number;
    priceLabel: string;
    isDark?: boolean;
    popular?: boolean;
    badge?: string;
    icon: React.ReactNode;
    features: string[];
    extras?: string[];
}

const PACKAGES: HestiaPackage[] = [
    {
        id: 'HESTIA_KOMFORT',
        name: 'Ochrona Komfort',
        subtitle: 'Solidna ochrona życiowa',
        price: 45,
        priceLabel: 'miesięcznie',
        icon: <Shield className="text-red-500" size={28} />,
        features: [
            'Śmierć ubezpieczonego',
            'NNW — trwały uszczerbek na zdrowiu',
            'Assistance medyczny 24/7',
            'Teleporada lekarska online',
            'Renta rodzinna po zgonie',
        ],
    },
    {
        id: 'HESTIA_OPTIMUM',
        name: 'Ochrona Optimum',
        subtitle: 'Pełna ochrona z chorób i wypadków',
        price: 89,
        priceLabel: 'miesięcznie',
        popular: true,
        badge: 'Bestseller',
        icon: <Heart className="text-red-600" size={28} />,
        features: [
            'Wszystko z pakietu Komfort',
            'Poważne zachorowania (30 jednostek)',
            'Pobyt w szpitalu — dzienny zasiłek',
            'Leczenie operacyjne',
            'Rozszerzony pakiet NNW',
        ],
        extras: [
            'Pakiet onkologiczny podstawowy',
            'Rehabilitacja po wypadku',
        ],
    },
    {
        id: 'HESTIA_PREMIUM',
        name: 'Ochrona Premium 360°',
        subtitle: 'Kompleksowa ochrona VIP',
        price: 149,
        priceLabel: 'miesięcznie',
        isDark: true,
        badge: 'VIP',
        icon: <Star className="text-yellow-300" size={28} />,
        features: [
            'Wszystko z pakietu Optimum',
            'Ubezpieczenie partnera/małżonka',
            'Renta inwalidyzacyjna',
            'Onkologia — pełen pakiet leczenia',
            'Wsparcie psychologiczne (6 sesji)',
        ],
        extras: [
            'Wczesne wykrycie nowotworów',
            'Pakiet rehabilitacji (12 wizyt)',
        ],
    },
];

export const ErgoHestiaServiceSection: React.FC<ErgoHestiaServiceSectionProps> = ({ onSelectPackage }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            {/* Header */}
            <div className="p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #8b0010 0%, #c0001a 50%, #e3001b 100%)' }}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none blur-[100px]" style={{ background: 'rgba(255,100,50,0.2)', transform: 'translate(30%, -40%)' }} />
                <div className="absolute bottom-0 left-1/4 w-60 h-60 rounded-full pointer-events-none blur-[70px]" style={{ background: 'rgba(255,255,255,0.05)' }} />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 p-2">
                            <img
                                src="/ergohestia.png"
                                alt="ERGO Hestia"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.classList.remove('hidden');
                                }}
                            />
                            <Shield className="text-red-600 hidden" size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-white text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Benefity pracownicze</span>
                                <span className="text-white/60 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-white/25">Platforma BBS</span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                Pakiety <span className="text-red-200">ERGO Hestia</span>
                            </h2>
                            <p className="text-white/75 text-sm mt-0.5">Grupowe ubezpieczenia na życie i zdrowie dla Twojego zespołu</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Users size={16} className="text-white/60" />
                                <span className="text-xl font-bold">6 mln+</span>
                            </div>
                            <span className="text-white/60 text-[11px] uppercase font-semibold tracking-wide">Klientów</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Award size={16} className="text-white/60" />
                                <span className="text-xl font-bold">#1</span>
                            </div>
                            <span className="text-white/60 text-[11px] uppercase font-semibold tracking-wide">w Polsce</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Zap size={16} className="text-yellow-300" />
                                <span className="text-xl font-bold">24h</span>
                            </div>
                            <span className="text-white/60 text-[11px] uppercase font-semibold tracking-wide">Wypłata</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages grid */}
            <div className="bg-white p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PACKAGES.map((pkg) => {
                        const isHovered = hoveredId === pkg.id;
                        return (
                            <div
                                key={pkg.id}
                                onMouseEnter={() => setHoveredId(pkg.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 ${
                                    pkg.isDark ? 'border-red-800' : pkg.popular ? 'border-red-400 ring-2 ring-red-300 ring-offset-2' : 'border-slate-200'
                                } ${isHovered ? 'shadow-xl -translate-y-1' : 'shadow-sm'}`}
                                style={pkg.isDark ? { background: 'linear-gradient(135deg, #8b0010 0%, #c0001a 100%)' } : { background: '#ffffff' }}
                            >
                                {/* Badge */}
                                {pkg.badge && (
                                    <div
                                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap shadow text-white"
                                        style={{ background: pkg.isDark ? '#8b0010' : '#c0001a' }}
                                    >
                                        {pkg.badge}
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col">
                                    {/* Package header row */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-2.5 rounded-xl ${pkg.isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                            {pkg.icon}
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-3xl font-black ${pkg.isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {pkg.price}{' '}
                                                <span className={`text-lg font-bold ${pkg.isDark ? 'text-white/60' : 'text-slate-400'}`}>pkt</span>
                                            </div>
                                            <div className={`text-xs font-semibold ${pkg.isDark ? 'text-white/60' : 'text-slate-400'}`}>{pkg.priceLabel}</div>
                                        </div>
                                    </div>

                                    <h3 className={`text-xl font-extrabold mb-0.5 ${pkg.isDark ? 'text-white' : 'text-slate-800'}`}>{pkg.name}</h3>
                                    <p className={`text-sm mb-5 ${pkg.isDark ? 'text-white/75' : 'text-slate-500'}`}>{pkg.subtitle}</p>

                                    {/* Features */}
                                    <ul className="space-y-2.5 flex-1 mb-5">
                                        {pkg.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2.5">
                                                <CheckCircle2 size={15} className={`flex-shrink-0 ${pkg.isDark ? 'text-red-300' : 'text-red-500'}`} />
                                                <span className={`text-sm ${pkg.isDark ? 'text-white/90' : 'text-slate-600'}`}>{f}</span>
                                            </li>
                                        ))}
                                        {pkg.extras?.map((f, i) => (
                                            <li key={`e${i}`} className="flex items-center gap-2.5">
                                                <Star size={13} className={`flex-shrink-0 ${pkg.isDark ? 'text-yellow-300' : 'text-yellow-500'}`} />
                                                <span className={`text-sm font-medium ${pkg.isDark ? 'text-white/90' : 'text-slate-700'}`}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => onSelectPackage(pkg.name, pkg.price)}
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 hover:opacity-90 ${
                                            !pkg.isDark && !pkg.popular ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : ''
                                        }`}
                                        style={
                                            pkg.isDark
                                                ? { background: '#ffffff', color: '#8b0010' }
                                                : pkg.popular
                                                    ? { background: '#c0001a', color: '#ffffff' }
                                                    : {}
                                        }
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
                    Pakiety ubezpieczeniowe rozliczane miesięcznie z salda BBS. Aktywy w ciągu 2 dni roboczych. Zakup wymaga akceptacji warunków ERGO Hestia SA.
                </p>
            </div>
        </div>
    );
};
