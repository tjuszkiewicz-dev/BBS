import React, { useState, useMemo, useCallback } from 'react';
import {
  User, Company, CRMActivity, CRMActivityType, CRMDeal, CRMContact,
} from '../../../types';
import {
  ChevronLeft, ChevronRight, Plus, X, CalendarDays, List,
  Phone, Mail, CalendarClock, CheckSquare, FileText,
  Building2, Target, CheckCircle2, Circle, Trash2,
  Clock, Users, Calendar,
} from 'lucide-react';
import { useStrattonSystem } from '../../../hooks/useStrattonSystem';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const ACTIVITY_META: Record<CRMActivityType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; dot: string }> = {
  NOTE:    { label: 'Notatka',   icon: <FileText size={12}/>,       color: 'text-slate-600',  bg: 'bg-slate-100',   border: 'border-slate-200', dot: 'bg-slate-400'   },
  CALL:    { label: 'Telefon',   icon: <Phone size={12}/>,          color: 'text-blue-600',   bg: 'bg-blue-50',     border: 'border-blue-200',  dot: 'bg-blue-500'    },
  EMAIL:   { label: 'E-mail',    icon: <Mail size={12}/>,           color: 'text-indigo-600', bg: 'bg-indigo-50',   border: 'border-indigo-200',dot: 'bg-indigo-500'  },
  MEETING: { label: 'Spotkanie', icon: <CalendarClock size={12}/>,  color: 'text-violet-600', bg: 'bg-violet-50',   border: 'border-violet-200',dot: 'bg-violet-500'  },
  TASK:    { label: 'Zadanie',   icon: <CheckSquare size={12}/>,    color: 'text-amber-600',  bg: 'bg-amber-50',    border: 'border-amber-200', dot: 'bg-amber-500'   },
};

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

const isoDate = (d: Date) => d.toISOString().split('T')[0];

const startOfMonth = (y: number, m: number) => new Date(y, m, 1);
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
// Monday-first weekday: Mon=0 … Sun=6
const weekdayMon = (d: Date) => (d.getDay() + 6) % 7;

const getMondayOfWeek = (d: Date) => {
  const c = new Date(d);
  c.setDate(c.getDate() - weekdayMon(c));
  c.setHours(0, 0, 0, 0);
  return c;
};

const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

// ─── Inline modals ────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';

const ModalWrap: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
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

