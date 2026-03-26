import React, { useState } from 'react';
import { Car, Home, Plane, Stethoscope, GraduationCap, ArrowRight, CheckCircle2, Shield, Users, Award } from 'lucide-react';

interface PZUServiceSectionProps {
    onCheckOffer: (category: string) => void;
}

type PZUTab = 'OC_AC' | 'DOM' | 'PODROZE' | 'ZDROWIE' | 'EDUKACJA';

const PZU_RED = '#C8102E';
const PZU_LIGHT = '#FBEAEA';

interface TabMeta {
    id: PZUTab;
    label: string;
    icon: React.ReactNode;
    accentColor: string;
    image: string;
    hero: string;
    heroSub: string;
    features: string[];
    priceFrom: number;
    cta: string;
    ctaUrl?: string;
    badgeText?: string;
}

const TABS: TabMeta[] = [
    {
        id: 'OC_AC',
        label: 'OC / AC',
        icon: <Car size={18} />,
        accentColor: PZU_RED,
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=900',
        hero: 'Ubezpieczenie samochodu OC/AC',
        heroSub: 'Kompleksowa ochrona pojazdu z asystą drogową przez całą dobę.',
        features: [
            'OC — obowiązkowe ubezpieczenie komunikacyjne',
            'AC — ochrona własnego pojazdu od szkód',
            'Assistance Comfort: pomoc 24/7 w trasie',
            'NNW kierowcy i pasażerów',
            'Szyby — wymiana bez udziału własnego',
            'Zniżka do 30% dla pracowników objętych BBS',
        ],
        priceFrom: 38,
        cta: 'Oblicz składkę',
        ctaUrl: 'https://moje.pzu.pl/pzu/motor-survey',
        badgeText: 'Nr 1 w Polsce',
    },
    {
        id: 'DOM',
        label: 'Dom i Mieszkanie',
        icon: <Home size={18} />,
        accentColor: '#1e40af',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=900',
        hero: 'Ubezpiecz swój dom lub mieszkanie',
        heroSub: 'Ochrona mienia, odpowiedzialność cywilna i assistance mieszkaniowy.',
        features: [
            'Mury i stała zabudowa od zdarzeń losowych',
            'Wyposażenie: zalanie, pożar, kradzież',
            'OC w życiu prywatnym',
            'Assistance mieszkaniowy — hydraulik, elektryk 24/7',
            'Ubezpieczenie domku letniskowego w pakiecie',
            'Zniżka pracownicza do 25%',
        ],
        priceFrom: 25,
        cta: 'Sprawdź ofertę',
        ctaUrl: 'https://moje.pzu.pl/pzu/property-survey?cna=house',
    },
    {
        id: 'PODROZE',
        label: 'Podróże',
        icon: <Plane size={18} />,
        accentColor: '#0369a1',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=900',
        hero: 'PZU Wojażer — bezpieczne podróże',
        heroSub: 'Ochrona kosztów leczenia i assistance za granicą przez cały rok.',
        features: [
            'Koszty leczenia i hospitalizacji za granicą',
            'Assistance: transport medyczny, repatriacja',
            'Bagaż i dokumenty — kradzież i zagubienie',
            'OC w podróży zagranicznej',
            'Opóźnienie i odwołanie lotu',
            'Wersja roczna — bez limitu podróży',
        ],
        priceFrom: 12,
        cta: 'Sprawdź ofertę',
        ctaUrl: 'https://moje.pzu.pl/pzu/travel/policy-details',
    },
    {
        id: 'ZDROWIE',
        label: 'Zdrowie',
        icon: <Stethoscope size={18} />,
        accentColor: '#047857',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=900',
        hero: 'PZU Zdrowie — prywatna opieka medyczna',
        heroSub: 'Szybki dostęp do specjalistów bez kolejki. Wygoda i bezpieczeństwo zdrowotne.',
        features: [
            'Konsultacje lekarskie online 24/7',
            'Specjaliści bez skierowania',
            'Badania diagnostyczne i laboratoria',
            'Pakiet stomatologiczny — przegląd + leczenie',
            'Teleporady z pediatrą dla dzieci',
            'Pakiet onkologiczny w wyższych wariantach',
        ],
        priceFrom: 69,
        cta: 'Sprawdź pakiety',
        ctaUrl: 'https://moje.pzu.pl/sales/package-subscription/list',
        badgeText: 'Popularne',
    },
    {
        id: 'EDUKACJA',
        label: 'Edukacja',
        icon: <GraduationCap size={18} />,
        accentColor: '#7c3aed',
        image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=900',
        hero: 'NNW Szkolne i studenckie',
        heroSub: 'Ochrona na wypadek nieszczęśliwych wypadków dzieci i młodzieży uczącej się.',
        features: [
            'Trwały uszczerbek na zdrowiu (NNW)',
            'Śmierć ubezpieczonego w wyniku NNW',
            'Koszty leczenia po wypadku',
            'Assistance medyczny — transport do szpitala',
            'Ochrona podczas zajęć sportowych i wycieczek',
            'Możliwość objęcia współmałżonka pracownika',
        ],
        priceFrom: 9,
        cta: 'Sprawdź ofertę',
        ctaUrl: 'https://moje.pzu.pl/sales/generic/education',
    },
];

