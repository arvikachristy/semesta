import { createClient } from '@supabase/supabase-js';

const url: unknown = import.meta.env.VITE_SUPABASE_URL;
const key: unknown = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const accountClient =
  typeof url === 'string' && url.startsWith('https://') && typeof key === 'string' && key.length > 0
    ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true } })
    : null;
