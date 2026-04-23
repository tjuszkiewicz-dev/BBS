import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Clock, CalendarDays, FileText, BarChart2,
  LogOut, Plus, Timer,
  TrendingUp, Edit2, Trash2, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { User } from '../types';
import {
  getOrCreateCoordinator,
  fetchWorkers, addWorker, updateWorker, deleteWorker,
  fetchSchedules, addSchedule, deleteSchedule,
  fetchSessions, correctSession,
  fetchPayrollRecords, generatePayroll,
} from '../services/apService';
import type { APWorker, WorkSchedule, WorkSession, PayrollRecord } from '../services/apService';

// NOTE: Run supabase/migrations/003_mock_auth_compat.sql in Supabase SQL Editor first.

// ¦¦¦ Helpers ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const fmtMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min > 0 ? `${min}m` : ''}`.trim();
};

const weekDayLabels = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob', 'Nd'];

function getWeekDates(offset = 0): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

// ¦¦¦ Modal ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({
  title, onClose, children, wide,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
    <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" style={{ width: wide ? 700 : 500, maxWidth: '95vw' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
    </div>
  </div>
);

// ¦¦¦ Toast ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

type ToastType = 'success' | 'error';
interface ToastMsg { id: number; text: string; type: ToastType }

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const show = useCallback((text: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, text, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const ToastArea = useCallback(() => (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white" style={{ background: t.type === 'success' ? '#10b981' : '#ef4444', minWidth: 260 }}>
          {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {t.text}
        </div>
      ))}
    </div>
  ), [toasts]);
  return { show, ToastArea };
};

// ¦¦¦ Field ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; half?: boolean }> = ({ label, required, children, half }) => (
  <div className={half ? 'flex-1' : 'w-full'}>
    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all';
const selectCls = inputCls + ' bg-white cursor-pointer';

// ¦¦¦ Nav ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

// ¦¦¦ Main ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

interface Props {
  currentUser: User;
  allUsers: User[];
  onLogout: () => void;
  currentView: string;
  onViewChange: (v: string) => void;
}