export const PZUServiceSection: React.FC<PZUServiceSectionProps> = ({ onCheckOffer }) => {
    const [activeTab, setActiveTab] = useState<PZUTab>('OC_AC');
    const [plateInput, setPlateInput] = useState('');

    const tab = TABS.find(t => t.id === activeTab)!;

    return (
        <div className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">

            {/* HERO HEADER */}
            <div className="relative p-8 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b2e 55%, #1e0a10 100%)' }}>
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(200,16,46,0.25) 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />
                <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(200,16,46,0.1) 0%, transparent 70%)', transform: 'translate(-30%, 40%)' }} />
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: 'linear-gradient(to bottom, #C8102E, #8B0000)' }} />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-4">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 p-2">
                            <img
                                src="https://www.pbd.org.pl/wp-content/uploads/2019/02/pzu.png"
                                alt="PZU"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.classList.remove('hidden');
                                }}
                            />
                            <Shield className="hidden" size={32} style={{ color: PZU_RED }} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: PZU_RED }}>
                                    Benefity pracownicze
                                </span>
                                <span className="text-white/60 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-white/20">
                                    Platforma BBS
                                </span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                Ubezpieczenia <span style={{ color: '#f87171' }}>PZU</span>
                            </h2>
                            <p className="text-white/60 text-sm mt-0.5">Specjalne zniżki pracownicze — do 40% taniej niż w cenniku</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Users size={16} className="text-white/50" />
                                <span className="text-xl font-bold">16 mln+</span>
                            </div>
                            <span className="text-white/50 text-[11px] uppercase font-semibold tracking-wide">Klientów</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="flex items-center gap-1.5 text-white">
                                <Award size={16} className="text-white/50" />
                                <span className="text-xl font-bold">100+</span>
                            </div>
                            <span className="text-white/50 text-[11px] uppercase font-semibold tracking-wide">Lat tradycji</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <div className="text-xl font-bold text-white">do 40%</div>
                            <span className="text-white/50 text-[11px] uppercase font-semibold tracking-wide">Taniej</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="bg-white px-6 md:px-8 pt-6 pb-8">

                {/* Pill tabs */}
                <div className="flex gap-1.5 mb-7 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap"
                            style={activeTab === t.id
                                ? { background: t.accentColor, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }
                                : { color: '#64748b' }
                            }
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Active tab offer card */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row min-h-[280px]">

                    {/* Left: offer info */}
                    <div className="flex-1 p-7 flex flex-col justify-between">
                        <div>
                            {tab.badgeText && (
                                <span className="inline-block text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full mb-3"
                                    style={{ background: PZU_LIGHT, color: PZU_RED, border: `1px solid ${PZU_RED}40` }}>
                                    ★ {tab.badgeText}
                                </span>
                            )}
                            <h3 className="text-2xl font-extrabold text-slate-800 mb-1">{tab.hero}</h3>
                            <p className="text-slate-500 text-sm mb-5 leading-relaxed">{tab.heroSub}</p>

                            <ul className="space-y-2 mb-6">
                                {tab.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                                        <CheckCircle2 size={15} className="flex-shrink-0" style={{ color: tab.accentColor }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA block */}
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                            <div>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cena pracownicza od</span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="text-4xl font-black text-slate-800">{tab.priceFrom}</span>
                                    <span className="text-lg font-bold text-slate-400">pkt</span>
                                    <span className="text-sm text-slate-400 ml-1">/ miesiąc</span>
                                </div>
                            </div>

                            <div className="flex gap-3 flex-wrap items-center">
                                {activeTab === 'OC_AC' && (
                                    <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="np. KR 12345"
                                            value={plateInput}
                                            onChange={e => setPlateInput(e.target.value.toUpperCase())}
                                            maxLength={10}
                                            className="bg-transparent text-slate-800 font-bold text-sm uppercase w-28 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                                        />
                                        <button
                                            onClick={() => tab.ctaUrl ? window.open(tab.ctaUrl, '_blank') : onCheckOffer(tab.id)}
                                            className="text-white text-xs font-bold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
                                            style={{ background: '#ca8a04' }}
                                        >
                                            OBLICZ SKŁADKĘ
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => tab.ctaUrl ? window.open(tab.ctaUrl, '_blank') : onCheckOffer(tab.id)}
                                    className="flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:opacity-90 shadow-md"
                                    style={{ background: tab.accentColor }}
                                >
                                    {tab.cta}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: category image */}
                    <div className="hidden md:block relative w-[360px] shrink-0 overflow-hidden">
                        <img
                            src={tab.image}
                            alt={tab.label}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.55) 0%, transparent 40%)' }} />
                    </div>
                </div>

                {/* QUICK PICK TILES */}
                <h4 className="font-bold text-slate-500 mb-4 text-xs uppercase tracking-widest">Szybki wybór kategorii</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {TABS.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className="relative group flex flex-col items-start p-4 rounded-2xl transition-all duration-200 text-left overflow-hidden"
                                style={isActive
                                    ? { border: `2px solid ${t.accentColor}`, background: `${t.accentColor}12` }
                                    : { border: '2px solid #e2e8f0', background: '#fff' }
                                }
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                                    style={{ background: isActive ? t.accentColor : '#f1f5f9', color: isActive ? '#fff' : t.accentColor }}
                                >
                                    {t.icon}
                                </div>
                                <span className="font-bold text-slate-800 text-sm leading-tight">{t.label}</span>
                                {isActive && (
                                    <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full" style={{ background: t.accentColor }} />
                                )}
                            </button>
                        );
                    })}
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Ubezpieczenia PZU oferowane są na warunkach grupowego zakupu pracowniczego. Ceny poglądowe — ostateczna oferta zależy od danych pojazdu/nieruchomości. Zakup wymaga akceptacji OWU PZU SA.
                </p>
            </div>
        </div>
    );
};
