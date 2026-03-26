import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, Voucher, VoucherStatus, BuybackAgreement, ServiceItem, Transaction, UserFinance, ServiceType } from '../types';
import { ServiceCatalog } from '../components/employee/dashboard/ServiceCatalog';
import { EmployeeTransactionHistory } from '../components/employee/dashboard/EmployeeTransactionHistory';
import { EmployeeBuybackList } from '../components/employee/dashboard/EmployeeBuybackList';
import { RedemptionModal } from '../components/employee/RedemptionModal';
import { MobileNav } from '../components/employee/mobile/MobileNav';
import { WalletCard } from '../components/employee/mobile/WalletCard';
import { SupportTicketSystem } from '../components/support/SupportTicketSystem'; 
import { EmployeeGuide } from '../components/employee/dashboard/EmployeeGuide'; 
import { MentalHealthDashboard } from '../components/employee/dashboard/MentalHealthDashboard';
import { LegalAssistantDashboard } from '../components/employee/dashboard/LegalAssistantDashboard';
import { SecureMessengerWidget } from '../components/employee/dashboard/secure-messenger/SecureMessengerWidget';
import { SecureDigitalVaultWidget } from '../components/employee/dashboard/digital-vault/SecureDigitalVaultWidget';
import { DigitalVaultApp } from '../components/employee/dashboard/digital-vault/DigitalVaultApp';
import { MarketplaceHero } from '../components/employee/dashboard/marketplace/MarketplaceHero';
import { ElitonBanner } from '../components/employee/dashboard/marketplace/ElitonBanner';
import { OrangeOfferSection } from '../components/employee/dashboard/OrangeOfferSection';
import { PZUServiceSection } from '../components/employee/dashboard/PZUServiceSection';
import { ErgoHestiaServiceSection } from '../components/employee/dashboard/ErgoHestiaServiceSection';
import { LuxMedServiceSection } from '../components/employee/dashboard/LuxMedServiceSection';
import { Wallet, History, Settings, HelpCircle, Grid, Heart, Lock, Brain, ArrowRight, Scale, ShieldCheck, X, ShoppingCart } from 'lucide-react';
import { useStrattonSystem } from '../context/StrattonContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { usePersistedState } from '../hooks/usePersistedState';

interface Props {
  currentView: string;
  user: User;
  vouchers: Voucher[];
  buybacks: BuybackAgreement[];
  services: ServiceItem[];
  transactions: Transaction[];
  onViewChange?: (view: string) => void;
  onPurchaseService: (service: ServiceItem) => void;
  onViewAgreement: (agreement: BuybackAgreement) => void;
}

type Tab = 'WALLET' | 'ACTIVE_SERVICES' | 'CATALOG' | 'HISTORY' | 'SUPPORT' | 'WELLBEING' | 'LEGAL' | 'SECURE_MESSENGER' | 'DIGITAL_VAULT';

