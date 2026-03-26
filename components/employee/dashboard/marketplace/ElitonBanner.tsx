// Placeholder component for BBS Exclusive banner
import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';

export const ElitonBanner = () => {
  return (
    <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-end md:items-center justify-between gap-8 mt-16 mb-24" style={{background: 'linear-gradient(to right, #0e2f4e, #2e6475)'}}>
       {/* Background gradient/glow effect */}
       <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-400/20 blur-[100px] pointer-events-none"></div>

       <div className="z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-4">
             <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">Już wkrótce</span>
             <span className="text-white/60 text-[10px] uppercase tracking-wider font-mono">Q3 2026</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
             Przygotuj się na <span className="text-orange-300">BBS Exclusive.</span>
          </h2>
          
          <p className="text-white/80 text-sm leading-relaxed max-w-md">
             Nasz apetyt rośnie razem z Twoimi potrzebami. Wkrótce otwieramy drzwi do świata <strong>VIP Concierge</strong> we współpracy z globalnym partnerem. Bilety na wyprzedane koncerty i ekskluzywne zniżki na elektronikę.
          </p>
       </div>

       <div className="z-10 w-full md:w-auto">
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer group">
             <div className="w-10 h-10 rounded-lg bg-orange-400/30 flex items-center justify-center text-orange-300">
                <Lock className="w-5 h-5" />
             </div>
             <div>
                <span className="block text-[10px] text-white/60 uppercase font-bold tracking-wider mb-0.5">Wczesny dostęp</span>
                <span className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">Dołącz do listy oczekującej</span>
             </div>
             <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors ml-2" />
          </div>
       </div>
    </div>
  );
};

