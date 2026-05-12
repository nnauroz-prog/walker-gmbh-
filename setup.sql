-- =========================================================
-- Walker GmbH – Supabase Setup
-- Komplettes Skript zum Reinkopieren in den Supabase SQL-Editor.
-- Idempotent: kann mehrfach ausgeführt werden ohne Fehler.
-- =========================================================

-- ---------- 1. Tabelle: content (Owner-editierbare Inhalte) ----------
CREATE TABLE IF NOT EXISTS public.content (
  id   text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_updated_at ON public.content;
CREATE TRIGGER trg_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Policies content: SELECT für alle, Schreiben nur authenticated
DROP POLICY IF EXISTS content_select_all       ON public.content;
DROP POLICY IF EXISTS content_insert_auth      ON public.content;
DROP POLICY IF EXISTS content_update_auth      ON public.content;
DROP POLICY IF EXISTS content_delete_auth      ON public.content;

CREATE POLICY content_select_all
  ON public.content FOR SELECT
  USING (true);

CREATE POLICY content_insert_auth
  ON public.content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY content_update_auth
  ON public.content FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY content_delete_auth
  ON public.content FOR DELETE
  TO authenticated
  USING (true);


-- ---------- 2. Tabelle: service_requests (Kundenanfragen) ----------
CREATE TABLE IF NOT EXISTS public.service_requests (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  phone           text,
  email           text,
  vehicle         text,
  license_plate   text,
  mileage         text,
  service_type    text,
  preferred_date  date,
  preferred_time  text,
  message         text,
  status          text NOT NULL DEFAULT 'new',
  received_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_received_at
  ON public.service_requests (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_status
  ON public.service_requests (status);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Anonyme INSERT erlaubt (Anfrage absenden), aber kein SELECT/UPDATE/DELETE.
-- Authenticated darf alles (Owner-Bereich).
DROP POLICY IF EXISTS sr_insert_anon    ON public.service_requests;
DROP POLICY IF EXISTS sr_select_auth    ON public.service_requests;
DROP POLICY IF EXISTS sr_update_auth    ON public.service_requests;
DROP POLICY IF EXISTS sr_delete_auth    ON public.service_requests;

CREATE POLICY sr_insert_anon
  ON public.service_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY sr_select_auth
  ON public.service_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY sr_update_auth
  ON public.service_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY sr_delete_auth
  ON public.service_requests FOR DELETE
  TO authenticated
  USING (true);


-- ---------- 3. Storage-Bucket: images (Bilder-Uploads) ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies: jeder darf lesen, nur authenticated schreiben
DROP POLICY IF EXISTS images_select_all      ON storage.objects;
DROP POLICY IF EXISTS images_insert_auth     ON storage.objects;
DROP POLICY IF EXISTS images_update_auth     ON storage.objects;
DROP POLICY IF EXISTS images_delete_auth     ON storage.objects;

CREATE POLICY images_select_all
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY images_insert_auth
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY images_update_auth
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

CREATE POLICY images_delete_auth
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');


-- ---------- 4. Realtime Publication ----------
-- Realtime für content und service_requests freischalten
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.content;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Publikation existiert evtl. nicht in lokalem Setup, ignorieren
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;


-- =========================================================
-- Setup abgeschlossen.
-- Nächste Schritte:
-- 1. Auth → Users → Owner-Account anlegen (E-Mail + Passwort).
-- 2. Settings → API → Project URL + anon key kopieren.
-- 3. Werte in config.js eintragen.
-- 4. Webseite neu laden – die Verbindung wird automatisch erkannt.
-- =========================================================
