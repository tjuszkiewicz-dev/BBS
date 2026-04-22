/**
 * apService.ts
 * Warstwa dostępu do danych dla modułu Agencji Pracy (AP).
 * Używa klienta Supabase skonfigurowanego dla Vite.
 */

import { supabase } from './supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface APCoordinator {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface APWorker {
  id: string;
  coordinator_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  pesel_encrypted?: string;
  address?: string;
  nationality: string;
  language: string;
  hourly_rate: number;
  status: 'active' | 'inactive';
  document_number?: string;
  document_type?: 'id_card' | 'passport';
  created_at: string;
  updated_at: string;
}

export type NewAPWorker = Omit<APWorker, 'id' | 'created_at' | 'updated_at'>;

export interface WorkSchedule {
  id: string;
  worker_id: string;
  coordinator_id: string;
  date: string;
  location_name: string;
  address?: string;
  planned_start_time?: string;
  notes?: string;
  created_at: string;
  ap_workers?: { first_name: string; last_name: string };
}

export interface WorkSession {
  id: string;
  worker_id: string;
  schedule_id?: string;
  date: string;
  start_time: string;
  end_time?: string;
  total_minutes?: number;
  status: 'active' | 'completed' | 'corrected';
  correction_note?: string;
  created_at: string;
  ap_workers?: { first_name: string; last_name: string };
}

export interface PayrollRecord {
  id: string;
  worker_id: string;
  month: string;
  total_minutes: number;
  hourly_rate: number;
  total_amount: number;
  generated_at: string;
  ap_workers?: { first_name: string; last_name: string };
}

// ─── Coordinator ──────────────────────────────────────────────────────────────

/**
 * Zwraca istniejący rekord koordynatora na podstawie e-mail lub tworzy nowy.
 * W trybie demo system używa mock auth, user_id nie jest wymagane.
 */
export async function getOrCreateCoordinator(
  email: string,
  firstName: string,
  lastName: string
): Promise<APCoordinator | null> {
  // Szukaj po e-mailu
  const { data: found } = await supabase
    .from('ap_coordinators')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (found) return found as APCoordinator;

  // Utwórz nowy rekord (bez user_id — mock auth)
  const { data: created, error } = await supabase
    .from('ap_coordinators')
    .insert({ first_name: firstName, last_name: lastName, email })
    .select('*')
    .single();

  if (error) {
    console.error('[AP] getOrCreateCoordinator error:', error);
    return null;
  }
  return created as APCoordinator;
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export async function fetchWorkers(coordinatorId: string): Promise<APWorker[]> {
  const { data, error } = await supabase
    .from('ap_workers')
    .select('*')
    .eq('coordinator_id', coordinatorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AP] fetchWorkers error:', error);
    return [];
  }
  return (data ?? []) as APWorker[];
}

export async function addWorker(worker: NewAPWorker): Promise<APWorker | null> {
  const { data, error } = await supabase
    .from('ap_workers')
    .insert(worker)
    .select('*')
    .single();

  if (error) {
    console.error('[AP] addWorker error:', error);
    return null;
  }
  return data as APWorker;
}

export async function updateWorker(
  id: string,
  updates: Partial<Omit<APWorker, 'id' | 'created_at'>>
): Promise<APWorker | null> {
  const { data, error } = await supabase
    .from('ap_workers')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[AP] updateWorker error:', error);
    return null;
  }
  return data as APWorker;
}