export const DashboardEmployee: React.FC<Props> = ({ 
  currentView,
  user, 
  vouchers, 
  buybacks, 
  services,
  transactions,
  onViewChange,
  onPurchaseService, 
  onViewAgreement 
}) => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<Tab>('WALLET');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Guide State - Persisted
  const [showGuide, setShowGuide] = usePersistedState<boolean>('ebs_guide_employee_v1', true);
  
  // Flags for One Pager Navigation
  const isScrollingRef = useRef(false);

  // --- CONTEXT ---
  const { state, actions } = useStrattonSystem();
  const { tickets } = state;

  // --- SYNC WITH PARENT & SCROLL LOGIC ---
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container') || window;

    if (currentView === 'emp-history') {
        setActiveTab('HISTORY');
        scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    }
    else if (currentView === 'emp-active-services') {
        setActiveTab('ACTIVE_SERVICES');
        scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    }
    else if (currentView === 'emp-support') {
        setActiveTab('SUPPORT');
        scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    }
    else if (currentView === 'emp-catalog') {
        if (activeTab !== 'CATALOG') {
            setActiveTab('CATALOG');
        }

        if (!isScrollingRef.current) {
             setTimeout(() => {
                 const element = document.getElementById('catalog-anchor');
                 if (element) {
                     const rect = element.getBoundingClientRect();
                     if (Math.abs(rect.top) > 100) {
                         element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     }
                 }
             }, 100);
        }
    }
    else if (currentView === 'emp-dashboard') {
        if (activeTab !== 'WALLET') {
             setActiveTab('WALLET');
        }
        
        if (!isScrollingRef.current) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
  }, [currentView]);

  // --- SCROLL SPY ---
  useEffect(() => {
    const handleScroll = () => {
        if (activeTab === 'HISTORY' || activeTab === 'SUPPORT' || activeTab === 'WELLBEING' || activeTab === 'LEGAL' || activeTab === 'ACTIVE_SERVICES') return;

        isScrollingRef.current = true;
        
        if ((window as any).scrollTimeout) clearTimeout((window as any).scrollTimeout);
        (window as any).scrollTimeout = setTimeout(() => { isScrollingRef.current = false; }, 150);

        const catalogAnchor = document.getElementById('catalog-anchor');
        if (!catalogAnchor || !onViewChange) return;

        const rect = catalogAnchor.getBoundingClientRect();
        
        const threshold = window.innerHeight * 0.8; 
        const isCatalogActive = rect.top < threshold; 

        if (isCatalogActive && currentView !== 'emp-catalog') {
            onViewChange('emp-catalog');
        } 
        else if (!isCatalogActive && currentView !== 'emp-dashboard') {
             onViewChange('emp-dashboard');
        }
    };

    const scrollContainer = document.getElementById('main-scroll-container') || window;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        if ((window as any).scrollTimeout) clearTimeout((window as any).scrollTimeout);
    };
  }, [activeTab, currentView]);

  // Rest of logic...
  const activeVouchers = useMemo(() => vouchers.filter(v => v.status === VoucherStatus.DISTRIBUTED || v.status === VoucherStatus.RESERVED), [vouchers]);
  
  const expiringSoon = activeVouchers.filter(v => {
    if(!v.expiryDate) return false;
    const daysLeft = (new Date(v.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    return daysLeft < 3 && daysLeft > 0;
  });

  // Check for Access
  const hasMentalHealthAccess = useMemo(() => {
      return transactions.some(t => t.serviceId === 'SRV-MENTAL-01');
  }, [transactions]);

  const hasLegalAccess = useMemo(() => {
      return transactions.some(t => t.serviceId === 'SRV-LEGAL-01');
  }, [transactions]);

  const hasSecureMessengerAccess = useMemo(() => {
      return transactions.some(t => t.serviceId === 'SRV-SECURE-01');
  }, [transactions]);

  const hasVaultAccess = useMemo(() => {
    return transactions.some(t => t.serviceId === 'SRV-VAULT-01');
  }, [transactions]);

  // Filter Catalog
  const displayServices = useMemo(() => {
      return services.filter(s => {
          if (s.id === 'SRV-MENTAL-01' && hasMentalHealthAccess) return false;
          if (s.id === 'SRV-LEGAL-01' && hasLegalAccess) return false;
          if (s.id === 'SRV-SECURE-01' && hasSecureMessengerAccess) return false;
          if (s.id === 'SRV-VAULT-01' && hasVaultAccess) return false;
          if (s.id.startsWith('SRV-ORANGE')) return false; 
          return true;
      });
  }, [services, hasMentalHealthAccess, hasLegalAccess, hasSecureMessengerAccess, hasVaultAccess]);

  const wellbeingService = useMemo(() => services.find(s => s.id === 'SRV-MENTAL-01'), [services]);
  const legalService = useMemo(() => services.find(s => s.id === 'SRV-LEGAL-01'), [services]);
  
  const secureMessengerService = useMemo(() => {
      const existing = services.find(s => s.id === 'SRV-SECURE-01');
      if (existing) return existing;
      
      return {
          id: 'SRV-SECURE-01',
          name: 'Secure Messenger',
          description: 'Szyfrowana komunikacja end-to-end. Prywatne czaty i samoniszczące się notatki.',
          price: 200,
          type: ServiceType.SUBSCRIPTION,
          icon: 'Shield',
          isActive: true
      } as ServiceItem;
  }, [services]);

  const vaultService = useMemo(() => {
    const existing = services.find(s => s.id === 'SRV-VAULT-01');
    if (existing) return existing;
    
    return {
        id: 'SRV-VAULT-01',
        name: 'Secure Digital Vault',
        description: 'Prywatny sejf cyfrowy 10GB. Szyfrowanie AES-256.',
        price: 50,
        type: ServiceType.SUBSCRIPTION,
        icon: 'HardDrive',
        isActive: true
    } as ServiceItem;
  }, [services]);

  const handleUpdateFinance = (financeData: UserFinance) => {
      actions.handleUpdateUserFinance(user.id, financeData);
  };

  const handleManualSpend = async (amount: number, description: string) => {
      const tempService: ServiceItem = {
          id: `INTERNAL-${Date.now()}`,
          name: description,
          description: 'Internal App Usage',
          price: amount,
          type: ServiceType.ONE_TIME,
          icon: 'Zap',
          isActive: true
      };
      onPurchaseService(tempService);
  };

  const renderWallet = () => (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          <div className="md:hidden">
              <WalletCard user={user} />
          </div>

          <div className="pt-8 pb-12 border-t border-slate-200">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-tight text-slate-800">Twoje Narzędzia</h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider hidden md:block bg-emerald-50 text-emerald-600 border border-emerald-200">
                   Zarządzane przez BBS
                </span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
              
              <div
                onClick={() => setActiveTab('WELLBEING')}
                className="relative overflow-hidden rounded-3xl cursor-pointer group transition-all duration-300 hover:shadow-xl h-full min-h-[180px] border border-teal-700/50"
              >
                <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1000)' }} />
                <div className="absolute inset-0 bg-teal-950/80 backdrop-blur-[2px] group-hover:bg-teal-950/70 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="relative p-5 h-full flex flex-col justify-between z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase animate-pulse">
                        Dostęp Aktywny
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors flex items-center gap-2 leading-tight">
                      <Brain className="w-4 h-4" /> Wellbeing
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-[90%]">
                      Twoje centrum zdrowia psychicznego. AI Coach, medytacje i sesje deep work.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-1">
                      <div className="w-7 h-7 rounded-full bg-teal-900/50 border-2 border-slate-700 flex items-center justify-center text-xs text-teal-400 shadow-sm z-20">
                        <Heart size={12} />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs text-white shadow-sm z-10">
                        <Brain size={12} />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-teal-500 flex items-center justify-center transition-all duration-300 shadow-lg border border-white/10 group-hover:border-teal-400 transform group-hover:translate-x-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('LEGAL')}
                className="relative overflow-hidden rounded-3xl cursor-pointer group transition-all duration-300 hover:shadow-xl h-full min-h-[180px] border border-amber-700/50"
              >
                <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1000)' }} />
                <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-[2px] group-hover:bg-amber-950/70 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="relative p-5 h-full flex flex-col justify-between z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase animate-pulse">
                        Legalny Spokój
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors flex items-center gap-2 leading-tight">
                      <Scale className="w-4 h-4" /> AI Prawnik
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-[90%]">
                      Analiza umów, generator pism i porady prawne 24/7.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-1">
                      <div className="w-7 h-7 rounded-full bg-amber-900/50 border-2 border-slate-700 flex items-center justify-center text-xs text-amber-400 shadow-sm z-20">
                        <Scale size={12} />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs text-white shadow-sm z-10">
                        <ShieldCheck size={12} />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-amber-500 flex items-center justify-center transition-all duration-300 shadow-lg border border-white/10 group-hover:border-amber-400 transform group-hover:translate-x-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-full">
                <SecureMessengerWidget 
                    hasAccess={true}
                    price={200}
                    onPurchase={() => setSelectedService(secureMessengerService)}
              />
              </div>

              <div className="h-full">
              <SecureDigitalVaultWidget 
                hasAccess={true}
                price={50}
                onPurchase={() => setSelectedService(vaultService)}
              />
              </div>

          </div>
          </div>

          <div className="pt-12 pb-12 border-t border-slate-200">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-tight text-slate-800">Strefa Partnerów</h3>
                 <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-orange-50 text-orange-500 border border-orange-200">
                   Oferty Specjalne
                </span>
             </div>

             <div className="space-y-12">
                <OrangeOfferSection 
                    services={services}
                    onPurchase={setSelectedService}
                />

                <PZUServiceSection
                    onCheckOffer={(category) => {
                        const tempService: ServiceItem = {
                            id: `PZU-${category}`,
                            name: `Ubezpieczenie PZU: ${category}`,
                            description: 'Specjalna oferta dla pracowników. Kliknij "Zatwierdź", aby zamówić kontakt z agentem.',
                            price: 0,
                            type: ServiceType.ONE_TIME,
                            icon: 'Shield',
                            isActive: true
                        };
                        setSelectedService(tempService);
                    }}
                />
                <ErgoHestiaServiceSection
                    onSelectPackage={(packageName, price) => {
                        const tempService: ServiceItem = {
                            id: `ERGOHESTIA-${packageName.replace(/\s/g, '_')}`,
                            name: packageName,
                            description: `Grupowe ubezpieczenie ERGO Hestia. Aktywacja w ciągu 2 dni roboczych. Kliknij „Zatwierdź”, aby zamówić pakiet.`,
                            price,
                            type: ServiceType.SUBSCRIPTION,
                            icon: 'Shield',
                            isActive: true
                        };
                        setSelectedService(tempService);
                    }}
                />
                <LuxMedServiceSection
                    onSelectPackage={(packageName, price) => {
                        const tempService: ServiceItem = {
                            id: `LUXMED-${packageName.replace(/\s/g, '_')}`,
                            name: packageName,
                            description: `Prywatny pakiet medyczny LuxMed. Aktywacja w ciągu 24h. Kliknij "Zatwierdź", aby zamówić pakiet.`,
                            price,
                            type: ServiceType.SUBSCRIPTION,
                            icon: 'Heart',
                            isActive: true
                        };
                        setSelectedService(tempService);
                    }}
                />
             </div>
          </div>

          <ElitonBanner />

          <div className="md:hidden">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Polecane Usługi</h3>
                  <button onClick={() => setActiveTab('CATALOG')} className="text-xs text-emerald-600 font-bold">Zobacz wszystkie</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {displayServices.slice(0, 4).map(s => (
                      <div key={s.id} onClick={() => setSelectedService(s)} className="min-w-[140px] bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center active:scale-95 transition-transform">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl mb-2">🎁</div>
                          <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-2 h-8">{s.name}</p>
                          <p className="text-emerald-600 font-bold text-sm mt-1">{s.price} pkt</p>
                      </div>
                  ))}
              </div>
          </div>

          <div className="md:hidden">
              <h3 className="font-bold text-slate-800 mb-4">Ostatnie Transakcje</h3>
              <div className="space-y-3">
                  {transactions.slice(0, 3).map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {t.type === 'CREDIT' ? '+' : '-'}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800">{t.serviceName || 'Doładowanie'}</p>
                                  <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                              </div>
                          </div>
                          <span className={`text-base font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {t.type === 'CREDIT' ? '+' : '-'}{t.amount}
                          </span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  if (activeTab === 'WELLBEING' && hasMentalHealthAccess) {
      return (
          <MentalHealthDashboard 
              currentUser={user}
              balance={user.voucherBalance}
              onSpend={handleManualSpend}
              onExit={() => setActiveTab('WALLET')}
          />
      );
  }

  if (activeTab === 'LEGAL' && hasLegalAccess) {
      return (
          <LegalAssistantDashboard 
              currentUser={user}
              balance={user.voucherBalance}
              onSpend={handleManualSpend}
              onExit={() => setActiveTab('WALLET')}
          />
      );
  }

  if (activeTab === 'SECURE_MESSENGER' && hasSecureMessengerAccess) {
      return (
          <div className="fixed inset-0 bg-slate-50 z-[100] overflow-hidden flex flex-col font-sans text-slate-900">
              <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 z-50">
                  <div className="flex items-center gap-2">
                      <div className="bg-emerald-600 text-white p-1.5 rounded-xl">
                          <Lock size={18}/>
                      </div>
                      <span className="font-bold tracking-tight text-slate-900">STRATTON <span className="text-emerald-600">SECURE</span></span>
                  </div>
                  <button onClick={() => setActiveTab('WALLET')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                      <X size={20}/>
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto relative bg-[#f8fafc]">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
                      <SecureMessengerWidget
                          hasAccess={hasSecureMessengerAccess}
                      />
                  </div>
              </div>
          </div>
      );
  }

  if (activeTab === 'DIGITAL_VAULT' && hasVaultAccess) {
      return (
          <div className="fixed inset-0 bg-slate-50 z-[100] overflow-hidden flex flex-col font-sans text-slate-900">
              <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
                  <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 text-white p-1.5 rounded-xl">
                          <ShieldCheck size={18}/>
                      </div>
                      <span className="font-bold tracking-tight text-slate-900">DIGITAL <span className="text-indigo-600">VAULT</span></span>
                  </div>
                  <button onClick={() => setActiveTab('WALLET')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                      <X size={20}/>
                  </button>
              </div>

              <div className="flex-1 overflow-hidden relative bg-[#f8fafc]">
                  <DigitalVaultApp 
                      onClose={() => setActiveTab('WALLET')}
                  />
              </div>
          </div>
      );
  }

  const renderActiveServices = () => {
      const activeCount = [hasMentalHealthAccess, hasLegalAccess, hasSecureMessengerAccess, hasVaultAccess].filter(Boolean).length;

      return (
          <div className="space-y-8 animate-in fade-in duration-500">
              <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden bg-white shadow-sm border border-slate-200">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 opacity-20 bg-emerald-300"></div>
                  <div className="relative z-10 max-w-2xl">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-slate-800">
                          Witaj w swoim katalogu <br/>
                          <span className="text-emerald-600">aktywnych usług</span>
                      </h2>
                      <p className="text-lg leading-relaxed text-slate-500">
                          Dziękujemy że skorzystałeś z naszych możliwości i życzymy miłego użytkowania.
                      </p>
                  </div>
              </div>

              {activeCount === 0 ? (
                  <div className="text-center py-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white shadow-sm text-slate-400">
                          <Grid size={32} />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-slate-800">Brak aktywnych usług</h3>
                      <p className="max-w-md mx-auto text-slate-500">
                          Nie aktywowałeś jeszcze żadnych usług. Przejdź do katalogu, aby wykorzystać swoje punkty.
                      </p>
                      <Button 
                          variant="primary" 
                          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                              setActiveTab('CATALOG');
                              if (onViewChange) onViewChange('emp-catalog');
                          }}
                      >
                          Przeglądaj Katalog
                      </Button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {hasMentalHealthAccess && (
                          <div 
                            onClick={() => setActiveTab('WELLBEING')}
                            className="group relative cursor-pointer hover:-translate-y-1.5 transition-all duration-300 z-0 h-full min-h-[240px]"
                          >
                              <div className="absolute -bottom-6 left-4 right-4 h-6 bg-blue-300 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
                              <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm border border-slate-200 bg-white h-full flex flex-col justify-between">
                                  <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000)' }}></div>
                                  <div className="absolute inset-0 bg-white group-hover:bg-slate-50 transition-colors"></div>
                                  <div className="relative z-10 flex justify-between items-center h-full">
                                      <div>
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                                                  Dostęp Aktywny
                                              </span>
                                          </div>
                                          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                              <Brain className="text-blue-500" size={24}/> Wellbeing
                                          </h3>
                                          <p className="text-slate-500 text-sm mt-1 max-w-sm">
                                              Twoje centrum zdrowia psychicznego. AI Coach, medytacje i sesje deep work.
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {hasLegalAccess && (
                          <div 
                            onClick={() => setActiveTab('LEGAL')}
                            className="group relative cursor-pointer hover:-translate-y-1.5 transition-all duration-300 z-0 h-full min-h-[240px]"
                          >
                              <div className="absolute -bottom-6 left-4 right-4 h-6 bg-amber-300 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
                              <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm border border-slate-200 bg-white h-full flex flex-col justify-between">
                                  <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1000)' }}></div>
                                  <div className="absolute inset-0 bg-white group-hover:bg-slate-50 transition-colors"></div>
                                  <div className="relative z-10 flex justify-between items-center h-full">
                                      <div>
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                                                  Legalny Spokój
                                              </span>
                                          </div>
                                          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                              <Scale className="text-amber-500" size={24}/> AI Prawnik
                                          </h3>
                                          <p className="text-slate-500 text-sm mt-1 max-w-sm">
                                              Analiza umów, generator pism i porady prawne 24/7.
                                          </p>
                                      </div>
                                      <div className="bg-slate-100 p-3 rounded-full group-hover:bg-slate-200 transition-colors">
                                          <ArrowRight size={24} className="text-slate-600"/>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {hasSecureMessengerAccess && (
                          <div className="h-full min-h-[240px] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                              <SecureMessengerWidget
                                  hasAccess={true}
                              />
                          </div>
                      )}

                      {hasVaultAccess && (
                          <div className="h-full min-h-[240px] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                              <SecureDigitalVaultWidget 
                                  hasAccess={true}
                                  onOpen={() => setActiveTab('DIGITAL_VAULT')}
                              />
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="bg-slate-50 min-h-full relative pb-24 md:pb-6 font-sans text-slate-900">
      <style>{`
        @keyframes ebs-orb {
          0%,100% { transform: translate(0,0) scale(1); opacity:.5; }
          25%     { transform: translate(40px,-30px) scale(1.12); opacity:.7; }
          50%     { transform: translate(-20px,50px) scale(.9); opacity:.4; }
          75%     { transform: translate(30px,20px) scale(1.06); opacity:.6; }
        }
        @keyframes ebs-grad {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ebs-orb-d { animation: ebs-orb 13s ease-in-out infinite; }
        .ebs-orb-d2 { animation: ebs-orb 17s ease-in-out infinite reverse; }
        .ebs-orb-d3 { animation: ebs-orb 21s ease-in-out infinite 4s; }
        .ebs-grad-text {
          background: linear-gradient(135deg, #1e293b 0%, #334155 40%, #0f172a 65%, #020617 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ebs-grad 3s ease infinite;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ebs-orb-d absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,#dbeafe_0%,transparent_70%)] blur-[80px] opacity-25" />
        <div className="ebs-orb-d2 absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,#d1fae5_0%,transparent_70%)] blur-[90px] opacity-25" />
        <div className="ebs-orb-d3 absolute top-[40%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#e0e7ff_0%,transparent_70%)] blur-[70px] opacity-20" />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'url(/background.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.05 }} />
      

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

      <div className="hidden md:flex justify-between items-end mb-12">
          <MarketplaceHero />

          <div className="flex flex-col items-end mb-8 animate-in slide-in-from-right duration-700">
             <div className="bg-white border border-slate-200 p-6 rounded-3xl min-w-[240px] text-right transform hover:scale-105 transition-all duration-300 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-400">Dostępne środki</p>
                <div className="flex items-center justify-end gap-2 text-4xl font-black text-slate-800">
                   <span>{user.voucherBalance}</span> <span className="text-lg font-bold self-start mt-2 text-emerald-500">pkt</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-4 overflow-hidden bg-slate-100">
                   <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                </div>
             </div>
          </div>
      </div>
      
      {(activeTab === 'WALLET' || activeTab === 'CATALOG') && (
        <div className="space-y-12">
            <div id="section-wallet">
                {renderWallet()}
            </div>

            <div className="flex items-center gap-4 py-4" id="catalog-anchor">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-slate-600">Katalog Usług</h3>
                <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="min-h-[600px] bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <ServiceCatalog 
                    services={displayServices}
                    userBalance={user.voucherBalance}
                    onPurchase={setSelectedService}
                />
            </div>
            
            <div className="text-center py-12 pb-24 text-slate-400">
                <p className="text-sm font-medium">To już koniec ofert na dziś.</p>
                <div className="w-2 h-2 rounded-full mx-auto mt-4 bg-slate-200"></div>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 overflow-hidden">
                <EmployeeTransactionHistory transactions={transactions} />
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 overflow-hidden">
                <EmployeeBuybackList buybacks={buybacks} onViewAgreement={onViewAgreement} />
            </div>
        </div>
      )}

      {activeTab === 'ACTIVE_SERVICES' && renderActiveServices()}

      {activeTab === 'SUPPORT' && (
          <div className="space-y-6 animate-in fade-in duration-300">
              
              <EmployeeGuide onClose={() => setShowGuide(false)} forceVisible={true} />

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2">
                  <SupportTicketSystem 
                      currentUser={user}
                      tickets={tickets}
                      onCreateTicket={actions.handleCreateTicket}
                      onReply={actions.handleReplyTicket}
                      onUpdateStatus={actions.handleUpdateTicketStatus}
                  />
              </div>
          </div>
      )}

      {selectedService && (
          <RedemptionModal 
              isOpen={!!selectedService}
              onClose={() => setSelectedService(null)}
              service={selectedService}
              onConfirm={() => {
                  onPurchaseService(selectedService);
                  if (selectedService.id === 'SRV-MENTAL-01') {
                      setTimeout(() => setActiveTab('WELLBEING'), 1000);
                  } else if (selectedService.id === 'SRV-LEGAL-01') {
                      setTimeout(() => setActiveTab('LEGAL'), 1000);
                  }
              }}
          />
      )}

      <MobileNav
          activeTab={activeTab}
          onChangeTab={(tabId) => {
              if (onViewChange) {
                if (tabId === 'WALLET') onViewChange('emp-dashboard');
                else if (tabId === 'CATALOG') onViewChange('emp-catalog');
                else if (tabId === 'HISTORY') onViewChange('emp-history');
                else setActiveTab(tabId as Tab);
              } else {
                setActiveTab(tabId as Tab);
              }
          }}
          onProfileClick={() => setIsSettingsOpen(true)}
          hasMentalHealth={hasMentalHealthAccess}
          hasLegal={hasLegalAccess}
      />
      </div>
    </div>
  );
};