export const DashboardAPCoordinator: React.FC<Props> = ({ currentUser, onLogout, currentView, onViewChange }) => {
  const [coordinatorId, setCoordinatorId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<APWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const { show: toast, ToastArea } = useToast();

  const nameParts = currentUser.name.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || 'Koord';

  const initDb = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const coord = await getOrCreateCoordinator(currentUser.email, firstName, lastName);
      if (!coord) {
        setDbError('Nie mozna polaczyc z baza danych. Sprawdz czy wykonano migracje SQL 003 w Supabase.');
        setLoading(false);
        return;
      }
      setCoordinatorId(coord.id);
      const ws = await fetchWorkers(coord.id);
      setWorkers(ws);
    } catch (e: any) {
      setDbError(String(e?.message ?? 'Nieznany blad polaczenia z Supabase'));
    }
    setLoading(false);
  }, [currentUser.email, firstName, lastName]);

  useEffect(() => { initDb(); }, [initDb]);

  const refreshWorkers = useCallback(async () => {
    if (!coordinatorId) return;
    const ws = await fetchWorkers(coordinatorId);
    setWorkers(ws);
  }, [coordinatorId]);

  return (
    <div className="min-h-screen" style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <ToastArea />

      {/* ¦¦ TOP BAR ¦¦ */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between" style={{ height: 48 }}>
        <div className="flex items-center gap-3">
          <BarChart2 size={16} className="text-orange-500" />
          <span className="font-semibold text-gray-800 text-sm">Agencja Pracy — Koordynator</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">{currentUser.name}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          <LogOut size={14} /> Wyloguj
        </button>
      </div>

      {/* ¦¦ TAB BAR ¦¦ */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {[
            { id: 'ap-coord-dashboard', label: 'Pulpit',         icon: <BarChart2 size={16} /> },
            { id: 'ap-coord-workers',   label: 'Pracownicy',     icon: <Users size={16} /> },
            { id: 'ap-coord-schedule',  label: 'Grafik',         icon: <CalendarDays size={16} /> },
            { id: 'ap-coord-sessions',  label: 'Historia sesji', icon: <Clock size={16} /> },
            { id: 'ap-coord-payroll',   label: 'Lista p³ac',     icon: <FileText size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentView === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ¦¦ CONTENT ¦¦ */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center text-gray-400">
              <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-orange-400" />
              <p className="font-semibold text-sm">£¹czenie z baz¹ danych...</p>
            </div>
          </div>
        ) : dbError ? (
          <div className="max-w-lg mx-auto mt-16 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <p className="font-bold mb-1">B³¹d po³¹czenia z Supabase</p>
            <p>{dbError}</p>
            <button onClick={initDb} className="mt-3 text-xs text-red-600 underline">Spróbuj ponownie</button>
          </div>
        ) : (
          <>
            {currentView === 'ap-coord-dashboard' && <CoordDashboardHome workers={workers} onViewChange={onViewChange} />}
            {currentView === 'ap-coord-workers' && coordinatorId && (
              <CoordWorkersList workers={workers} coordinatorId={coordinatorId} onRefresh={refreshWorkers} toast={toast} />
            )}
            {currentView === 'ap-coord-schedule' && coordinatorId && (
              <CoordSchedule workers={workers} coordinatorId={coordinatorId} toast={toast} />
            )}
            {currentView === 'ap-coord-sessions' && coordinatorId && (
              <CoordSessions coordinatorId={coordinatorId} toast={toast} />
            )}
            {currentView === 'ap-coord-payroll' && coordinatorId && (
              <CoordPayroll coordinatorId={coordinatorId} toast={toast} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ¦¦¦ Pulpit ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const CoordDashboardHome: React.FC<{ workers: APWorker[]; onViewChange: (v: string) => void }> = ({ workers, onViewChange }) => {
  const activeCount = workers.filter(w => w.status === 'active').length;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pulpit Koordynatora</h1>
        <p className="text-gray-500 text-sm mt-0.5">Przegl¹d modu³u Agencji Pracy</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pracownicy AP', value: activeCount, color: '#f97316', icon: Users },
          { label: 'Aktywne sesje dziœ', value: '—', color: '#10b981', icon: Timer },
          { label: 'Godziny w mies.', value: '—', color: '#3b82f6', icon: Clock },
          { label: 'Suma brutto', value: '— PLN', color: '#8b5cf6', icon: TrendingUp },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.color + '18' }}>
                  <Icon size={15} style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Dodaj pracownika AP', icon: Plus, view: 'ap-coord-workers', color: '#f97316' },
          { label: 'Zarz¹dzaj grafikiem', icon: CalendarDays, view: 'ap-coord-schedule', color: '#3b82f6' },
          { label: 'Generuj listê p³ac', icon: FileText, view: 'ap-coord-payroll', color: '#8b5cf6' },
        ].map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => onViewChange(a.view)}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.color + '15' }}>
                <Icon size={18} style={{ color: a.color }} />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-orange-600 text-sm transition-colors">{a.label}</span>
              <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-orange-400" />
            </button>
          );
        })}
      </div>
      {workers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Pracownicy AP</h2>
            <button onClick={() => onViewChange('ap-coord-workers')} className="text-xs font-medium text-orange-500 hover:text-orange-600">Wszyscy ›</button>
          </div>
          {workers.slice(0, 5).map(w => (
            <div key={w.id} className="px-5 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs flex-shrink-0">
                {w.first_name.charAt(0)}{w.last_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{w.first_name} {w.last_name}</p>
                <p className="text-xs text-gray-400 truncate">{w.email}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${w.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'}`}>
                {w.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ¦¦¦ Worker Modal ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

interface WorkerFormData {
  first_name: string; last_name: string; email: string; phone: string;
  pesel_encrypted: string; address: string; document_number: string;
  document_type: 'id_card' | 'passport'; nationality: string; language: string;
  hourly_rate: string; status: 'active' | 'inactive';
}

const WorkerModal: React.FC<{
  initial?: APWorker;
  coordinatorId: string;
  onClose: () => void;
  onSaved: (w: APWorker) => void;
  toast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ initial, coordinatorId, onClose, onSaved, toast }) => {
  const [form, setForm] = useState<WorkerFormData>(() => initial ? {
    first_name: initial.first_name, last_name: initial.last_name, email: initial.email,
    phone: initial.phone ?? '', pesel_encrypted: initial.pesel_encrypted ?? '',
    address: initial.address ?? '', document_number: initial.document_number ?? '',
    document_type: initial.document_type ?? 'id_card', nationality: initial.nationality,
    language: initial.language, hourly_rate: String(initial.hourly_rate), status: initial.status,
  } : {
    first_name: '', last_name: '', email: '', phone: '', pesel_encrypted: '',
    address: '', document_number: '', document_type: 'id_card', nationality: 'PL',
    language: 'pl', hourly_rate: '', status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkerFormData, string>>>({});

  const set = (k: keyof WorkerFormData, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.first_name.trim()) e.first_name = 'Imie jest wymagane';
    if (!form.last_name.trim()) e.last_name = 'Nazwisko jest wymagane';
    if (!form.email.trim()) e.email = 'E-mail jest wymagany';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Nieprawidlowy e-mail';
    if (form.pesel_encrypted && !/^\d{11}$/.test(form.pesel_encrypted)) e.pesel_encrypted = 'PESEL musi miec 11 cyfr';
    if (form.hourly_rate && isNaN(Number(form.hourly_rate))) e.hourly_rate = 'Nieprawidlowa stawka';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      coordinator_id: coordinatorId,
      first_name: form.first_name.trim(), last_name: form.last_name.trim(),
      email: form.email.trim(), phone: form.phone.trim() || undefined,
      pesel_encrypted: form.pesel_encrypted.trim() || undefined,
      address: form.address.trim() || undefined,
      document_number: form.document_number.trim() || undefined,
      document_type: form.document_number.trim() ? form.document_type : undefined,
      nationality: form.nationality, language: form.language,
      hourly_rate: Number(form.hourly_rate) || 0, status: form.status,
    };
    const result = initial ? await updateWorker(initial.id, payload) : await addWorker(payload);
    setSaving(false);
    if (!result) { toast('Blad zapisu. Sprawdz konsole.', 'error'); return; }
    toast(initial ? 'Dane pracownika zaktualizowane' : 'Pracownik dodany do bazy danych');
    onSaved(result);
  };

  const err = (k: keyof WorkerFormData) => errors[k] ? <p className="text-xs text-red-500 mt-1">{errors[k]}</p> : null;

  return (
    <Modal title={initial ? 'Edytuj karte pracownika' : 'Dodaj pracownika AP'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Field label="Imie" required half>
              <input className={inputCls} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jan" />
              {err('first_name')}
            </Field>
            <Field label="Nazwisko" required half>
              <input className={inputCls} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Kowalski" />
              {err('last_name')}
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Adres e-mail" required half>
              <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jan@firma.pl" />
              {err('email')}
            </Field>
            <Field label="Telefon" half>
              <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+48 123 456 789" />
            </Field>
          </div>
          <Field label="PESEL">
            <input className={inputCls} value={form.pesel_encrypted} onChange={e => set('pesel_encrypted', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="11 cyfr" maxLength={11} />
            {err('pesel_encrypted')}
          </Field>
          <Field label="Adres zamieszkania">
            <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="ul. Przykladowa 1/2, 00-000 Warszawa" />
          </Field>
          <div className="flex gap-3">
            <Field label="Typ dokumentu" half>
              <select className={selectCls} value={form.document_type} onChange={e => set('document_type', e.target.value as 'id_card' | 'passport')}>
                <option value="id_card">Dowod osobisty</option>
                <option value="passport">Paszport</option>
              </select>
            </Field>
            <Field label="Numer dokumentu" half>
              <input className={inputCls} value={form.document_number} onChange={e => set('document_number', e.target.value.toUpperCase())} placeholder="ABC 123456" />
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Narodowosc" half>
              <select className={selectCls} value={form.nationality} onChange={e => set('nationality', e.target.value)}>
                <option value="PL">Polska</option>
                <option value="UA">Ukraina</option>
                <option value="RU">Rosja</option>
                <option value="EN">Wielka Brytania</option>
                <option value="ES">Hiszpania</option>
                <option value="DE">Niemcy</option>
                <option value="RO">Rumunia</option>
                <option value="BG">Bulgaria</option>
              </select>
            </Field>
            <Field label="Jezyk komunikacji" half>
              <select className={selectCls} value={form.language} onChange={e => set('language', e.target.value)}>
                <option value="pl">Polski</option>
                <option value="uk">Ukrainski</option>
                <option value="en">Angielski</option>
                <option value="ru">Rosyjski</option>
                <option value="es">Hiszpanski</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Stawka godzinowa (PLN/h)" half>
              <input className={inputCls} type="number" min="0" step="0.50" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="28.00" />
              {err('hourly_rate')}
            </Field>
            <Field label="Status" half>
              <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as 'active' | 'inactive')}>
                <option value="active">Aktywny</option>
                <option value="inactive">Nieaktywny</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Anuluj</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-black transition-colors flex items-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            {initial ? 'Zapisz zmiany' : 'Dodaj pracownika'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ¦¦¦ Pracownicy ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const CoordWorkersList: React.FC<{
  workers: APWorker[]; coordinatorId: string;
  onRefresh: () => void; toast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ workers, coordinatorId, onRefresh, toast }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<APWorker | null>(null);
  const [deleting, setDeleting] = useState<APWorker | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    const ok = await deleteWorker(deleting.id);
    if (ok) { toast('Pracownik usuniety'); onRefresh(); }
    else toast('Blad usuwania', 'error');
    setDeleting(null);
  };

  return (
    <div className="">
      {(showAdd || editing) && (
        <WorkerModal
          initial={editing ?? undefined} coordinatorId={coordinatorId}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); onRefresh(); }}
          toast={toast}
        />
      )}
      {deleting && (
        <Modal title="Usun pracownika" onClose={() => setDeleting(null)}>
          <p className="text-slate-600 text-sm mb-6">Czy na pewno chcesz usunac pracownika <strong>{deleting.first_name} {deleting.last_name}</strong>? Ta operacja jest nieodwracalna.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Anuluj</button>
            <button onClick={handleDelete} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black">Usun</button>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pracownicy AP</h1>
          <p className="text-slate-500 text-sm mt-1">{workers.length} zarejestrowanych</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onRefresh} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Odswiez"><RefreshCw size={16} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors">
            <Plus size={16} /> Dodaj pracownika
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="font-bold">Brak pracownikow AP</p>
            <p className="text-sm mt-1">Kliknij "Dodaj pracownika" aby rozpoczac</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Pracownik', 'Email / Telefon', 'Narodowosc', 'Dokument', 'Stawka/h', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workers.map(w => (
                  <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-black text-xs flex-shrink-0">
                          {w.first_name.charAt(0)}{w.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{w.first_name} {w.last_name}</p>
                          {w.pesel_encrypted && <p className="text-xs text-slate-400">PESEL: {w.pesel_encrypted}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-700">{w.email}</p>
                      <p className="text-xs text-slate-400">{w.phone ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{w.nationality}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {w.document_number ? <span><span className="text-xs text-slate-400">{w.document_type === 'passport' ? 'Paszp.' : 'Dow.'}</span> {w.document_number}</span> : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-800">{w.hourly_rate ? `${w.hourly_rate} PLN` : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${w.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                        {w.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edytuj"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleting(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Usun"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ¦¦¦ Grafik ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const AddScheduleModal: React.FC<{
  workers: APWorker[]; coordinatorId: string; prefillDate?: string;
  onClose: () => void; onSaved: () => void;
  toast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ workers, coordinatorId, prefillDate, onClose, onSaved, toast }) => {
  const active = workers.filter(w => w.status === 'active');
  const [form, setForm] = useState({ worker_id: active[0]?.id ?? '', date: prefillDate ?? new Date().toISOString().split('T')[0], location_name: '', address: '', planned_start_time: '08:00', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.worker_id || !form.location_name.trim()) { toast('Wybierz pracownika i wpisz lokalizacje', 'error'); return; }
    setSaving(true);
    const result = await addSchedule({ worker_id: form.worker_id, coordinator_id: coordinatorId, date: form.date, location_name: form.location_name.trim(), address: form.address.trim() || undefined, planned_start_time: form.planned_start_time || undefined, notes: form.notes.trim() || undefined });
    setSaving(false);
    if (!result) { toast('Blad zapisu. Sprawdz czy nie ma juz wpisu dla tego pracownika/dnia.', 'error'); return; }
    toast('Zmiana grafiku zapisana');
    onSaved();
  };

  return (
    <Modal title="Dodaj wpis do grafiku" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pracownik" required>
          <select className={selectCls} value={form.worker_id} onChange={e => set('worker_id', e.target.value)}>
            {active.map(w => <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>)}
          </select>
        </Field>
        <div className="flex gap-3">
          <Field label="Data" required half>
            <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
          </Field>
          <Field label="Godzina startu" half>
            <input type="time" className={inputCls} value={form.planned_start_time} onChange={e => set('planned_start_time', e.target.value)} />
          </Field>
        </div>
        <Field label="Nazwa lokalizacji" required>
          <input className={inputCls} value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="np. Centrum Logistyczne Warszawa" />
        </Field>
        <Field label="Adres lokalizacji">
          <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="ul. Magazynowa 5, Warszawa" />
        </Field>
        <Field label="Notatki">
          <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Dodatkowe informacje..." />
        </Field>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Anuluj</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-black flex items-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            Zapisz
          </button>
        </div>
      </form>
    </Modal>
  );
};

const CoordSchedule: React.FC<{
  workers: APWorker[]; coordinatorId: string;
  toast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ workers, coordinatorId, toast }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();

  const weekDates = getWeekDates(weekOffset);

  const load = useCallback(async () => {
    setLoadingSchedule(true);
    const data = await fetchSchedules(coordinatorId, weekDates[0], weekDates[6]);
    setSchedules(data);
    setLoadingSchedule(false);
  }, [coordinatorId, weekDates[0], weekDates[6]]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const ok = await deleteSchedule(id);
    if (ok) { toast('Wpis usuniety'); load(); }
    else toast('Blad usuwania', 'error');
  };

  const activeWorkers = workers.filter(w => w.status === 'active');
  const getEntry = (workerId: string, date: string) => schedules.find(s => s.worker_id === workerId && s.date === date);

  return (
    <div className="">
      {showAdd && (
        <AddScheduleModal
          workers={activeWorkers} coordinatorId={coordinatorId} prefillDate={prefillDate}
          onClose={() => { setShowAdd(false); setPrefillDate(undefined); }}
          onSaved={() => { setShowAdd(false); setPrefillDate(undefined); load(); }}
          toast={toast}
        />
      )}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Grafik pracy</h1>
          <p className="text-slate-500 text-sm mt-1">Tygodniowy widok przypisania lokalizacji</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(p => p - 1)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"><ChevronLeft size={16} /></button>
          <span className="text-sm font-bold text-slate-700 min-w-[140px] text-center">{fmtDate(weekDates[0])} – {fmtDate(weekDates[6])}</span>
          <button onClick={() => setWeekOffset(p => p + 1)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"><ChevronRight size={16} /></button>
          <button onClick={() => { setPrefillDate(undefined); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-colors">
            <Plus size={16} /> Dodaj wpis
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loadingSchedule ? (
          <div className="py-12 text-center text-slate-400"><RefreshCw size={24} className="animate-spin mx-auto" /></div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide w-40">Pracownik</th>
                {weekDates.map((date, i) => (
                  <th key={date} className="px-3 py-3 text-center text-xs font-black text-slate-400 uppercase tracking-wide">
                    <div>{weekDayLabels[i]}</div>
                    <div className="font-normal text-slate-300">{fmtDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeWorkers.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">Brak aktywnych pracownikow AP</td></tr>
              ) : activeWorkers.map(w => (
                <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-bold text-slate-800 text-sm">
                    <div>{w.first_name} {w.last_name}</div>
                    <div className="text-xs text-slate-400 font-normal">{w.hourly_rate} PLN/h</div>
                  </td>
                  {weekDates.map(date => {
                    const entry = getEntry(w.id, date);
                    return (
                      <td key={date} className="px-2 py-2 text-center">
                        {entry ? (
                          <div className="relative group bg-blue-50 border border-blue-200 rounded-lg p-2 text-left">
                            <div className="flex items-start gap-1">
                              <MapPin size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-blue-800 leading-tight">{entry.location_name}</p>
                                {entry.planned_start_time && <p className="text-[10px] text-blue-500">{entry.planned_start_time.slice(0, 5)}</p>}
                              </div>
                            </div>
                            <button onClick={() => handleDelete(entry.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-blue-400 hover:text-red-500">
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setPrefillDate(date); setShowAdd(true); }} className="w-full min-h-[44px] rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-xs text-slate-300 hover:text-blue-400">+</button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ¦¦¦ Sesje ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const CorrectModal: React.FC<{
  session: WorkSession; onClose: () => void; onSaved: () => void;
  toast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ session, onClose, onSaved, toast }) => {
  const [note, setNote] = useState(session.correction_note ?? '');
  const [endTime, setEndTime] = useState(session.end_time ? new Date(session.end_time).toISOString().slice(11, 16) : '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!note.trim()) { toast('Wpisz notatke korygujaca', 'error'); return; }
    setSaving(true);
    const fullEnd = endTime ? `${session.date}T${endTime}:00Z` : undefined;
    const ok = await correctSession(session.id, note.trim(), fullEnd);
    setSaving(false);
    if (!ok) { toast('Blad zapisu korekty', 'error'); return; }
    toast('Korekta zapisana');
    onSaved();
  };

  return (
    <Modal title="Korekta sesji" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
          <p><strong>Pracownik:</strong> {session.ap_workers ? `${session.ap_workers.first_name} ${session.ap_workers.last_name}` : session.worker_id}</p>
          <p><strong>Data:</strong> {session.date} | <strong>Start:</strong> {new Date(session.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <Field label="Nowa godzina zakonczenia (opcjonalnie)">
          <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} />
        </Field>
        <Field label="Powod korekty" required>
          <textarea className={inputCls} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Opisz przyczyne korekty..." />
        </Field>
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">Anuluj</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black flex items-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            Zapisz korekty
          </button>
        </div>
      </form>
    </Modal>
  );
};

const CoordSessions: React.FC<{
  coordinatorId: string;
  toast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ coordinatorId, toast }) => {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [correcting, setCorrecting] = useState<WorkSession | null>(null);

  const load = useCallback(async () => {
    setLoadingSessions(true);
    const data = await fetchSessions(coordinatorId);
    setSessions(data);
    setLoadingSessions(false);
  }, [coordinatorId]);

  useEffect(() => { load(); }, [load]);

  const badgeCls = { active: 'text-emerald-600 bg-emerald-50', completed: 'text-blue-600 bg-blue-50', corrected: 'text-amber-600 bg-amber-50' };
  const badgeLabel = { active: 'Aktywna', completed: 'Zakonczona', corrected: 'Skorygowana' };

  return (
    <div className="">
      {correcting && (
        <CorrectModal session={correcting} onClose={() => setCorrecting(null)} onSaved={() => { setCorrecting(null); load(); }} toast={toast} />
      )}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Historia sesji pracy</h1>
          <p className="text-slate-500 text-sm mt-1">Ostatnie 30 dni · {sessions.length} sesji</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><RefreshCw size={16} /></button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingSessions ? (
          <div className="py-12 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-slate-400" /></div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Clock size={40} className="mb-3 opacity-30" />
            <p className="font-bold">Brak sesji</p>
            <p className="text-sm mt-1">Sesje pojawia sie gdy pracownicy uruchomia timer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Pracownik', 'Data', 'Start', 'Stop', 'Czas', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800 text-sm">
                      {s.ap_workers ? `${s.ap_workers.first_name} ${s.ap_workers.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{s.date}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{new Date(s.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {s.end_time ? new Date(s.end_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : <span className="text-emerald-500 font-semibold">w toku</span>}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-800">{s.total_minutes != null ? fmtMinutes(s.total_minutes) : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls[s.status]}`}>{badgeLabel[s.status]}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => setCorrecting(s)} className="text-xs font-semibold text-slate-400 hover:text-amber-600 hover:underline">Koryguj</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ¦¦¦ Lista plac ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦

const CoordPayroll: React.FC<{
  coordinatorId: string;
  toast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ coordinatorId, toast }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoadingPayroll(true);
    const data = await fetchPayrollRecords(coordinatorId, month);
    setRecords(data);
    setLoadingPayroll(false);
  }, [coordinatorId, month]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generatePayroll(coordinatorId, month);
    setGenerating(false);
    if (!result.success) { toast(result.error ?? 'Blad generowania', 'error'); return; }
    if (result.count === 0) { toast('Brak ukonczonych sesji dla tego miesiaca', 'error'); return; }
    toast(`Lista plac wygenerowana dla ${result.count} pracownikow`);
    load();
  };

  const totalBrutto = records.reduce((acc, r) => acc + (r.total_amount ?? 0), 0);
  const totalHours = records.reduce((acc, r) => acc + r.total_minutes, 0) / 60;

  return (
    <div className="">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lista plac</h1>
          <p className="text-slate-500 text-sm mt-1">Zestawienia wynagrodzen pracownikow AP</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" className={inputCls} style={{ width: 160 }} value={month} onChange={e => setMonth(e.target.value)} />
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><RefreshCw size={16} /></button>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors">
            {generating ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
            Generuj za miesiac
          </button>
        </div>
      </div>

      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pracownicy', value: records.length, color: '#f97316' },
            { label: 'Laczne godziny', value: `${totalHours.toFixed(1)}h`, color: '#3b82f6' },
            { label: 'Suma brutto', value: `${totalBrutto.toFixed(2)} PLN`, color: '#8b5cf6' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">{c.label}</p>
              <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingPayroll ? (
          <div className="py-12 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-slate-400" /></div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText size={40} className="mb-3 opacity-30" />
            <p className="font-bold">Brak listy plac za {month}</p>
            <p className="text-sm mt-1">Kliknij "Generuj za miesiac" aby obliczyc wynagrodzenia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Pracownik', 'Miesiac', 'Laczne h', 'Stawka/h', 'Brutto', 'Wygenerowano'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800 text-sm">
                      {r.ap_workers ? `${r.ap_workers.first_name} ${r.ap_workers.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{r.month}</td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-800">{(r.total_minutes / 60).toFixed(2)}h</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{r.hourly_rate} PLN</td>
                    <td className="px-5 py-3"><span className="text-sm font-black text-violet-700">{Number(r.total_amount).toFixed(2)} PLN</span></td>
                    <td className="px-5 py-3 text-xs text-slate-400">{new Date(r.generated_at).toLocaleDateString('pl-PL')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-5 py-3 font-black text-slate-800 text-sm" colSpan={4}>RAZEM</td>
                  <td className="px-5 py-3 font-black text-violet-700">{totalBrutto.toFixed(2)} PLN</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