export async function deleteWorker(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ap_workers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[AP] deleteWorker error:', error);
    return false;
  }
  return true;
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export async function fetchSchedules(
  coordinatorId: string,
  weekStart: string,
  weekEnd: string
): Promise<WorkSchedule[]> {
  const { data, error } = await supabase
    .from('work_schedules')
    .select('*, ap_workers(first_name, last_name)')
    .eq('coordinator_id', coordinatorId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date');

  if (error) {
    console.error('[AP] fetchSchedules error:', error);
    return [];
  }
  return (data ?? []) as WorkSchedule[];
}

export async function addSchedule(
  schedule: Omit<WorkSchedule, 'id' | 'created_at' | 'ap_workers'>
): Promise<WorkSchedule | null> {
  const { data, error } = await supabase
    .from('work_schedules')
    .insert(schedule)
    .select('*, ap_workers(first_name, last_name)')
    .single();

  if (error) {
    console.error('[AP] addSchedule error:', error);
    return null;
  }
  return data as WorkSchedule;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('work_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[AP] deleteSchedule error:', error);
    return false;
  }
  return true;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function fetchSessions(
  coordinatorId: string,
  limitDays = 30
): Promise<WorkSession[]> {
  const since = new Date();
  since.setDate(since.getDate() - limitDays);

  const { data, error } = await supabase
    .from('work_sessions')
    .select('*, ap_workers!inner(first_name, last_name, coordinator_id)')
    .gte('date', since.toISOString().split('T')[0])
    .order('start_time', { ascending: false });

  if (error) {
    console.error('[AP] fetchSessions error:', error);
    return [];
  }

  // Filter by coordinatorId via joined ap_workers
  const filtered = (data ?? []).filter(
    (s: any) => s.ap_workers?.coordinator_id === coordinatorId
  );
  return filtered as WorkSession[];
}

export async function correctSession(
  sessionId: string,
  note: string,
  newEndTime?: string
): Promise<boolean> {
  const updates: Record<string, unknown> = {
    status: 'corrected',
    correction_note: note,
  };
  if (newEndTime) updates.end_time = newEndTime;

  const { error } = await supabase
    .from('work_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) {
    console.error('[AP] correctSession error:', error);
    return false;
  }
  return true;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export async function fetchPayrollRecords(
  coordinatorId: string,
  month?: string
): Promise<PayrollRecord[]> {
  let query = supabase
    .from('payroll_records')
    .select('*, ap_workers!inner(first_name, last_name, coordinator_id)')
    .order('generated_at', { ascending: false });

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AP] fetchPayrollRecords error:', error);
    return [];
  }

  const filtered = (data ?? []).filter(
    (r: any) => r.ap_workers?.coordinator_id === coordinatorId
  );
  return filtered as PayrollRecord[];
}

/**
 * Generuje listę płac za podany miesiąc (YYYY-MM).
 * Agreguje work_sessions każdego pracownika koordynatora.
 */
export async function generatePayroll(
  coordinatorId: string,
  month: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const [year, m] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const monthEnd   = `${month}-${String(lastDay).padStart(2, '0')}`;

  // 1. Pobierz pracowników danego koordynatora
  const workers = await fetchWorkers(coordinatorId);
  if (!workers.length) return { success: false, count: 0, error: 'Brak pracowników' };

  // 2. Pobierz sesje z danego miesiąca dla każdego pracownika
  const { data: sessions, error: sessErr } = await supabase
    .from('work_sessions')
    .select('worker_id, total_minutes, status')
    .in('worker_id', workers.map(w => w.id))
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .eq('status', 'completed');

  if (sessErr) return { success: false, count: 0, error: sessErr.message };

  // 3. Agreguj minuty per pracownik
  const minutesMap: Record<string, number> = {};
  (sessions ?? []).forEach((s: any) => {
    minutesMap[s.worker_id] = (minutesMap[s.worker_id] ?? 0) + (s.total_minutes ?? 0);
  });

  // 4. Dla każdego pracownika utwórz / zaktualizuj payroll_record
  let count = 0;
  for (const worker of workers) {
    const totalMinutes = minutesMap[worker.id] ?? 0;
    if (totalMinutes === 0) continue;

    const { error: upsertErr } = await supabase
      .from('payroll_records')
      .upsert(
        {
          worker_id:    worker.id,
          month,
          total_minutes: totalMinutes,
          hourly_rate:  worker.hourly_rate,
        },
        { onConflict: 'worker_id,month' }
      );

    if (!upsertErr) count++;
    else console.error('[AP] generatePayroll upsert error:', upsertErr);
  }

  return { success: true, count };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface CoordStats {
  workerCount: number;
  activeSessionsToday: number;
  hoursThisMonth: number;
  totalBrutto: number;
}

export async function fetchCoordStats(coordinatorId: string): Promise<CoordStats> {
  const today = new Date().toISOString().split('T')[0];
  const monthStr = today.slice(0, 7);

  const [workersRes, sessionsRes, payrollRes] = await Promise.all([
    supabase.from('ap_workers').select('id', { count: 'exact', head: true })
      .eq('coordinator_id', coordinatorId).eq('status', 'active'),

    supabase.from('work_sessions')
      .select('id, ap_workers!inner(coordinator_id)', { count: 'exact', head: true })
      .eq('ap_workers.coordinator_id' as any, coordinatorId)
      .eq('date', today)
      .eq('status', 'active'),

    supabase.from('payroll_records')
      .select('total_amount, ap_workers!inner(coordinator_id)')
      .eq('ap_workers.coordinator_id' as any, coordinatorId)
      .eq('month', monthStr),
  ]);

  const hoursThis = (() => {
    // fallback: compute from sessions
    return 0;
  })();

  const totalBrutto = (payrollRes.data ?? []).reduce(
    (acc: number, r: any) => acc + (r.total_amount ?? 0),
    0
  );

  return {
    workerCount:         workersRes.count ?? 0,
    activeSessionsToday: sessionsRes.count ?? 0,
    hoursThisMonth:      hoursThis,
    totalBrutto,
  };
}
