import React, { useState, useEffect, useRef } from 'react';
import { CalendarDays, Clock, History, LogOut, Menu, X, Play, Square, MapPin, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface Props {
  currentUser: User;
  onLogout: () => void;
  currentView: string;
  onViewChange: (v: string) => void;
}

type SessionState = 'idle' | 'running';

const NAV = [
  { id: 'ap-worker-dashboard', label: 'Timer',     icon: Clock },
  { id: 'ap-worker-schedule',  label: 'Grafik',    icon: CalendarDays },
  { id: 'ap-worker-history',   label: 'Historia',  icon: History },
];

export const DashboardAPWorker: React.FC<Props> = ({ currentUser, onLogout, currentView, onViewChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen font-sans" style={{ background: '#030b1a' }}>

      {/* SIDEBAR */}
      <aside
        className="flex flex-col flex-shrink-0 border-r border-white/[0.07] transition-all duration-300"
        style={{ width: sidebarOpen ? 220 : 64, background: 'rgba(5,10,25,0.98)' }}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.07]">
          <img src="/logo.png" alt="logo" className="w-8 h-8 rounded-lg flex-shrink-0" />
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">BBS · AP</p>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">Pracownik</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(p => !p)} className="ml-auto text-white/30 hover:text-white/70 transition-colors">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map(item => {
            const active = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: active ? '#34d399' : 'rgba(255,255,255,0.45)',
                  border: active ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.07]">
          {sidebarOpen && (
            <div className="px-2 py-2 mb-2">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-400 font-semibold">Pracownik AP</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            {sidebarOpen && 'Wyloguj się'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto">
        {currentView === 'ap-worker-dashboard' && <WorkerTimer currentUser={currentUser} />}
        {currentView === 'ap-worker-schedule'  && <WorkerSchedule />}
        {currentView === 'ap-worker-history'   && <WorkerHistory />}
      </main>
    </div>
  );
};

/* ── Timer ───────────────────────────────────────────────────────────────── */
const WorkerTimer: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [state, setState] = useState<SessionState>('idle');
  const [elapsed, setElapsed] = useState(0); // sekundy
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [lastSession, setLastSession] = useState<{ duration: number; startedAt: Date } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const handleStart = () => {
    setStartedAt(new Date());
    setElapsed(0);
    setState('running');
  };

  const handleStop = () => {
    setLastSession({ duration: elapsed, startedAt: startedAt! });
    setState('idle');
    setElapsed(0);
  };

  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(135deg,#030b1a 0%,#061225 100%)' }}>
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-emerald-400/60 text-xs font-bold tracking-widest uppercase mb-2">{today}</p>
          <h1 className="text-2xl font-black text-white mb-1">Witaj, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-white/40 text-sm">Zarejestruj swój czas pracy</p>
        </div>

        {/* Location card */}
        <div className="mb-8 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wide">Lokalizacja na dziś</p>
              <p className="text-white/70 text-sm font-bold mt-0.5">Brak przypisanej lokalizacji</p>
            </div>
          </div>
        </div>

        {/* Timer display */}
        <div className="text-center mb-10">
          <div
            className="inline-block text-6xl font-black tracking-wider tabular-nums transition-all duration-300"
            style={{
              color: state === 'running' ? '#34d399' : 'rgba(255,255,255,0.2)',
              textShadow: state === 'running' ? '0 0 40px rgba(52,211,153,0.4)' : 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmt(elapsed)}
          </div>
          {state === 'running' && startedAt && (
            <p className="text-emerald-400/60 text-xs font-semibold mt-2">
              Rozpoczęto o {startedAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* START / STOP button */}
        {state === 'idle' ? (
          <button
            onClick={handleStart}
            className="w-full py-5 rounded-2xl text-lg font-black text-white transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#059669,#10b981)',
              boxShadow: '0 16px 48px rgba(16,185,129,0.4)',
            }}
          >
            <Play size={20} className="inline mr-3 -mt-0.5" fill="white" />
            START — Gotowość do pracy
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="w-full py-5 rounded-2xl text-lg font-black text-white transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#dc2626,#ef4444)',
              boxShadow: '0 16px 48px rgba(239,68,68,0.4)',
            }}
          >
            <Square size={20} className="inline mr-3 -mt-0.5" fill="white" />
            STOP — Zakończ sesję
          </button>
        )}

        {/* Last session summary */}
        {lastSession && (
          <div className="mt-6 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <span className="text-emerald-400 text-sm font-bold">Sesja zakończona</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <p className="text-white/40 text-xs font-semibold">Czas trwania</p>
                <p className="text-white font-black text-lg">{fmt(lastSession.duration)}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs font-semibold">Rozpoczęcie</p>
                <p className="text-white font-black text-lg">
                  {lastSession.startedAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Grafik ──────────────────────────────────────────────────────────────── */
const WorkerSchedule: React.FC = () => {
  const days = [
    { label: 'Poniedziałek', date: '' },
    { label: 'Wtorek', date: '' },
    { label: 'Środa', date: '' },
    { label: 'Czwartek', date: '' },
    { label: 'Piątek', date: '' },
    { label: 'Sobota', date: '' },
    { label: 'Niedziela', date: '' },
  ];

  // Wypełnij daty dla bieżącego tygodnia
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Pn=0
  days.forEach((d, i) => {
    const dt = new Date(now);
    dt.setDate(now.getDate() - dayOfWeek + i);
    d.date = dt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  });

  return (
    <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg,#030b1a 0%,#061225 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Grafik tygodniowy</h1>
          <p className="text-white/40 text-sm mt-1">Twoje przypisania na ten tydzień</p>
        </div>

        <div className="space-y-3">
          {days.map((day, i) => (
            <div
              key={day.label}
              className="p-4 rounded-2xl border"
              style={{
                background: i === dayOfWeek ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                borderColor: i === dayOfWeek ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: i === dayOfWeek ? '#34d399' : 'rgba(255,255,255,0.7)' }}>
                    {day.label}
                    {i === dayOfWeek && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Dziś</span>}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">{day.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/30 font-semibold">Brak przypisania</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Historia ────────────────────────────────────────────────────────────── */
const WorkerHistory: React.FC = () => (
  <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg,#030b1a 0%,#061225 100%)' }}>
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Historia pracy</h1>
        <p className="text-white/40 text-sm mt-1">Twoje przepracowane godziny</p>
      </div>

      <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-6">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-1">Suma godzin w bieżącym miesiącu</p>
        <p className="text-4xl font-black text-white">0h 0min</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <History size={40} className="mb-3 opacity-40" />
        <p className="font-bold text-white/50">Brak historii</p>
        <p className="text-sm mt-1">Rozpocznij pierwszą sesję pracy</p>
      </div>
    </div>
  </div>
);
