
import { createClient } from '@supabase/supabase-js';

// Project Reference: hnfwuvqwjzsiwjvfjolx
const supabaseUrl = (window as any)._env_?.SUPABASE_URL || 'https://hnfwuvqwjzsiwjvfjolx.supabase.co';

// Try to get the key from environment variables or a global config
const getSupabaseKey = () => {
  return (
    (window as any)._env_?.SUPABASE_ANON_KEY || 
    localStorage.getItem('supabase_anon_key') ||
    'your-anon-key'
  );
};

export const supabase = createClient(supabaseUrl, getSupabaseKey());

// Helper to update the key and re-initialize if needed (e.g. for browser-based setup)
export const updateSupabaseKey = (newKey: string) => {
  localStorage.setItem('supabase_anon_key', newKey);
  window.location.reload(); // Quickest way to re-instantiate everything
};
