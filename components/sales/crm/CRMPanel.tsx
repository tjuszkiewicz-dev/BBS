import React, { useState, useMemo, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import {
  User, Company, Order, Commission,
  CRMContact, CRMDeal, CRMActivity, CRMDealStage, CRMActivityType
} from '../../../types';
import {
  Building2, Search, Users, TrendingUp,
  Star, BadgeCheck, AlertCircle,
  Clock, Plus, Kanban, FileText, Activity, X,
  Phone, Mail, CalendarClock, CheckSquare,
  Trash2, CheckCircle2, Circle,
  ArrowRight, BarChart3, Target, Wallet,
  Edit2, History, Award, PieChart as PieChartIcon,
  TrendingDown, Percent, CalendarDays as CalDays
} from 'lucide-react';
import { useStrattonSystem } from '../../../hooks/useStrattonSystem';
import { AddClientModal } from './AddClientModal';

interface CRMPanelProps {
  currentUser: User;
  myCompanies: Company[];
  allUsers: User[];
  orders: Order[];
  commissions: Commission[];
  onAddCompany: (data: Partial<Company>) => void;
}

type CRMView = 'pipeline' | 'klienci' | 'kontakty' | 'aktywnosci' | 'analytics';

const STAGE_LABELS: Record<CRMDealStage, string> = {
  LEAD: 'Lead', CONTACT: 'Kontakt', OFFER: 'Oferta',
  NEGOTIATION: 'Negocjacje', WON: 'Wygrana', LOST: 'Utracona',
};
const STAGE_STYLE: Record<CRMDealStage, { colBg: string; headerBg: string; badge: string; dot: string }> = {
  LEAD:        { colBg: 'bg-slate-50',      headerBg: 'bg-slate-200/60',   badge: 'bg-slate-200 text-slate-700',     dot: 'bg-slate-400'   },
  CONTACT:     { colBg: 'bg-blue-50/40',    headerBg: 'bg-blue-100/80',    badge: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'    },
  OFFER:       { colBg: 'bg-violet-50/40',  headerBg: 'bg-violet-100/80',  badge: 'bg-violet-100 text-violet-700',   dot: 'bg-violet-500'  },
  NEGOTIATION: { colBg: 'bg-amber-50/40',   headerBg: 'bg-amber-100/80',   badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500'   },
  WON:         { colBg: 'bg-emerald-50/40', headerBg: 'bg-emerald-100/80', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  LOST:        { colBg: 'bg-red-50/40',     headerBg: 'bg-red-100/80',     badge: 'bg-red-100 text-red-700',         dot: 'bg-red-400'     },
};
const STAGE_ORDER: CRMDealStage[] = ['LEAD', 'CONTACT', 'OFFER', 'NEGOTIATION', 'WON', 'LOST'];

const ACTIVITY_META: Record<CRMActivityType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  NOTE:    { label: 'Notatka',   icon: <FileText size={13}/>,    color: 'text-slate-600',  bg: 'bg-slate-100' },
  CALL:    { label: 'Telefon',   icon: <Phone size={13}/>,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  EMAIL:   { label: 'E-mail',    icon: <Mail size={13}/>,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
  MEETING: { label: 'Spotkanie', icon: <CalendarClock size={13}/>, color: 'text-violet-600', bg: 'bg-violet-50' },
  TASK:    { label: 'Zadanie',   icon: <CheckSquare size={13}/>, color: 'text-amber-600',  bg: 'bg-amber-50'  },
};

const getCompanyStage = (company: Company, orders: Order[]): 'LEAD' | 'AKTYWNY' | 'KLUCZOWY' => {
  const paid = orders.filter(o => o.companyId === company.id && o.status === 'PAID');
  if (paid.length === 0) return 'LEAD';
  if (company.balanceActive >= 500 || paid.length >= 3) return 'KLUCZOWY';
  return 'AKTYWNY';
};
const COMPANY_STAGE_META = {
  LEAD:     { label: 'Lead',     color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', icon: <Clock size={11}/> },
  AKTYWNY:  { label: 'Aktywny',  color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200',  icon: <BadgeCheck size={11}/> },
  KLUCZOWY: { label: 'Kluczowy', color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200', icon: <Star size={11}/> },
};

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';

const ModalWrap: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-black text-slate-800 text-base">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16}/></button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
    {children}
  </div>
);

// ─── Edit Deal Modal ─────────────────────────────────────────────────────────

const EditDealModal: React.FC<{
  deal: CRMDeal;
  companies: Company[];
  contacts: CRMContact[];
  onSave: (id: string, data: Partial<CRMDeal>) => void;
  onClose: () => void;
}> = ({ deal, companies, contacts, onSave, onClose }) => {
  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(deal.value?.toString() || '');
  const [stage, setStage] = useState<CRMDealStage>(deal.stage);
  const [probability, setProbability] = useState(deal.probability?.toString() || '');
  const [expectedClose, setExpectedClose] = useState(deal.expectedCloseDate || '');
  const [lostReason, setLostReason] = useState(deal.lostReason || '');
  const [contactId, setContactId] = useState(deal.contactId || '');

  const dealContacts = contacts.filter(c => c.companyId === deal.companyId);

  const submit = () => {
    if (!title.trim()) return;
    const updates: Partial<CRMDeal> = {
      title: title.trim(),
      value: value ? parseFloat(value) : undefined,
      stage,
      probability: probability ? parseInt(probability) : undefined,
      expectedCloseDate: expectedClose || undefined,
      lostReason: lostReason || undefined,
      contactId: contactId || undefined,
    };
    if (stage === 'WON' || stage === 'LOST') updates.closedAt = deal.closedAt || new Date().toISOString();
    onSave(deal.id, updates);
    onClose();
  };

  return (
    <ModalWrap title="Edytuj szansę" onClose={onClose}>
      <Field label="Tytuł *">
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)}/>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Wartość (PLN)">
          <input className={inputCls} type="number" value={value} onChange={e => setValue(e.target.value)}/>
        </Field>
        <Field label="Prawdopodobieństwo (%)">
          <input className={inputCls} type="number" min="0" max="100" value={probability} onChange={e => setProbability(e.target.value)}/>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Etap">
          <select className={inputCls} value={stage} onChange={e => setStage(e.target.value as CRMDealStage)}>
            {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="Planowane zamknięcie">
          <input className={inputCls} type="date" value={expectedClose} onChange={e => setExpectedClose(e.target.value)}/>
        </Field>
      </div>
      <Field label="Powiązany kontakt">
        <select className={inputCls} value={contactId} onChange={e => setContactId(e.target.value)}>
          <option value="">— brak —</option>
          {dealContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.position ? ` (${c.position})` : ''}</option>)}
        </select>
      </Field>
      {stage === 'LOST' && (
        <Field label="Powód utraty">
          <input className={inputCls} value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="np. Wybrano konkurencję"/>
        </Field>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">Anuluj</button>
        <button onClick={submit} disabled={!title.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">Zapisz</button>
      </div>
    </ModalWrap>
  );
};

// ─── Edit Contact Modal ───────────────────────────────────────────────────────

const EditContactModal: React.FC<{
  contact: CRMContact;
  onSave: (id: string, data: Partial<CRMContact>) => void;
  onClose: () => void;
}> = ({ contact, onSave, onClose }) => {
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [email, setEmail] = useState(contact.email || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [position, setPosition] = useState(contact.position || '');
  const [isPrimary, setIsPrimary] = useState(contact.isPrimary || false);

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    onSave(contact.id, {
      firstName: firstName.trim(), lastName: lastName.trim(),
      email: email || undefined, phone: phone || undefined,
      position: position || undefined, isPrimary,
    });
    onClose();
  };

  return (
    <ModalWrap title="Edytuj kontakt" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Imię *"><input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)}/></Field>
        <Field label="Nazwisko *"><input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)}/></Field>
      </div>
      <Field label="Stanowisko"><input className={inputCls} value={position} onChange={e => setPosition(e.target.value)} placeholder="np. Dyrektor HR"/></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="E-mail"><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)}/></Field>
        <Field label="Telefon"><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)}/></Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded border-slate-300"/>
        Kontakt główny firmy
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">Anuluj</button>
        <button onClick={submit} disabled={!firstName.trim() || !lastName.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">Zapisz</button>
      </div>
    </ModalWrap>
  );
};

// ─── Edit Company Modal ───────────────────────────────────────────────────────

const EditCompanyModal: React.FC<{
  company: Company;
  allUsers: User[];
  onSave: (id: string, data: Partial<Company>) => void;
  onClose: () => void;
}> = ({ company, allUsers, onSave, onClose }) => {
  const addr = company.address as any;
  const [name, setName] = useState(company.name);
  const [nip, setNip] = useState(company.nip);
  const [street, setStreet] = useState(addr?.street || '');
  const [city, setCity] = useState(addr?.city || '');
  const [zipCode, setZipCode] = useState(addr?.zipCode || '');
  const [advisorId, setAdvisorId] = useState(company.advisorId || '');
  const [managerId, setManagerId] = useState(company.managerId || '');

  const advisors = allUsers.filter(u => u.role === 'ADVISOR' && u.status === 'ACTIVE');
  const managers = allUsers.filter(u => u.role === 'MANAGER' && u.status === 'ACTIVE');

  const submit = () => {
    if (!name.trim()) return;
    onSave(company.id, {
      name: name.trim(),
      nip: nip.trim(),
      advisorId: advisorId || undefined,
      managerId: managerId || undefined,
      address: { street, city, zipCode, country: (addr?.country || 'PL') } as any,
    });
    onClose();
  };

  return (
    <ModalWrap title="Edytuj firmę" onClose={onClose}>
      <Field label="Nazwa firmy *">
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)}/>
      </Field>
      <Field label="NIP">
        <input className={inputCls} value={nip} onChange={e => setNip(e.target.value)} maxLength={10}/>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ulica">
          <input className={inputCls} value={street} onChange={e => setStreet(e.target.value)}/>
        </Field>
        <Field label="Kod pocztowy">
          <input className={inputCls} value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="00-000"/>
        </Field>
      </div>
      <Field label="Miasto">
        <input className={inputCls} value={city} onChange={e => setCity(e.target.value)}/>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Doradca">
          <select className={inputCls} value={advisorId} onChange={e => setAdvisorId(e.target.value)}>
            <option value="">— brak —</option>
            {advisors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Manager">
          <select className={inputCls} value={managerId} onChange={e => setManagerId(e.target.value)}>
            <option value="">— brak —</option>
            {managers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">Anuluj</button>
        <button onClick={submit} disabled={!name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">Zapisz zmiany</button>
      </div>
    </ModalWrap>
  );
};

// ─── Add Deal Modal ───────────────────────────────────────────────────────────

const AddDealModal: React.FC<{
  companies: Company[];
  currentUser: User;
  initialStage?: CRMDealStage;
  initialCompanyId?: string;
  onAdd: (data: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}> = ({ companies, currentUser, initialStage = 'LEAD', initialCompanyId, onAdd, onClose }) => {
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState(initialCompanyId || '');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<CRMDealStage>(initialStage);
  const [probability, setProbability] = useState('50');
  const [expectedClose, setExpectedClose] = useState('');

  const submit = () => {
    if (!title.trim() || !companyId) return;
    onAdd({
      companyId, title: title.trim(),
      value: value ? parseFloat(value) : undefined,
      stage, agentId: currentUser.id,
      probability: probability ? parseInt(probability) : undefined,
      expectedCloseDate: expectedClose || undefined,
    });
    onClose();
  };

  return (
    <ModalWrap title="Nowa szansa sprzedaży" onClose={onClose}>
      <Field label="Tytuł szansy *">
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="np. Wdrożenie benefitów Q3"/>
      </Field>
      <Field label="Firma *">
        <select className={inputCls} value={companyId} onChange={e => setCompanyId(e.target.value)}>
          <option value="">— wybierz firmę —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Wartość (PLN)">
          <input className={inputCls} type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0"/>
        </Field>
        <Field label="Prawdopodobieństwo (%)">
          <input className={inputCls} type="number" min="0" max="100" value={probability} onChange={e => setProbability(e.target.value)}/>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Etap">
          <select className={inputCls} value={stage} onChange={e => setStage(e.target.value as CRMDealStage)}>
            {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="Planowane zamknięcie">
          <input className={inputCls} type="date" value={expectedClose} onChange={e => setExpectedClose(e.target.value)}/>
        </Field>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">Anuluj</button>
        <button onClick={submit} disabled={!title.trim() || !companyId} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">Dodaj szansę</button>
      </div>
    </ModalWrap>
  );
};

// ─── Add Contact Modal ────────────────────────────────────────────────────────

const AddContactModal: React.FC<{
  companies: Company[];
  onAdd: (data: Omit<CRMContact, 'id' | 'createdAt' | 'createdBy'>) => void;
  onClose: () => void;
}> = ({ companies, onAdd, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const submit = () => {
    if (!firstName.trim() || !lastName.trim() || !companyId) return;
    onAdd({ companyId, firstName: firstName.trim(), lastName: lastName.trim(), email: email || undefined, phone: phone || undefined, position: position || undefined, isPrimary });
    onClose();
  };

  return (
    <ModalWrap title="Nowy kontakt" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Imię *"><input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jan"/></Field>
        <Field label="Nazwisko *"><input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Kowalski"/></Field>
      </div>
      <Field label="Firma *">
        <select className={inputCls} value={companyId} onChange={e => setCompanyId(e.target.value)}>
          <option value="">— wybierz firmę —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Stanowisko"><input className={inputCls} value={position} onChange={e => setPosition(e.target.value)} placeholder="np. Dyrektor HR"/></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="E-mail"><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@firma.pl"/></Field>
        <Field label="Telefon"><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+48 500 000 000"/></Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded border-slate-300"/>
        Kontakt główny firmy
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">Anuluj</button>
        <button onClick={submit} disabled={!firstName.trim() || !lastName.trim() || !companyId} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">Dodaj kontakt</button>
      </div>
    </ModalWrap>
  );
};

// ─── Add Activity Modal ───────────────────────────────────────────────────────

const AddActivityModal: React.FC<{
  currentUser: User;
  companies: Company[];
  contacts: CRMContact[];
  deals: CRMDeal[];
  preCompanyId?: string;
  onAdd: (data: Omit<CRMActivity, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}> = ({ currentUser, companies, contacts, deals, preCompanyId, onAdd, onClose }) => {
  const [type, setType] = useState<CRMActivityType>('NOTE');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [companyId, setCompanyId] = useState(preCompanyId || '');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const filteredContacts = contacts.filter(c => !companyId || c.companyId === companyId);
  const filteredDeals = deals.filter(d => !companyId || d.companyId === companyId);

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      type, title: title.trim(), body: body || undefined,
      companyId: companyId || undefined, dealId: dealId || undefined,
      contactId: contactId || undefined, dueDate: dueDate || undefined,
      isDone: false, authorId: currentUser.id, authorName: currentUser.name,
    });
    onClose();
  };

  return (
    <ModalWrap title="Nowa aktywność" onClose={onClose}>
      <Field label="Typ">
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(ACTIVITY_META) as CRMActivityType[]).map(k => {
            const v = ACTIVITY_META[k];
            return (
              <button key={k} onClick={() => setType(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${type === k ? `${v.bg} ${v.color} border-current` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {v.icon}{v.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Tytuł *">
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Krótki opis aktywności"/>
      </Field>
      <Field label="Treść / Notatka">
        <textarea className={`${inputCls} h-20 resize-none`} value={body} onChange={e => setBody(e.target.value)} placeholder="Szczegóły..."/>
      </Field>
      <Field label="Firma">
        <select className={inputCls} value={companyId} onChange={e => setCompanyId(e.target.value)}>
          <option value="">— brak —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kontakt">
          <select className={inputCls} value={contactId} onChange={e => setContactId(e.target.value)}>
            <option value="">— brak —</option>
            {filteredContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </Field>
        <Field label="Szansa">
          <select className={inputCls} value={dealId} onChange={e => setDealId(e.target.value)}>
            <option value="">— brak —</option>
            {filteredDeals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </Field>
      </div>
      {(type === 'TASK' || type === 'MEETING' || type === 'CALL') && (
        <Field label="Termin">
          <input className={inputCls} type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
        </Field>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">Anuluj</button>
        <button onClick={submit} disabled={!title.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">Dodaj</button>
      </div>
    </ModalWrap>
  );
};

// ─── Pipeline View ────────────────────────────────────────────────────────────

const PipelineView: React.FC<{
  deals: CRMDeal[];
  companies: Company[];
  contacts: CRMContact[];
  currentUser: User;
  onUpdateDeal: (id: string, data: Partial<CRMDeal>) => void;
  onDeleteDeal: (id: string) => void;
  onAddDeal: (data: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ deals, companies, contacts, currentUser, onUpdateDeal, onDeleteDeal, onAddDeal }) => {
  const [addingStage, setAddingStage] = useState<CRMDealStage | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);
  const [editingDeal, setEditingDeal] = useState<CRMDeal | null>(null);

  const byStage = useMemo(() => {
    const map: Record<CRMDealStage, CRMDeal[]> = { LEAD: [], CONTACT: [], OFFER: [], NEGOTIATION: [], WON: [], LOST: [] };
    deals.forEach(d => { map[d.stage].push(d); });
    return map;
  }, [deals]);

  const totalByStage = (stage: CRMDealStage) => byStage[stage].reduce((s, d) => s + (d.value || 0), 0);
  const getCompany = (id: string) => companies.find(c => c.id === id);
  const moveStage = (deal: CRMDeal, dir: 1 | -1) => {
    const idx = STAGE_ORDER.indexOf(deal.stage);
    const next = STAGE_ORDER[idx + dir];
    if (next) onUpdateDeal(deal.id, { stage: next });
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 size={16} className="text-indigo-500"/>
          <span className="font-bold text-slate-700">{deals.length} szans</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={16} className="text-emerald-500"/>
          <span className="font-bold text-emerald-700">
            {deals.filter(d => d.stage !== 'LOST').reduce((s, d) => s + (d.value || 0), 0).toLocaleString('pl-PL')} PLN pipeline
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="text-emerald-500"/>
          <span className="font-bold text-slate-700">{byStage.WON.length} wygranych</span>
        </div>
        <button onClick={() => setAddingStage('LEAD')}
          className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
          <Plus size={14}/> Nowa szansa
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGE_ORDER.map(stage => {
          const style = STAGE_STYLE[stage];
          const stageDeals = byStage[stage];
          return (
            <div key={stage} className={`flex-shrink-0 w-64 rounded-2xl border border-slate-200 overflow-hidden flex flex-col ${style.colBg}`}>
              <div className={`px-3 py-2.5 ${style.headerBg} border-b border-slate-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`}/>
                    <span className="font-black text-xs text-slate-700 uppercase tracking-wide">{STAGE_LABELS[stage]}</span>
                    <span className="text-[10px] font-bold bg-white/70 text-slate-600 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                  </div>
                  <button onClick={() => setAddingStage(stage)} className="p-1 rounded-lg hover:bg-white/50 text-slate-500">
                    <Plus size={13}/>
                  </button>
                </div>
                {stageDeals.length > 0 && (
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {totalByStage(stage).toLocaleString('pl-PL')} PLN
                  </p>
                )}
              </div>

              <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                {stageDeals.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-20 text-slate-300">
                    <Target size={20} className="mb-1 opacity-50"/>
                    <p className="text-[10px]">Brak szans</p>
                  </div>
                )}
                {stageDeals.map(deal => {
                  const company = getCompany(deal.companyId);
                  const isSelected = selectedDeal?.id === deal.id;
                  return (
                    <div key={deal.id} onClick={() => setSelectedDeal(isSelected ? null : deal)}
                      className={`bg-white border rounded-xl p-3 cursor-pointer transition-all hover:shadow-sm ${isSelected ? 'border-indigo-400 ring-1 ring-indigo-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-bold text-xs text-slate-800 leading-tight mb-1">{deal.title}</p>
                      {company && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1.5">
                          <Building2 size={9}/> {company.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        {deal.value
                          ? <span className="text-[11px] font-black text-emerald-600">{deal.value.toLocaleString('pl-PL')} PLN</span>
                          : <span className="text-[10px] text-slate-300">brak wartości</span>}
                        {deal.probability !== undefined && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${style.badge}`}>{deal.probability}%</span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2" onClick={e => e.stopPropagation()}>
                          {deal.expectedCloseDate && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={9}/> {new Date(deal.expectedCloseDate).toLocaleDateString('pl-PL')}
                            </p>
                          )}
                          {/* Stage history */}
                          {deal.stageHistory && deal.stageHistory.length > 1 && (
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><History size={9}/>Historia etapów</p>
                              {deal.stageHistory.map((h, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] text-slate-400">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STAGE_STYLE[h.stage].dot}`}/>
                                  <span className="font-medium">{STAGE_LABELS[h.stage]}</span>
                                  <span className="opacity-60">{new Date(h.changedAt).toLocaleDateString('pl-PL')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1 flex-wrap">
                            {STAGE_ORDER.indexOf(deal.stage) > 0 && (
                              <button onClick={() => moveStage(deal, -1)} className="flex items-center gap-1 text-[10px] py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium">
                                ← Cofnij
                              </button>
                            )}
                            {STAGE_ORDER.indexOf(deal.stage) < STAGE_ORDER.length - 1 && (
                              <button onClick={() => moveStage(deal, 1)} className="flex items-center gap-1 text-[10px] py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium">
                                Dalej <ArrowRight size={9}/>
                              </button>
                            )}
                            <button onClick={() => setEditingDeal(deal)} className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400">
                              <Edit2 size={10}/>
                            </button>
                            <button onClick={() => onDeleteDeal(deal.id)} className="ml-auto p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500">
                              <Trash2 size={10}/>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {addingStage && (
        <AddDealModal companies={companies} currentUser={currentUser} initialStage={addingStage}
          onAdd={onAddDeal} onClose={() => setAddingStage(null)}/>
      )}
      {editingDeal && (
        <EditDealModal deal={editingDeal} companies={companies} contacts={contacts} onSave={onUpdateDeal} onClose={() => setEditingDeal(null)}/>
      )}
    </div>
  );
};

// ─── Klienci View ─────────────────────────────────────────────────────────────

const KlienciView: React.FC<{
  currentUser: User;
  myCompanies: Company[];
  allUsers: User[];
  orders: Order[];
  commissions: Commission[];
  crmDeals: CRMDeal[];
  crmContacts: CRMContact[];
  crmActivities: CRMActivity[];
  onAddCompany: (data: Partial<Company>) => void;
  onUpdateCompany: (id: string, data: Partial<Company>) => void;
  onAddDeal: (data: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddActivity: (data: Omit<CRMActivity, 'id' | 'createdAt'>) => void;
}> = ({ currentUser, myCompanies, allUsers, orders, commissions, crmDeals, crmContacts, crmActivities, onAddCompany, onUpdateCompany, onAddDeal, onAddActivity }) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'LEAD' | 'AKTYWNY' | 'KLUCZOWY'>('ALL');
  const [drawerCompany, setDrawerCompany] = useState<Company | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'contacts' | 'deals' | 'activities'>('overview');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [addDealCompanyId, setAddDealCompanyId] = useState<string | null>(null);
  const [inlineNote, setInlineNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const enriched = useMemo(() => myCompanies.map(c => {
    const paid = orders.filter(o => o.companyId === c.id && o.status === 'PAID');
    const employees = allUsers.filter(u => u.companyId === c.id);
    const advisor = allUsers.find(u => u.id === c.advisorId);
    const myComm = commissions.filter(cm => paid.some(o => o.id === cm.orderId) && cm.agentId === currentUser.id);
    const companyOrders = orders.filter(o => o.companyId === c.id);
    const pendingOrders = companyOrders.filter(o => o.status === 'PENDING').length;
    return {
      company: c, stage: getCompanyStage(c, orders),
      employeeCount: employees.length, orderCount: paid.length,
      totalRevenue: paid.reduce((a, b) => a + b.totalValue, 0),
      totalCommission: myComm.reduce((a, b) => a + b.amount, 0),
      advisor, pendingOrders,
    };
  }), [myCompanies, orders, allUsers, commissions, currentUser.id]);

  const filtered = useMemo(() => enriched.filter(e => {
    const matchSearch = e.company.name.toLowerCase().includes(search.toLowerCase()) || e.company.nip.includes(search);
    const matchStage = stageFilter === 'ALL' || e.stage === stageFilter;
    return matchSearch && matchStage;
  }), [enriched, search, stageFilter]);

  const stageCounts = {
    ALL: enriched.length,
    LEAD: enriched.filter(e => e.stage === 'LEAD').length,
    AKTYWNY: enriched.filter(e => e.stage === 'AKTYWNY').length,
    KLUCZOWY: enriched.filter(e => e.stage === 'KLUCZOWY').length,
  };

  const drawerDeals = drawerCompany ? crmDeals.filter(d => d.companyId === drawerCompany.id) : [];
  const drawerContacts = drawerCompany ? crmContacts.filter(c => c.companyId === drawerCompany.id) : [];
  const drawerActivities = drawerCompany ? crmActivities.filter(a => a.companyId === drawerCompany.id) : [];

  return (
    <div className="flex gap-5 items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-black text-slate-600">{filtered.length} firm</span>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Plus size={13}/> Dodaj klienta
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj nazwy lub NIP..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"/>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['ALL', 'LEAD', 'AKTYWNY', 'KLUCZOWY'] as const).map(s => (
              <button key={s} onClick={() => setStageFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${stageFilter === s ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {s === 'ALL' ? 'Wszyscy' : s} <span className="opacity-50">({stageCounts[s]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-slate-300">
              <Building2 size={32} className="mb-2 opacity-40"/>
              <p className="text-sm font-medium">Brak firm</p>
            </div>
          )}
          {filtered.map(({ company, stage, employeeCount, orderCount, totalRevenue, totalCommission, advisor, pendingOrders }) => {
            const meta = COMPANY_STAGE_META[stage];
            const isActive = drawerCompany?.id === company.id;
            return (
              <div key={company.id} onClick={() => { setDrawerCompany(isActive ? null : company); setDrawerTab('overview'); }}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${isActive ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-indigo-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h4 className="font-black text-sm text-slate-800 truncate">{company.name}</h4>
                      <span className={`flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${meta.color} ${meta.bg} ${meta.border}`}>
                        {meta.icon}{meta.label}
                      </span>
                      {pendingOrders > 0 && (
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                          <AlertCircle size={8} className="inline mr-0.5"/>{pendingOrders}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">NIP: {company.nip}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Saldo</div>
                      <div className="text-xs font-black text-emerald-600">{company.balanceActive} pkt</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Pracownicy</div>
                      <div className="text-xs font-black text-slate-700">{employeeCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Prowizje</div>
                      <div className="text-xs font-black text-amber-600">{totalCommission.toFixed(0)} PLN</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setAddDealCompanyId(company.id); setShowAddDealModal(true); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                      <Plus size={10}/> Szansa
                    </button>
                    <ArrowRight size={14} className={`text-slate-300 transition-transform ${isActive ? 'rotate-90 text-indigo-400' : ''}`}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block w-[380px] shrink-0">
      {drawerCompany && (
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg sticky top-4">
          <div className="flex items-start justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
            <div>
              <h3 className="font-black text-slate-800 text-sm">{drawerCompany.name}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIP: {drawerCompany.nip}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1 font-bold text-emerald-600"><Wallet size={11}/>{drawerCompany.balanceActive} pkt</span>
                <span className="flex items-center gap-1 text-slate-500"><Users size={11}/>{allUsers.filter(u => u.companyId === drawerCompany.id).length} prac.</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditingCompany(drawerCompany)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-slate-400 hover:text-indigo-600" title="Edytuj firmę"><Edit2 size={13}/></button>
              <button onClick={() => setDrawerCompany(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={14}/></button>
            </div>
          </div>
          <div className="flex border-b border-slate-100">
            {([
              { key: 'overview' as const, label: 'Przegląd' },
              { key: 'contacts' as const, label: `Kontakty (${drawerContacts.length})` },
              { key: 'deals' as const, label: `Szanse (${drawerDeals.length})` },
              { key: 'activities' as const, label: `Aktywności (${drawerActivities.length})` },
            ]).map(t => (
              <button key={t.key} onClick={() => setDrawerTab(t.key)}
                className={`flex-1 py-2.5 text-[9px] font-bold transition-colors whitespace-nowrap ${drawerTab === t.key ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {drawerTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Saldo aktywne', val: `${drawerCompany.balanceActive} pkt`, color: 'text-emerald-600' },
                    { label: 'Saldo oczekujące', val: `${drawerCompany.balancePending} pkt`, color: 'text-amber-500' },
                    { label: 'Zamówienia', val: orders.filter(o => o.companyId === drawerCompany.id && o.status === 'PAID').length.toString(), color: 'text-slate-700' },
                    { label: 'Szanse CRM', val: drawerDeals.length.toString(), color: 'text-indigo-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                      <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
                      <div className={`font-black text-base mt-0.5 ${s.color}`}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {drawerCompany.address && (
                  <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                    <p className="font-bold text-slate-600 mb-1 text-[10px] uppercase tracking-wide">Adres</p>
                    {typeof drawerCompany.address === 'string' ? drawerCompany.address : `${(drawerCompany.address as any)?.street || ''} ${(drawerCompany.address as any)?.city || ''}`.trim()}
                  </div>
                )}
                <button onClick={() => setShowActivityModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-xs font-bold text-indigo-500 hover:bg-indigo-50 transition-colors">
                  <Plus size={13}/> Dodaj aktywność
                </button>
                {/* Inline quick note */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Szybka notatka</p>
                  <textarea
                    className={`${inputCls} h-16 resize-none text-xs`}
                    placeholder="Dodaj krótką notatkę do firmy..."
                    value={inlineNote}
                    onChange={e => setInlineNote(e.target.value)}
                  />
                  <button
                    disabled={!inlineNote.trim()}
                    onClick={() => {
                      if (!inlineNote.trim() || !drawerCompany) return;
                      onAddActivity({
                        type: 'NOTE', title: inlineNote.trim(),
                        companyId: drawerCompany.id,
                        authorId: currentUser.id, authorName: currentUser.name,
                        isDone: false,
                      });
                      setInlineNote('');
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-40 transition-colors">
                    Zapisz notatkę
                  </button>
                </div>
              </>
            )}
            {drawerTab === 'contacts' && (
              <div className="space-y-2">
                {drawerContacts.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Brak kontaktów</p>}
                {drawerContacts.map(c => (
                  <div key={c.id} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{c.firstName} {c.lastName}</p>
                        {c.position && <p className="text-[10px] text-slate-400">{c.position}</p>}
                      </div>
                      {c.isPrimary && <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">GŁÓWNY</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {c.email && <a href={`mailto:${c.email}`} className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1"><Mail size={9}/>{c.email}</a>}
                      {c.phone && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={9}/>{c.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {drawerTab === 'deals' && (
              <div className="space-y-2">
                <button onClick={() => { setAddDealCompanyId(drawerCompany.id); setShowAddDealModal(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-indigo-200 text-xs font-bold text-indigo-500 hover:bg-indigo-50 mb-2">
                  <Plus size={13}/> Dodaj szansę
                </button>
                {drawerDeals.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Brak szans</p>}
                {drawerDeals.map(d => {
                  const style = STAGE_STYLE[d.stage];
                  return (
                    <div key={d.id} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{d.title}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block ${style.badge}`}>{STAGE_LABELS[d.stage]}</span>
                        </div>
                        {d.value && <span className="text-xs font-black text-emerald-600">{d.value.toLocaleString('pl-PL')} PLN</span>}
                      </div>
                      {d.probability !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Prawdopodobieństwo</span><span className="font-bold">{d.probability}%</span>
                          </div>
                          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${d.probability}%` }}/>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {drawerTab === 'activities' && (
              <div className="space-y-2">
                <button onClick={() => setShowActivityModal(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-indigo-200 text-xs font-bold text-indigo-500 hover:bg-indigo-50 mb-2">
                  <Plus size={13}/> Dodaj aktywność
                </button>
                {drawerActivities.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Brak aktywności</p>}
                {drawerActivities.map(a => {
                  const meta = ACTIVITY_META[a.type];
                  return (
                    <div key={a.id} className={`rounded-xl p-3 border border-slate-200 ${meta.bg}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={meta.color}>{meta.icon}</span>
                        <span className="font-bold text-xs text-slate-800">{a.title}</span>
                        <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      </div>
                      {a.body && <p className="text-[10px] text-slate-500">{a.body}</p>}
                      <p className="text-[9px] text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString('pl-PL')}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {showAddDealModal && (
        <AddDealModal companies={myCompanies} currentUser={currentUser} initialStage="LEAD"
          initialCompanyId={addDealCompanyId || undefined}
          onAdd={onAddDeal} onClose={() => { setShowAddDealModal(false); setAddDealCompanyId(null); }}/>
      )}
      {showAddModal && <AddClientModal currentUser={currentUser} allUsers={allUsers} onAdd={onAddCompany} onClose={() => setShowAddModal(false)}/>}
      {editingCompany && <EditCompanyModal company={editingCompany} allUsers={allUsers} onSave={onUpdateCompany} onClose={() => setEditingCompany(null)}/>}
      {showActivityModal && drawerCompany && (
        <AddActivityModal currentUser={currentUser} companies={myCompanies} contacts={crmContacts} deals={crmDeals}
          preCompanyId={drawerCompany.id} onAdd={onAddActivity} onClose={() => setShowActivityModal(false)}/>
      )}
    </div>
  );
};

// ─── Kontakty View ────────────────────────────────────────────────────────────

const KontaktyView: React.FC<{
  contacts: CRMContact[];
  companies: Company[];
  onAddContact: (data: Omit<CRMContact, 'id' | 'createdAt' | 'createdBy'>) => void;
  onUpdateContact: (id: string, data: Partial<CRMContact>) => void;
  onDeleteContact: (id: string) => void;
}> = ({ contacts, companies, onAddContact, onUpdateContact, onDeleteContact }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');

  const filtered = useMemo(() => contacts.filter(c => {
    const matchSearch = `${c.firstName} ${c.lastName} ${c.email || ''} ${c.position || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchCompany = !companyFilter || c.companyId === companyFilter;
    return matchSearch && matchCompany;
  }), [contacts, search, companyFilter]);

  const getCompany = (id: string) => companies.find(c => c.id === id);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj kontaktu..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"/>
        </div>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">Wszystkie firmy</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 whitespace-nowrap">
          <Plus size={13}/> Dodaj kontakt
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-14 text-slate-300">
          <Users size={36} className="mb-2 opacity-40"/>
          <p className="text-sm font-medium">{contacts.length === 0 ? 'Brak kontaktów' : 'Brak wyników'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(contact => {
          const company = getCompany(contact.companyId);
          return (
            <div key={contact.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all hover:border-slate-300">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800">{contact.firstName} {contact.lastName}</p>
                    {contact.position && <p className="text-[10px] text-slate-400">{contact.position}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {contact.isPrimary && <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">GŁÓWNY</span>}
                  <button onClick={() => setEditingContact(contact)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-500"><Edit2 size={11}/></button>
                  <button onClick={() => onDeleteContact(contact.id)} className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400"><Trash2 size={11}/></button>
                </div>
              </div>
              {company && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1 mb-2">
                  <Building2 size={9}/> {company.name}
                </div>
              )}
              <div className="space-y-1">
                {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"><Mail size={11}/>{contact.email}</a>}
                {contact.phone && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={11}/>{contact.phone}</span>}
              </div>
              <p className="text-[9px] text-slate-300 mt-2">Dodano {new Date(contact.createdAt).toLocaleDateString('pl-PL')}</p>
            </div>
          );
        })}
      </div>

      {showModal && <AddContactModal companies={companies} onAdd={onAddContact} onClose={() => setShowModal(false)}/>}
      {editingContact && <EditContactModal contact={editingContact} onSave={onUpdateContact} onClose={() => setEditingContact(null)}/>}
    </div>
  );
};

// ─── Aktywności View ──────────────────────────────────────────────────────────

const AktywnosciView: React.FC<{
  activities: CRMActivity[];
  companies: Company[];
  contacts: CRMContact[];
  deals: CRMDeal[];
  currentUser: User;
  onAddActivity: (data: Omit<CRMActivity, 'id' | 'createdAt'>) => void;
  onUpdateActivity: (id: string, data: Partial<CRMActivity>) => void;
  onDeleteActivity: (id: string) => void;
}> = ({ activities, companies, contacts, deals, currentUser, onAddActivity, onUpdateActivity, onDeleteActivity }) => {
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CRMActivityType | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const sorted = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return typeFilter !== 'ALL' ? sorted.filter(a => a.type === typeFilter) : sorted;
  }, [activities, typeFilter]);

  const getCompany = (id?: string) => id ? companies.find(c => c.id === id) : undefined;
  const getDeal = (id?: string) => id ? deals.find(d => d.id === id) : undefined;
  const getContact = (id?: string) => id ? contacts.find(c => c.id === id) : undefined;
  const pending = activities.filter(a => a.type === 'TASK' && !a.isDone).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button onClick={() => setTypeFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              Wszystkie
            </button>
            {(Object.keys(ACTIVITY_META) as CRMActivityType[]).map(k => {
              const v = ACTIVITY_META[k];
              return (
                <button key={k} onClick={() => setTypeFilter(k)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === k ? `bg-white shadow ${v.color}` : 'text-slate-500 hover:text-slate-700'}`}>
                  {v.icon}{v.label}
                </button>
              );
            })}
          </div>
          {pending > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">{pending} zadań</span>}
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20">
          <Plus size={13}/> Dodaj aktywność
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-14 text-slate-300">
          <Activity size={36} className="mb-2 opacity-40"/>
          <p className="text-sm font-medium">{activities.length === 0 ? 'Brak aktywności' : 'Brak wyników'}</p>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200"/>
        <div className="space-y-3">
          {filtered.map(activity => {
            const meta = ACTIVITY_META[activity.type];
            const company = getCompany(activity.companyId);
            const deal = getDeal(activity.dealId);
            const contact = getContact(activity.contactId);
            const isTask = activity.type === 'TASK';
            return (
              <div key={activity.id} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${meta.bg} ${meta.color} border-2 border-white shadow-sm`}>
                  {meta.icon}
                </div>
                <div className={`flex-1 rounded-xl border p-3 mb-1 ${isTask && !activity.isDone ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'} ${activity.isDone ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                        <p className={`font-bold text-sm text-slate-800 ${activity.isDone ? 'line-through text-slate-400' : ''}`}>{activity.title}</p>
                      </div>
                      {activity.body && <p className="text-xs text-slate-500 mt-1">{activity.body}</p>}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {company && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Building2 size={9}/>{company.name}</span>}
                        {contact && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Users size={9}/>{contact.firstName} {contact.lastName}</span>}
                        {deal && <span className="text-[10px] text-indigo-400 flex items-center gap-0.5"><Target size={9}/>{deal.title}</span>}
                        {activity.dueDate && (
                          <span className={`text-[10px] flex items-center gap-0.5 ${new Date(activity.dueDate) < new Date() && !activity.isDone ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                            <Clock size={9}/>{new Date(activity.dueDate).toLocaleString('pl-PL')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isTask && (
                        <button onClick={() => onUpdateActivity(activity.id, { isDone: !activity.isDone })}
                          className={`p-1.5 rounded-lg transition-colors ${activity.isDone ? 'bg-emerald-100 text-emerald-500 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                          {activity.isDone ? <CheckCircle2 size={13}/> : <Circle size={13}/>}
                        </button>
                      )}
                      <button onClick={() => onDeleteActivity(activity.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400">
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-300 mt-2">{activity.authorName} · {new Date(activity.createdAt).toLocaleString('pl-PL')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && <AddActivityModal currentUser={currentUser} companies={companies} contacts={contacts} deals={deals} onAdd={onAddActivity} onClose={() => setShowModal(false)}/>}
    </div>
  );
};

// ─── Analytics View ──────────────────────────────────────────────────────────

const ANALYTICS_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsView: React.FC<{
  deals: CRMDeal[];
  activities: CRMActivity[];
  allUsers: User[];
  companies: Company[];
}> = ({ deals, activities, allUsers, companies }) => {
  const [sub, setSub] = useState<'dashboard' | 'forecast' | 'leaderboard' | 'activity'>('dashboard');

  // ── Item 6: Dashboard KPI ──────────────────────────────────────────────────
  const won = deals.filter(d => d.stage === 'WON');
  const lost = deals.filter(d => d.stage === 'LOST');
  const closed = won.length + lost.length;
  const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0;
  const avgDealValue = won.length > 0 ? Math.round(won.reduce((s, d) => s + (d.value || 0), 0) / won.length) : 0;
  const pipelineValue = deals.filter(d => !['WON', 'LOST'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0);
  const weightedPipeline = deals
    .filter(d => !['WON', 'LOST'].includes(d.stage))
    .reduce((s, d) => s + (d.value || 0) * ((d.probability || 50) / 100), 0);

  const stageData = (Object.keys(STAGE_LABELS) as CRMDealStage[]).map(s => ({
    name: STAGE_LABELS[s],
    count: deals.filter(d => d.stage === s).length,
    value: Math.round(deals.filter(d => d.stage === s).reduce((acc, d) => acc + (d.value || 0), 0)),
  }));

  // ── Item 7: Forecast ──────────────────────────────────────────────────────
  const forecastData = useMemo(() => {
    const months: Record<string, { month: string; weighted: number; best: number }> = {};
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: d.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' }), weighted: 0, best: 0 };
    }
    deals.filter(d => !['WON', 'LOST'].includes(d.stage) && d.expectedCloseDate).forEach(deal => {
      const key = deal.expectedCloseDate!.slice(0, 7);
      if (months[key]) {
        const v = deal.value || 0;
        months[key].weighted += Math.round(v * ((deal.probability || 50) / 100));
        months[key].best += v;
      }
    });
    return Object.values(months);
  }, [deals]);

  // ── Item 8: Leaderboard ───────────────────────────────────────────────────
  const leaderboard = useMemo(() => {
    const map: Record<string, { userId: string; name: string; won: number; total: number; value: number }> = {};
    deals.forEach(deal => {
      const u = allUsers.find(u => u.id === deal.agentId);
      const name = u ? u.name : deal.agentId;
      if (!map[deal.agentId]) map[deal.agentId] = { userId: deal.agentId, name, won: 0, total: 0, value: 0 };
      map[deal.agentId].total++;
      if (deal.stage === 'WON') { map[deal.agentId].won++; map[deal.agentId].value += deal.value || 0; }
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [deals, allUsers]);

  // ── Item 9: Activity report ───────────────────────────────────────────────
  const activityData = useMemo(() => {
    const types: CRMActivityType[] = ['CALL', 'MEETING', 'EMAIL', 'TASK', 'NOTE'];
    const typeLabels: Record<CRMActivityType, string> = { CALL: 'Telefon', MEETING: 'Spotkanie', EMAIL: 'E-mail', TASK: 'Zadanie', NOTE: 'Notatka' };
    return types.map(t => ({ name: typeLabels[t], count: activities.filter(a => a.type === t).length, done: activities.filter(a => a.type === t && a.isDone).length }));
  }, [activities]);

  const weeklyActivity = useMemo(() => {
    const weeks: Record<string, number> = {};
    activities.forEach(a => {
      const d = new Date(a.createdAt);
      const startOfWeek = new Date(d); startOfWeek.setDate(d.getDate() - d.getDay());
      const key = startOfWeek.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.entries(weeks).slice(-8).map(([week, count]) => ({ week, count }));
  }, [activities]);

  const SUB_TABS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'forecast',  label: 'Prognoza' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'activity', label: 'Aktywności' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {SUB_TABS.map(t => (
          <button key={t.key} onClick={() => setSub(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sub === t.key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {sub === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Win Rate', val: `${winRate}%`, sub: `${won.length}/${closed} zamkniętych`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'ᗞbr. wartość wygranego', val: `${avgDealValue.toLocaleString('pl-PL')} PLN`, sub: `${won.length} wygranych dealów`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Pipeline', val: `${(pipelineValue/1000).toFixed(0)}k PLN`, sub: 'aktywne okazje', color: 'text-slate-700', bg: 'bg-slate-50' },
              { label: 'Ważony pipeline', val: `${(weightedPipeline/1000).toFixed(0)}k PLN`, sub: 'wg. prawdopodobieństwa', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-700 mb-3">Rozkład pipeline wg etapu</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stageData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false}/>
                <YAxis tick={{ fontSize: 9 }} tickLine={false}/>
                <Tooltip formatter={(v: number) => v.toLocaleString('pl-PL')}/>
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Wartość PLN"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Forecast */}
      {sub === 'forecast' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-black text-slate-700 mb-1">Prognoza sprzedaży — najbliższe 6 miesięcy</p>
          <p className="text-[10px] text-slate-400 mb-3">Na podstawie oczekiwanych dat zamknięcia i prawdopodobieństwa</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={forecastData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false}/>
              <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v: number) => `${v.toLocaleString('pl-PL')} PLN`}/>
              <Bar dataKey="best" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="Optymistyczna"/>
              <Bar dataKey="weighted" fill="#6366f1" radius={[4, 4, 0, 0]} name="Ważona"/>
            </BarChart>
          </ResponsiveContainer>
          {forecastData.every(f => f.weighted === 0) && (
            <p className="text-center text-xs text-slate-400 mt-4">Uzupełnij daty zamknięcia w dealach, aby zobaczyć prognozę</p>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {sub === 'leaderboard' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-black text-slate-700">Leaderboard agentów</p>
            <p className="text-[10px] text-slate-400">Ranking wg wartości wygranych dealów</p>
          </div>
          {leaderboard.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-300"><Award size={28} className="mb-2"/><p className="text-xs">Brak danych</p></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {leaderboard.map((row, i) => (
                <div key={row.userId} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                  }`}>{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{row.name}</p>
                    <p className="text-[10px] text-slate-400">{row.won}/{row.total} dealów wygranych</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-600">{row.value.toLocaleString('pl-PL')} PLN</p>
                    <p className="text-[10px] text-slate-400">{row.total > 0 ? Math.round((row.won / row.total) * 100) : 0}% win rate</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Report */}
      {sub === 'activity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {activityData.map((a, i) => (
              <div key={a.name} className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-slate-800">{a.count}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{a.name}</p>
                {a.done > 0 && <p className="text-[9px] text-emerald-500">{a.done} zakończonych</p>}
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-700 mb-3">Aktywność tygodniowa</p>
            {weeklyActivity.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Brak danych aktywności</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyActivity} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} tickLine={false}/>
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} allowDecimals={false}/>
                  <Tooltip/>
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Aktywności"/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main CRMPanel ────────────────────────────────────────────────────────────

export const CRMPanel: React.FC<CRMPanelProps> = ({
  currentUser, myCompanies, allUsers, orders, commissions, onAddCompany,
}) => {
  const { state, actions } = useStrattonSystem();
  const [view, setView] = useState<CRMView>('pipeline');

  const { crmContacts, crmDeals, crmActivities } = state;
  const {
    handleAddCrmContact, handleUpdateCrmContact, handleDeleteCrmContact,
    handleAddCrmDeal, handleUpdateCrmDeal, handleDeleteCrmDeal,
    handleAddCrmActivity, handleUpdateCrmActivity, handleDeleteCrmActivity,
  } = actions;

  const totalDeals = crmDeals.length;
  const wonDeals = crmDeals.filter(d => d.stage === 'WON').length;
  const pipeline = crmDeals.filter(d => d.stage !== 'LOST').reduce((s, d) => s + (d.value || 0), 0);
  const pendingTasks = crmActivities.filter(a => a.type === 'TASK' && !a.isDone).length;

  const TABS: { key: CRMView; label: string; icon: React.ReactNode }[] = [
    { key: 'pipeline',    label: 'Pipeline',     icon: <Kanban size={14}/> },
    { key: 'klienci',     label: 'Klienci',      icon: <Building2 size={14}/> },
    { key: 'kontakty',    label: 'Kontakty',     icon: <Users size={14}/> },
    { key: 'aktywnosci',  label: 'Aktywności',   icon: <Activity size={14}/> },
    { key: 'analytics',   label: 'Analityka',    icon: <BarChart3 size={14}/> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">CRM</h2>
          <p className="text-xs text-slate-400 mt-0.5">Zarządzaj relacjami, szansami i aktywnościami</p>
        </div>
        <div className="hidden lg:flex items-center gap-5">
          {[
            { label: 'Szanse', val: totalDeals, icon: <Target size={13}/>, color: 'text-indigo-600' },
            { label: 'Wygrane', val: wonDeals, icon: <CheckCircle2 size={13}/>, color: 'text-emerald-600' },
            { label: 'Pipeline', val: `${(pipeline / 1000).toFixed(0)}k PLN`, icon: <TrendingUp size={13}/>, color: 'text-slate-700' },
            { label: 'Zadania', val: pendingTasks, icon: <CheckSquare size={13}/>, color: pendingTasks > 0 ? 'text-amber-600' : 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-sm">
              <span className={s.color}>{s.icon}</span>
              <span className="font-black text-slate-800">{s.val}</span>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${view === t.key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {view === 'pipeline' && (
        <PipelineView deals={crmDeals} companies={myCompanies} contacts={crmContacts} currentUser={currentUser}
          onUpdateDeal={handleUpdateCrmDeal} onDeleteDeal={handleDeleteCrmDeal} onAddDeal={handleAddCrmDeal}/>
      )}
      {view === 'klienci' && (
        <KlienciView currentUser={currentUser} myCompanies={myCompanies} allUsers={allUsers}
          orders={orders} commissions={commissions}
          crmDeals={crmDeals} crmContacts={crmContacts} crmActivities={crmActivities}
          onAddCompany={onAddCompany} onUpdateCompany={actions.handleUpdateCompanyConfig} onAddDeal={handleAddCrmDeal} onAddActivity={handleAddCrmActivity}/>
      )}
      {view === 'kontakty' && (
        <KontaktyView contacts={crmContacts} companies={myCompanies}
          onAddContact={handleAddCrmContact} onUpdateContact={handleUpdateCrmContact} onDeleteContact={handleDeleteCrmContact}/>
      )}
      {view === 'analytics' && (
        <AnalyticsView deals={crmDeals} activities={crmActivities} allUsers={allUsers} companies={myCompanies}/>
      )}
      {view === 'aktywnosci' && (
        <AktywnosciView activities={crmActivities} companies={myCompanies}
          contacts={crmContacts} deals={crmDeals} currentUser={currentUser}
          onAddActivity={handleAddCrmActivity} onUpdateActivity={handleUpdateCrmActivity}
          onDeleteActivity={handleDeleteCrmActivity}/>
      )}
    </div>
  );
};
