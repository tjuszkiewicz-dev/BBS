-- =============================================================================
-- EBS — BBS System
-- Migracja 002: Moduł Agencji Pracy (AP)
-- Wklej do Supabase SQL Editor i wykonaj jednorazowo.
-- =============================================================================

-- pgcrypto już włączone w migracji 001, upewniamy się
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ROZSZERZENIE RÓL w user_profiles
-- =============================================================================
-- Dodajemy nowe role do CHECK constraint
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN (
    'superadmin','pracodawca','pracownik','partner','menedzer','dyrektor',
    'ap_worker','ap_coordinator'
  ));

-- Dodajemy kolumny specyficzne dla AP
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'pl'
    CHECK (preferred_language IN ('pl','en','uk','ru','es')),
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- =============================================================================
-- 2. ap_coordinators — koordynatorzy agencji pracy
-- =============================================================================
CREATE TABLE IF NOT EXISTS ap_coordinators (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  TEXT        NOT NULL,
  last_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE ap_coordinators IS 'Koordynatorzy AP — zarządzają pracownikami agencji pracy.';

-- =============================================================================
-- 3. ap_workers — pracownicy agencji pracy
-- Wrażliwe pola (PESEL, nr konta) przechowywane zaszyfrowane przez pgcrypto.
-- Szyfrowanie/deszyfrowanie odbywa się w warstwie aplikacji (lub Edge Functions)
-- używając pgp_sym_encrypt / pgp_sym_decrypt z kluczem z vault/env.
-- =============================================================================
CREATE TABLE IF NOT EXISTS ap_workers (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  coordinator_id        UUID        NOT NULL REFERENCES ap_coordinators(id) ON DELETE RESTRICT,
  first_name            TEXT        NOT NULL,
  last_name             TEXT        NOT NULL,
  -- Pola zaszyfrowane (TEXT przechowujący wynik pgp_sym_encrypt jako hex/base64)
  pesel_encrypted       TEXT,
  bank_account_encrypted TEXT,
  -- Dane kontaktowe
  address               TEXT,
  email                 TEXT        NOT NULL UNIQUE,
  phone                 TEXT,
  -- AP-specyficzne
  nationality           TEXT        NOT NULL DEFAULT 'PL',
  language              TEXT        NOT NULL DEFAULT 'pl'
    CHECK (language IN ('pl','en','uk','ru','es')),
  hourly_rate           NUMERIC(8,2) DEFAULT 0 CHECK (hourly_rate >= 0),
  status                TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE ap_workers IS
  'Pracownicy agencji pracy. PESEL i nr konta przechowywane zaszyfrowane (pgp_sym_encrypt).';

-- =============================================================================
-- 4. work_schedules — grafik / kalendarz przypisań
-- =============================================================================
CREATE TABLE IF NOT EXISTS work_schedules (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id           UUID        NOT NULL REFERENCES ap_workers(id) ON DELETE CASCADE,
  coordinator_id      UUID        NOT NULL REFERENCES ap_coordinators(id) ON DELETE RESTRICT,
  date                DATE        NOT NULL,
  location_name       TEXT        NOT NULL,
  address             TEXT,
  planned_start_time  TIME,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (worker_id, date)  -- jeden wpis na pracownika na dzień
);
COMMENT ON TABLE work_schedules IS 'Grafik pracy — przypisania lokalizacji i godzin przez koordynatora.';

CREATE INDEX IF NOT EXISTS idx_work_schedules_worker_date
  ON work_schedules (worker_id, date);
CREATE INDEX IF NOT EXISTS idx_work_schedules_coordinator
  ON work_schedules (coordinator_id);

-- =============================================================================
-- 5. work_sessions — sesje timera START/STOP
-- =============================================================================
CREATE TABLE IF NOT EXISTS work_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID        NOT NULL REFERENCES ap_workers(id) ON DELETE CASCADE,
  schedule_id     UUID        REFERENCES work_schedules(id) ON DELETE SET NULL,
  date            DATE        NOT NULL DEFAULT CURRENT_DATE,
  start_time      TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time        TIMESTAMPTZ,
  total_minutes   INTEGER     GENERATED ALWAYS AS (
                    CASE
                      WHEN end_time IS NOT NULL
                      THEN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
                      ELSE NULL
                    END
                  ) STORED,
  status          TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','corrected')),
  correction_note TEXT,
  corrected_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE work_sessions IS
  'Sesje czasu pracy (START/STOP). total_minutes obliczane automatycznie.';

CREATE INDEX IF NOT EXISTS idx_work_sessions_worker
  ON work_sessions (worker_id, date);
CREATE INDEX IF NOT EXISTS idx_work_sessions_status
  ON work_sessions (status) WHERE status = 'active';

-- Tylko jedna aktywna sesja na pracownika
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_sessions_one_active
  ON work_sessions (worker_id)
  WHERE status = 'active';

-- =============================================================================
-- 6. payroll_records — wygenerowane listy płac
-- =============================================================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID          NOT NULL REFERENCES ap_workers(id) ON DELETE RESTRICT,
  month           TEXT          NOT NULL,  -- format YYYY-MM
  total_minutes   INTEGER       NOT NULL DEFAULT 0,
  hourly_rate     NUMERIC(8,2)  NOT NULL,
  total_amount    NUMERIC(10,2) GENERATED ALWAYS AS (
                    ROUND((total_minutes::NUMERIC / 60) * hourly_rate, 2)
                  ) STORED,
  generated_by    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at    TIMESTAMPTZ   DEFAULT now(),
  pdf_url         TEXT,
  UNIQUE (worker_id, month)
);
COMMENT ON TABLE payroll_records IS 'Archiwum list płac. total_amount obliczane z total_minutes i hourly_rate.';

-- =============================================================================
-- 7. ap_audit_log — logi aktywności modułu AP
-- =============================================================================
CREATE TABLE IF NOT EXISTS ap_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,  -- np. 'session_start','session_stop','rate_change','correction'
  entity_type TEXT        NOT NULL,  -- 'work_session','ap_worker','payroll_record','work_schedule'
  entity_id   UUID,
  payload     JSONB,                 -- dane przed/po zmianie
  created_at  TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE ap_audit_log IS 'Append-only log akcji w module AP.';

CREATE INDEX IF NOT EXISTS idx_ap_audit_log_actor ON ap_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_ap_audit_log_entity ON ap_audit_log (entity_type, entity_id);

-- =============================================================================
-- 8. FUNKCJE POMOCNICZE
-- =============================================================================

-- Funkcja: automatycznie aktualizuje updated_at
CREATE OR REPLACE FUNCTION ap_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_ap_coordinators_updated_at
  BEFORE UPDATE ON ap_coordinators
  FOR EACH ROW EXECUTE FUNCTION ap_set_updated_at();

CREATE OR REPLACE TRIGGER trg_ap_workers_updated_at
  BEFORE UPDATE ON ap_workers
  FOR EACH ROW EXECUTE FUNCTION ap_set_updated_at();

CREATE OR REPLACE TRIGGER trg_work_schedules_updated_at
  BEFORE UPDATE ON work_schedules
  FOR EACH ROW EXECUTE FUNCTION ap_set_updated_at();

-- Funkcja: zapisuje log do ap_audit_log (wywoływana z aplikacji lub Edge Functions)
CREATE OR REPLACE FUNCTION ap_log_action(
  p_actor_id    UUID,
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_payload     JSONB DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO ap_audit_log (actor_id, action, entity_type, entity_id, payload)
  VALUES (p_actor_id, p_action, p_entity_type, p_entity_id, p_payload);
END;
$$;

-- =============================================================================
-- 9. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE ap_coordinators   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap_workers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap_audit_log      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Funkcja pomocnicza: pobiera rolę bieżącego użytkownika z user_profiles
-- SECURITY DEFINER żeby nie tworzyć pętli RLS przy odczycie profilu
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ap_current_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- ap_coordinators
-- ---------------------------------------------------------------------------
CREATE POLICY "ap_coord_select_own" ON ap_coordinators
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ap_coord_admin_all" ON ap_coordinators
  FOR ALL USING (ap_current_role() = 'superadmin');

-- ---------------------------------------------------------------------------
-- ap_workers
-- ---------------------------------------------------------------------------
-- Pracownik widzi tylko swój rekord
CREATE POLICY "ap_worker_select_own" ON ap_workers
  FOR SELECT USING (user_id = auth.uid());

-- Koordynator widzi swoich pracowników
CREATE POLICY "ap_worker_coord_select" ON ap_workers
  FOR SELECT USING (
    coordinator_id IN (
      SELECT id FROM ap_coordinators WHERE user_id = auth.uid()
    )
  );

-- Koordynator może tworzyć/edytować swoich pracowników
CREATE POLICY "ap_worker_coord_insert" ON ap_workers
  FOR INSERT WITH CHECK (
    coordinator_id IN (
      SELECT id FROM ap_coordinators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ap_worker_coord_update" ON ap_workers
  FOR UPDATE USING (
    coordinator_id IN (
      SELECT id FROM ap_coordinators WHERE user_id = auth.uid()
    )
  );

-- Admin: pełny dostęp
CREATE POLICY "ap_worker_admin_all" ON ap_workers
  FOR ALL USING (ap_current_role() = 'superadmin');

-- ---------------------------------------------------------------------------
-- work_schedules
-- ---------------------------------------------------------------------------
CREATE POLICY "ap_sched_worker_select" ON work_schedules
  FOR SELECT USING (
    worker_id IN (SELECT id FROM ap_workers WHERE user_id = auth.uid())
  );

CREATE POLICY "ap_sched_coord_all" ON work_schedules
  FOR ALL USING (
    coordinator_id IN (
      SELECT id FROM ap_coordinators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ap_sched_admin_all" ON work_schedules
  FOR ALL USING (ap_current_role() = 'superadmin');

-- ---------------------------------------------------------------------------
-- work_sessions
-- ---------------------------------------------------------------------------
CREATE POLICY "ap_sess_worker_own" ON work_sessions
  FOR SELECT USING (
    worker_id IN (SELECT id FROM ap_workers WHERE user_id = auth.uid())
  );

-- Pracownik może INSERT (start) i UPDATE (stop) tylko swoich sesji
CREATE POLICY "ap_sess_worker_insert" ON work_sessions
  FOR INSERT WITH CHECK (
    worker_id IN (SELECT id FROM ap_workers WHERE user_id = auth.uid())
  );

CREATE POLICY "ap_sess_worker_update" ON work_sessions
  FOR UPDATE USING (
    worker_id IN (SELECT id FROM ap_workers WHERE user_id = auth.uid())
  );

CREATE POLICY "ap_sess_coord_all" ON work_sessions
  FOR ALL USING (
    worker_id IN (
      SELECT w.id FROM ap_workers w
      JOIN ap_coordinators c ON c.id = w.coordinator_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "ap_sess_admin_all" ON work_sessions
  FOR ALL USING (ap_current_role() = 'superadmin');

-- ---------------------------------------------------------------------------
-- payroll_records
-- ---------------------------------------------------------------------------
CREATE POLICY "ap_pay_worker_own" ON payroll_records
  FOR SELECT USING (
    worker_id IN (SELECT id FROM ap_workers WHERE user_id = auth.uid())
  );

CREATE POLICY "ap_pay_coord_all" ON payroll_records
  FOR ALL USING (
    worker_id IN (
      SELECT w.id FROM ap_workers w
      JOIN ap_coordinators c ON c.id = w.coordinator_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "ap_pay_admin_all" ON payroll_records
  FOR ALL USING (ap_current_role() = 'superadmin');

-- ---------------------------------------------------------------------------
-- ap_audit_log — tylko odczyt dla admina i koordynatora
-- ---------------------------------------------------------------------------
CREATE POLICY "ap_audit_admin" ON ap_audit_log
  FOR SELECT USING (ap_current_role() = 'superadmin');

CREATE POLICY "ap_audit_coord" ON ap_audit_log
  FOR SELECT USING (ap_current_role() = 'ap_coordinator');

-- Zapis tylko przez funkcję ap_log_action (SECURITY DEFINER)
CREATE POLICY "ap_audit_insert_definer" ON ap_audit_log
  FOR INSERT WITH CHECK (FALSE);  -- blokuje bezpośredni INSERT; funkcja SECURITY DEFINER to omija
