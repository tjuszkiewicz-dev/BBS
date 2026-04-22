import React, { useState } from 'react';
import { Company, User, Role } from '../../../types';
import {
  X, Building2, Hash, MapPin, User as UserIcon,
  Users, ChevronDown, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';

interface AddClientModalProps {
  currentUser: User;
  allUsers: User[];
  onAdd: (data: Partial<Company>) => void;
  onClose: () => void;
}

interface FormState {
  name: string;
  nip: string;
  street: string;
  city: string;
  zipCode: string;
  advisorId: string;
  managerId: string;
  directorId: string;
  notes: string;
}

const INITIAL: FormState = {
  name: '', nip: '', street: '', city: '', zipCode: '',
  advisorId: '', managerId: '', directorId: '', notes: '',
};

const NIP_RE = /^\d{10}$/;

export const AddClientModal: React.FC<AddClientModalProps> = ({ currentUser, allUsers, onAdd, onClose }) => {
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    advisorId: currentUser.role === Role.ADVISOR ? currentUser.id : '',
    managerId: currentUser.role === Role.MANAGER ? currentUser.id : '',
    directorId: currentUser.role === Role.DIRECTOR ? currentUser.id : '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [step, setStep] = useState<1 | 2>(1);

  const advisors  = allUsers.filter(u => u.role === Role.ADVISOR  && u.status === 'ACTIVE');
  const managers  = allUsers.filter(u => u.role === Role.MANAGER  && u.status === 'ACTIVE');
  const directors = allUsers.filter(u => u.role === Role.DIRECTOR && u.status === 'ACTIVE');

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrors(er => ({ ...er, [key]: undefined }));
  };

  const validate1 = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Nazwa jest wymagana';
    if (!NIP_RE.test(form.nip.replace(/[-\s]/g, ''))) e.nip = 'NIP musi mieć 10 cyfr';
    if (!form.city.trim()) e.city = 'Miasto jest wymagane';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate1()) setStep(2); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNip = form.nip.replace(/[-\s]/g, '');
    onAdd({
      name: form.name.trim(),
      nip: cleanNip,
      address: form.street
        ? { street: form.street.trim(), city: form.city.trim(), zipCode: form.zipCode.trim() }
        : undefined,
      advisorId: form.advisorId || undefined,
      managerId: form.managerId || undefined,
      directorId: form.directorId || undefined,
    });
    onClose();
  };

  const inputCls = (err?: string) =>
    `w-full text-sm px-3.5 py-2.5 rounded-xl border ${err ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'} bg-white outline-none transition-all`;

  const selectCls = `w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white outline-none appearance-none transition-all`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Dodaj nowego klienta</h2>
              <p className="text-indigo-200 text-xs">Krok {step} z 2 — {step === 1 ? 'Dane firmy' : 'Przypisanie i notatki'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-indigo-100">
          <div className="h-1 bg-indigo-500 transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
        </div>

        <form onSubmit={step === 1 ? (e => { e.preventDefault(); handleNext(); }) : handleSubmit} className="p-6 space-y-4">

          {step === 1 && (
            <>
              {/* Nazwa firmy */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Building2 size={11} className="inline mr-1" />Nazwa firmy *
                </label>
                <input
                  type="text" value={form.name} onChange={set('name')} autoFocus
                  placeholder="np. TechSolutions Sp. z o.o."
                  className={inputCls(errors.name)}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{errors.name}</p>}
              </div>

              {/* NIP */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Hash size={11} className="inline mr-1" />NIP *
                </label>
                <input
                  type="text" value={form.nip} onChange={set('nip')}
                  placeholder="np. 5250008649"
                  maxLength={13}
                  className={inputCls(errors.nip)}
                />
                {errors.nip && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{errors.nip}</p>}
              </div>

              {/* Adres */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <MapPin size={11} className="inline mr-1" />Adres
                </label>
                <div className="space-y-2">
                  <input type="text" value={form.street} onChange={set('street')} placeholder="Ulica i numer" className={inputCls()} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={form.zipCode} onChange={set('zipCode')} placeholder="00-000" maxLength={6} className={inputCls()} />
                    <input type="text" value={form.city} onChange={set('city')} placeholder="Miasto *" className={inputCls(errors.city)} />
                  </div>
                  {errors.city && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.city}</p>}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Doradca */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <UserIcon size={11} className="inline mr-1" />Doradca (Advisor)
                </label>
                <div className="relative">
                  <select value={form.advisorId} onChange={set('advisorId')} className={selectCls}>
                    <option value="">— Nie przypisano —</option>
                    {advisors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Users size={11} className="inline mr-1" />Manager
                </label>
                <div className="relative">
                  <select value={form.managerId} onChange={set('managerId')} className={selectCls}>
                    <option value="">— Nie przypisano —</option>
                    {managers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Dyrektor */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Users size={11} className="inline mr-1" />Dyrektor Handlowy
                </label>
                <div className="relative">
                  <select value={form.directorId} onChange={set('directorId')} className={selectCls}>
                    <option value="">— Nie przypisano —</option>
                    {directors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Notatka */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <FileText size={11} className="inline mr-1" />Notatka / Kontekst
                </label>
                <textarea
                  value={form.notes} onChange={set('notes')}
                  rows={3}
                  placeholder="Źródło leada, kontakt, uwagi do onboardingu..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white outline-none resize-none transition-all"
                />
              </div>

              {/* Preview */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Podsumowanie</p>
                <p className="font-black text-slate-800 text-sm">{form.name}</p>
                <p className="text-xs text-slate-500 font-mono">NIP: {form.nip}</p>
                {form.city && <p className="text-xs text-slate-500">{form.zipCode} {form.city}{form.street ? `, ${form.street}` : ''}</p>}
              </div>
            </>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <button
                type="button" onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ← Wstecz
              </button>
            )}
            {step === 1 && (
              <button
                type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Anuluj
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
            >
              {step === 1 ? (
                <>Dalej →</>
              ) : (
                <><CheckCircle2 size={16} />Dodaj klienta</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
