import { createClient } from '@supabase/supabase-js';

// CANLAB Academy's own Supabase project (tech@britishaiconsulting.com, set up
// 28 Oct 2026). Kept in code rather than Vercel env vars so the site always
// points at the right database; the anon key is public by design and every
// table is protected by row level security.
const supabaseUrl = 'https://xzhuxasocakktgitizqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aHV4YXNvY2Fra3RnaXRpenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTY4NzEsImV4cCI6MjEwODc3Mjg3MX0.tOVj971CkRk-N1ujVJvorqH5rsRY_SSOBTOf_YkQHZ4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
