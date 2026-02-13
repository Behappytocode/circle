
import { createClient } from '@supabase/supabase-js';

// Project Reference: hnfwuvqwjzsiwjvfjolx
const supabaseUrl = (window as any)._env_?.SUPABASE_URL || 'https://hnfwuvqwjzsiwjvfjolx.supabase.co';

// Try to get the key from environment variables or a global config
const getSupabaseKey = () => {
  try {
    return (
      (window as any)._env_?.SUPABASE_ANON_KEY || 
      localStorage.getItem('supabase_anon_key') ||
      'your-anon-key'
    );
  } catch (e) {
    return 'your-anon-key';
  }
};

export const supabase = createClient(supabaseUrl, getSupabaseKey());

// Helper to update the key and re-initialize if needed
export const updateSupabaseKey = (newKey: string) => {
  try {
    localStorage.setItem('supabase_anon_key', newKey);
    window.location.reload();
  } catch (e) {
    console.error("Failed to save key to localStorage", e);
  }
};
