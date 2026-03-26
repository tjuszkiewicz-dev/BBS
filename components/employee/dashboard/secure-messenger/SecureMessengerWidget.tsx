import React, { useState } from 'react';
import { Lock, Shield, ArrowRight, ShoppingCart } from 'lucide-react';
import { SecureMessengerApp } from './SecureMessengerApp';
import { ServiceItem } from '../../../../types';

interface Props {
  hasAccess?: boolean;
  onPurchase?: () => void;
  price?: number;
}

export const SecureMessengerWidget: React.FC<Props> = ({ hasAccess = true, onPurchase, price = 200 }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (hasAccess) {
      setIsOpen(true);
    } else if (onPurchase) {
      onPurchase();
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative overflow-hidden rounded-3xl cursor-pointer group transition-all duration-300 hover:shadow-lg col-span-1 border h-full min-h-[180px] ${
          hasAccess 
            ? 'border-slate-700/50 text-white' 
            : 'bg-white border-dashed border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
        }`}
      >
        {hasAccess ? (
          <>
            {/* Background Image & Overlay */}
             <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000)' }}></div>
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] group-hover:bg-slate-900/70 transition-colors"></div>

            <div className="relative p-6 h-full flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase animate-pulse">
                    Enterprise Security
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Secure Messenger
                </h3>
                <p className="text-slate-400 text-sm max-w-[80%] leading-relaxed">
                  Szyfrowana komunikacja end-to-end. Prywatne czaty i samoniszczące się notatki.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-white shadow-sm z-20">
                      <Shield size={14} />
                   </div>
                   <div className="w-8 h-8 rounded-full bg-emerald-900/50 border-2 border-slate-800 flex items-center justify-center text-xs text-emerald-400 shadow-sm z-10">
                      <Lock size={14} />
                   </div>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-lg border border-white/10 group-hover:border-emerald-400 transform group-hover:translate-x-1">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Decorative Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
          </>
        ) : (
          <div className="relative p-5 h-full flex flex-col justify-between z-10">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform shadow-sm flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2 leading-tight">
                  Secure Messenger <Lock className="w-3 h-3 text-slate-400" />
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                  Szyfrowana komunikacja end-to-end. Prywatne czaty i samoniszczące się notatki.
                </p>
              </div>
            </div>
            <div className="flex items-end justify-between w-full mt-4">
              <div>
                <span className="block text-xl font-bold text-slate-800">{price} <span className="text-xs font-normal text-slate-400">pkt</span></span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">/ msc</span>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg">
                <ShoppingCart className="w-3 h-3" /> Wybierz
              </button>
            </div>
          </div>
        )}
      </div>

      {isOpen && hasAccess && (
        <SecureMessengerApp onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
