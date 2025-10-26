import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikfezvsfqdijncpizluo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmV6dnNmcWRpam5jcGl6bHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODkwMzksImV4cCI6MjA3NzA2NTAzOX0.Qu_Ze14tr8k95xLtFSa6Na8dcijJt-roEiovQWD6zfM';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