interface AddEventModalProps {
  currentUser: User;
  companies: Company[];
  contacts: CRMContact[];
  deals: CRMDeal[];
  prefillDate?: string;       // YYYY-MM-DD
  prefillType?: CRMActivityType;
  onAdd: (data: Omit<CRMActivity, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  currentUser, companies, contacts, deals, prefillDate, prefillType = 'MEETING', onAdd, onClose,
}) => {
  const [type, setType] = useState<CRMActivityType>(prefillType);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [dueDate, setDueDate] = useState(prefillDate ? `${prefillDate}T09:00` : '');

  const filteredContacts = contacts.filter(c => !companyId || c.companyId === companyId);
  const filteredDeals = deals.filter(d => !companyId || d.companyId === companyId);

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      type, title: title.trim(), body: body || undefined,
      companyId: companyId || undefined, dealId: dealId || undefined,
      contactId: contactId || undefined,
      dueDate: dueDate || undefined,
      isDone: false,
      authorId: currentUser.id, authorName: currentUser.name,
    });
    onClose();
  };

  return (
    <ModalWrap title="Nowe wydarzenie" onClose={onClose}>
      <Field label="Typ">
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(ACTIVITY_META) as CRMActivityType[]).map(k => {
            const v = ACTIVITY_META[k];
            return (
              <button key={k} onClick={() => setType(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${type === k ? `${v.bg} ${v.color} ${v.border}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {v.icon}{v.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Tytuł *">
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Opis wydarzenia"/>
      </Field>
      <Field label="Data i godzina">
        <input className={inputCls} type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
      </Field>
      <Field label="Notatka">
        <textarea className={`${inputCls} h-16 resize-none`} value={body} onChange={e => setBody(e.target.value)} placeholder="Szczegóły..."/>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Firma">
          <select className={inputCls} value={companyId} onChange={e => setCompanyId(e.target.value)}>
            <option value="">— brak —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Kontakt">
          <select className={inputCls} value={contactId} onChange={e => setContactId(e.target.value)}>
            <option value="">— brak —</option>
            {filteredContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Szansa CRM">
        <select className={inputCls} value={dealId} onChange={e => setDealId(e.target.value)}>
          <option value="">— brak —</option>
          {filteredDeals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
      </Field>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50">Anuluj</button>
        <button onClick={submit} disabled={!title.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">
          Dodaj
        </button>
      </div>
    </ModalWrap>
  );
};

// ─── Event Detail Sidebar ─────────────────────────────────────────────────────

interface EventDetailProps {
  activity: CRMActivity;
  companies: Company[];
  deals: CRMDeal[];
  contacts: CRMContact[];
  onUpdate: (id: string, data: Partial<CRMActivity>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ activity, companies, deals, contacts, onUpdate, onDelete, onClose }) => {
  const meta = ACTIVITY_META[activity.type];
  const company = companies.find(c => c.id === activity.companyId);
  const deal = deals.find(d => d.id === activity.dealId);
  const contact = contacts.find(c => c.id === activity.contactId);
  const isTask = activity.type === 'TASK';
  const overdue = activity.dueDate && !activity.isDone && new Date(activity.dueDate) < new Date();

  return (
    <div className="flex flex-col h-full">
      <div className={`px-5 py-4 border-b border-slate-100 flex items-start justify-between ${meta.bg}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
              {meta.icon}{meta.label}
            </span>
            {overdue && <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">PO TERMINIE</span>}
          </div>
          <h3 className={`font-black text-slate-800 text-base leading-tight ${activity.isDone ? 'line-through text-slate-400' : ''}`}>{activity.title}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/70 text-slate-400 shrink-0 ml-2"><X size={15}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activity.body && (
          <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{activity.body}</div>
        )}

        <div className="space-y-2.5">
          {activity.dueDate && (
            <div className={`flex items-center gap-2.5 text-sm ${overdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
              <Clock size={14} className="shrink-0"/>
              <span>{new Date(activity.dueDate).toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })}</span>
            </div>
          )}
          {company && (
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <Building2 size={14} className="shrink-0 text-indigo-400"/>
              <span className="font-medium text-slate-700">{company.name}</span>
            </div>
          )}
          {deal && (
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <Target size={14} className="shrink-0 text-violet-400"/>
              <span className="font-medium text-slate-700">{deal.title}</span>
            </div>
          )}
          {contact && (
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <Users size={14} className="shrink-0 text-blue-400"/>
              <span className="font-medium text-slate-700">{contact.firstName} {contact.lastName}</span>
              {contact.position && <span className="text-slate-400 text-xs">· {contact.position}</span>}
            </div>
          )}
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Calendar size={12} className="shrink-0"/>
            <span>Dodano {new Date(activity.createdAt).toLocaleDateString('pl-PL')} · {activity.authorName}</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2">
        {isTask && (
          <button onClick={() => onUpdate(activity.id, { isDone: !activity.isDone })}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors border ${activity.isDone ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>
            {activity.isDone ? <><Circle size={14}/> Oznacz jako niewykonane</> : <><CheckCircle2 size={14}/> Oznacz jako wykonane</>}
          </button>
        )}
        <button onClick={() => { onDelete(activity.id); onClose(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
          <Trash2 size={14}/> Usuń ereignis
        </button>
      </div>
    </div>
  );
};

// ─── Month Grid ───────────────────────────────────────────────────────────────

interface MonthViewProps {
  year: number;
  month: number; // 0-indexed
  activitiesByDate: Map<string, CRMActivity[]>;
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onSelectActivity: (a: CRMActivity) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ year, month, activitiesByDate, selectedDate, onSelectDate, onSelectActivity }) => {
  const today = isoDate(new Date());
  const firstDay = startOfMonth(year, month);
  const totalDays = daysInMonth(year, month);
  const startOffset = weekdayMon(firstDay); // how many empty cells before day 1

  const cells: Array<{ date: string; day: number } | null> = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return { date: isoDate(d), day: i + 1 };
    }),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="bg-white min-h-[90px]"/>;
          const { date, day } = cell;
          const events = activitiesByDate.get(date) || [];
          const isToday = date === today;
          const isSelected = date === selectedDate;
          return (
            <div key={date}
              onClick={() => onSelectDate(date)}
              className={`bg-white min-h-[90px] p-1.5 cursor-pointer transition-colors hover:bg-indigo-50/40 ${isSelected ? 'ring-2 ring-inset ring-indigo-400' : ''}`}>
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1 ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-700 hover:bg-slate-100'}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {events.slice(0, 3).map(ev => {
                  const m = ACTIVITY_META[ev.type];
                  return (
                    <div key={ev.id}
                      onClick={e => { e.stopPropagation(); onSelectActivity(ev); }}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate cursor-pointer hover:opacity-80 ${m.bg} ${m.color} ${ev.isDone ? 'opacity-40 line-through' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot}`}/>
                      <span className="truncate">{ev.title}</span>
                    </div>
                  );
                })}
                {events.length > 3 && (
                  <div className="text-[9px] text-indigo-500 font-bold pl-1">+{events.length - 3} więcej</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekViewProps {
  weekStart: Date;
  activitiesByDate: Map<string, CRMActivity[]>;
  onSelectActivity: (a: CRMActivity) => void;
  onSelectDate: (d: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ weekStart, activitiesByDate, onSelectActivity, onSelectDate }) => {
  const today = isoDate(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: isoDate(d), label: d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' }) };
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(({ date, label }) => {
        const events = activitiesByDate.get(date) || [];
        const isToday = date === today;
        return (
          <div key={date} className="flex flex-col">
            <div onClick={() => onSelectDate(date)}
              className={`py-2 px-1 text-center rounded-xl mb-2 cursor-pointer transition-colors ${isToday ? 'bg-indigo-600 text-white shadow shadow-indigo-400/30' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
              <p className={`text-[9px] font-black uppercase tracking-wider ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>{label.split(' ')[0]}</p>
              <p className="text-lg font-black">{label.split(' ')[1]}</p>
            </div>
            <div className="space-y-1 flex-1">
              {events.length === 0 && (
                <div className="h-12 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                  onClick={() => onSelectDate(date)}>
                  <Plus size={12} className="text-slate-300"/>
                </div>
              )}
              {events.map(ev => {
                const m = ACTIVITY_META[ev.type];
                const time = ev.dueDate ? new Date(ev.dueDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : null;
                return (
                  <div key={ev.id}
                    onClick={() => onSelectActivity(ev)}
                    className={`p-2 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${m.bg} ${m.border} ${ev.isDone ? 'opacity-40' : ''}`}>
                    <div className={`flex items-center gap-1 ${m.color}`}>{m.icon}<span className="text-[9px] font-black uppercase">{m.label}</span></div>
                    <p className={`text-xs font-bold text-slate-800 mt-0.5 leading-tight ${ev.isDone ? 'line-through' : ''}`}>{ev.title}</p>
                    {time && <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5"><Clock size={8}/>{time}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Upcoming List ────────────────────────────────────────────────────────────

interface UpcomingListProps {
  activities: CRMActivity[];
  companies: Company[];
  deals: CRMDeal[];
  onSelectActivity: (a: CRMActivity) => void;
}

const UpcomingList: React.FC<UpcomingListProps> = ({ activities, companies, deals, onSelectActivity }) => {
  const now = new Date();
  const upcoming = activities
    .filter(a => a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const overdue = upcoming.filter(a => new Date(a.dueDate!) < now && !a.isDone);
  const future = upcoming.filter(a => new Date(a.dueDate!) >= now || a.isDone);

  const renderGroup = (label: string, items: CRMActivity[], accent?: string) => (
    items.length > 0 ? (
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${accent || 'text-slate-400'}`}>{label}</p>
        <div className="space-y-1.5">
          {items.map(a => {
            const m = ACTIVITY_META[a.type];
            const company = companies.find(c => c.id === a.companyId);
            const deal = deals.find(d => d.id === a.dealId);
            return (
              <div key={a.id} onClick={() => onSelectActivity(a)}
                className={`flex gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${m.bg} ${m.border} ${a.isDone ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.bg} ${m.color} border ${m.border}`}>{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold text-slate-800 leading-tight ${a.isDone ? 'line-through' : ''}`}>{a.title}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {a.dueDate && <span className={`text-[10px] flex items-center gap-0.5 ${new Date(a.dueDate!) < now && !a.isDone ? 'text-red-500 font-bold' : 'text-slate-400'}`}><Clock size={9}/>{new Date(a.dueDate!).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                    {company && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Building2 size={9}/>{company.name}</span>}
                    {deal && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Target size={9}/>{deal.title}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : null
  );

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-slate-300">
        <CalendarDays size={40} className="mb-3 opacity-40"/>
        <p className="text-sm font-medium">Brak zaplanowanych wydarzeń</p>
        <p className="text-xs mt-1">Dodaj aktywność z datą, aby zobaczyć ją tutaj</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup('Po terminie', overdue, 'text-red-500')}
      {renderGroup('Nadchodzące', future)}
    </div>
  );
};

// ─── Main Calendar Panel ──────────────────────────────────────────────────────

interface CalendarPanelProps {
  currentUser: User;
  myCompanies: Company[];
}

type CalendarViewMode = 'month' | 'week' | 'list';

export const CalendarPanel: React.FC<CalendarPanelProps> = ({ currentUser, myCompanies }) => {
  const { state, actions } = useStrattonSystem();
  const { crmActivities, crmDeals, crmContacts } = state;
  const { handleAddCrmActivity, handleUpdateCrmActivity, handleDeleteCrmActivity } = actions;

  const today = new Date();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<string | null>(isoDate(today));
  const [selectedActivity, setSelectedActivity] = useState<CRMActivity | null>(null);
  const [addModal, setAddModal] = useState<{ open: boolean; date?: string; type?: CRMActivityType }>({ open: false });

  // Only activities that have a dueDate are shown on the calendar
  const calendarActivities = useMemo(
    () => crmActivities.filter(a => !!a.dueDate),
    [crmActivities],
  );

  const activitiesByDate = useMemo(() => {
    const map = new Map<string, CRMActivity[]>();
    calendarActivities.forEach(a => {
      const d = isoDate(new Date(a.dueDate!));
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(a);
    });
    return map;
  }, [calendarActivities]);

  const selectedDayActivities = selectedDate ? (activitiesByDate.get(selectedDate) || []) : [];

  // Stats
  const pendingTasks = crmActivities.filter(a => a.type === 'TASK' && !a.isDone && a.dueDate).length;
  const todayCount = activitiesByDate.get(isoDate(today))?.length || 0;
  const overdue = crmActivities.filter(a => a.dueDate && !a.isDone && new Date(a.dueDate) < today).length;
  const upcomingWeek = useMemo(() => {
    const end = addDays(today, 7);
    return calendarActivities.filter(a => {
      const d = new Date(a.dueDate!);
      return d >= today && d <= end;
    }).length;
  }, [calendarActivities, today]);

  // Navigation
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const prevWeek = () => setWeekStart(w => addDays(w, -7));
  const nextWeek = () => setWeekStart(w => addDays(w, 7));
  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setWeekStart(getMondayOfWeek(today));
    setSelectedDate(isoDate(today));
  };

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedActivity(null);
  }, []);

  const handleSelectActivity = useCallback((a: CRMActivity) => {
    setSelectedActivity(a);
  }, []);

  const handleAddActivity = useCallback((data: Omit<CRMActivity, 'id' | 'createdAt'>) => {
    handleAddCrmActivity(data);
  }, [handleAddCrmActivity]);

  const navLabel = viewMode === 'month'
    ? `${MONTHS_PL[currentMonth]} ${currentYear}`
    : viewMode === 'week'
    ? `${weekStart.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'Lista wydarzeń';

  const VIEW_TABS: { key: CalendarViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'month', label: 'Miesiąc', icon: <CalendarDays size={13}/> },
    { key: 'week',  label: 'Tydzień', icon: <Calendar size={13}/> },
    { key: 'list',  label: 'Lista',   icon: <List size={13}/> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Kalendarz</h2>
          <p className="text-xs text-slate-400 mt-0.5">Spotkania, zadania i aktywności CRM</p>
        </div>
        <div className="hidden lg:flex items-center gap-5">
          {[
            { label: 'Dziś', val: todayCount, color: 'text-indigo-600' },
            { label: 'Ten tydzień', val: upcomingWeek, color: 'text-violet-600' },
            { label: 'Zadania', val: pendingTasks, color: 'text-amber-600' },
            { label: 'Po terminie', val: overdue, color: overdue > 0 ? 'text-red-500' : 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View mode switcher */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {VIEW_TABS.map(t => (
            <button key={t.key} onClick={() => setViewMode(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === t.key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {viewMode !== 'list' && (
          <div className="flex items-center gap-2">
            <button onClick={viewMode === 'month' ? prevMonth : prevWeek}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-sm font-black text-slate-700 min-w-[180px] text-center">{navLabel}</span>
            <button onClick={viewMode === 'month' ? nextMonth : nextWeek}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500">
              <ChevronRight size={14}/>
            </button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors">
              Dziś
            </button>
          </div>
        )}

        <button onClick={() => setAddModal({ open: true, date: selectedDate || isoDate(today) })}
          className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-colors">
          <Plus size={14}/> Nowe wydarzenie
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-5 items-start">
        {/* Calendar grid / list */}
        <div className="flex-1 min-w-0">
          {viewMode === 'month' && (
            <MonthView
              year={currentYear} month={currentMonth}
              activitiesByDate={activitiesByDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onSelectActivity={handleSelectActivity}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              weekStart={weekStart}
              activitiesByDate={activitiesByDate}
              onSelectActivity={handleSelectActivity}
              onSelectDate={d => { handleSelectDate(d); setAddModal({ open: true, date: d }); }}
            />
          )}
          {viewMode === 'list' && (
            <UpcomingList
              activities={calendarActivities}
              companies={myCompanies}
              deals={crmDeals}
              onSelectActivity={handleSelectActivity}
            />
          )}
        </div>

        {/* Side panel — detail or day panel */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
          {selectedActivity ? (
            <EventDetail
              activity={selectedActivity}
              companies={myCompanies}
              deals={crmDeals}
              contacts={crmContacts}
              onUpdate={(id, data) => { handleUpdateCrmActivity(id, data); setSelectedActivity(prev => prev ? { ...prev, ...data } : null); }}
              onDelete={handleDeleteCrmActivity}
              onClose={() => setSelectedActivity(null)}
            />
          ) : (
            /* Day panel */
            <div className="flex flex-col h-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                <div>
                  <p className="text-xs text-slate-400 font-medium">
                    {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Wybierz dzień'}
                  </p>
                  <p className="font-black text-slate-800 text-base">
                    {selectedDayActivities.length > 0 ? `${selectedDayActivities.length} wydarzeń` : 'Brak wydarzeń'}
                  </p>
                </div>
                {selectedDate && (
                  <button onClick={() => setAddModal({ open: true, date: selectedDate })}
                    className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow shadow-indigo-400/30">
                    <Plus size={14}/>
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {selectedDayActivities.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                    <Calendar size={28} className="mb-2 opacity-40"/>
                    <p className="text-xs font-medium">Wolny dzień</p>
                    <button onClick={() => setAddModal({ open: true, date: selectedDate || undefined })}
                      className="mt-3 text-xs font-bold text-indigo-500 hover:text-indigo-700">
                      + Dodaj wydarzenie
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {selectedDayActivities
                    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                    .map(ev => {
                      const m = ACTIVITY_META[ev.type];
                      const time = ev.dueDate ? new Date(ev.dueDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : null;
                      return (
                        <div key={ev.id} onClick={() => setSelectedActivity(ev)}
                          className={`p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${m.bg} ${m.border} ${ev.isDone ? 'opacity-50' : ''}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`flex items-center gap-1 text-[9px] font-black uppercase ${m.color}`}>{m.icon}{m.label}</span>
                            {time && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock size={9}/>{time}</span>}
                          </div>
                          <p className={`text-sm font-bold text-slate-800 ${ev.isDone ? 'line-through' : ''}`}>{ev.title}</p>
                          {ev.body && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{ev.body}</p>}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add event modal */}
      {addModal.open && (
        <AddEventModal
          currentUser={currentUser}
          companies={myCompanies}
          contacts={crmContacts}
          deals={crmDeals}
          prefillDate={addModal.date}
          prefillType={addModal.type || 'MEETING'}
          onAdd={handleAddActivity}
          onClose={() => setAddModal({ open: false })}
        />
      )}
    </div>
  );
};
