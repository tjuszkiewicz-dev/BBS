-- =============================================================================
-- EBS — BBS System
-- Migracja 003: Kompatybilność z mock auth + pola dokumentu
-- Wklej do Supabase SQL Editor i wykonaj jednorazowo.
-- =============================================================================

-- 1. Usuń constraint NOT NULL z user_id w ap_coordinators
--    (demo system nie używa Supabase Auth, user_id jest 'AP-COORD-001')
ALTER TABLE ap_coordinators
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Usuń foreign key reference do auth.users w ap_coordinators
ALTER TABLE ap_coordinators
  DROP CONSTRAINT IF EXISTS ap_coordinators_user_id_fkey;

-- 3. Usuń unique constraint na user_id (może być NULL wiele razy)
ALTER TABLE ap_coordinators
  DROP CONSTRAINT IF EXISTS ap_coordinators_user_id_key;

-- 4. Usuń foreign key reference do auth.users w ap_workers
ALTER TABLE ap_workers
  DROP CONSTRAINT IF EXISTS ap_workers_user_id_fkey;

-- 5. Dodaj pola dokumentu tożsamości do ap_workers
ALTER TABLE ap_workers
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS document_type   TEXT DEFAULT 'id_card'
    CHECK (document_type IN ('id_card', 'passport'));

-- 6. Wyłącz RLS na wszystkich tabelach AP (tryb demo)
ALTER TABLE ap_coordinators DISABLE ROW LEVEL SECURITY;
ALTER TABLE ap_workers      DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules  DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE ap_audit_log    DISABLE ROW LEVEL SECURITY;

-- 7. Usuń referencję generated_by do auth.users w payroll_records (opcjonalny)
ALTER TABLE payroll_records
  DROP CONSTRAINT IF EXISTS payroll_records_generated_by_fkey;

-- 8. Seed: wstaw domyślnego koordynatora demo (jeśli nie istnieje)
INSERT INTO ap_coordinators (first_name, last_name, email, phone)
VALUES ('Katarzyna', 'Koord', 'koordynator@alces.pl', NULL)
ON CONFLICT (email) DO NOTHING;
