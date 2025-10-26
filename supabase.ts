import { createClient } from '@supabase/supabase-js'

// --- IMPORTANT ---
// It looks like you're running into an error because the Supabase credentials are not set.
// You need to replace the placeholder values below with your actual Supabase project's URL and public anon key.
// You can find these in your Supabase project's "API" settings.
//
// NOTE: For this tool's environment, I've set mock values to prevent the app from crashing.
// You MUST replace them with your own credentials for the app to function correctly.
const MOCK_URL = 'https://mock-url.supabase.co';
const MOCK_KEY = 'mock-key-so-the-app-does-not-crash-replace-this-with-your-real-key';

const supabaseUrl = MOCK_URL;
const supabaseAnonKey = MOCK_KEY;

export const isUsingMock = supabaseUrl === MOCK_URL || supabaseAnonKey === MOCK_KEY;

if (isUsingMock) {
  // A more visible warning for the developer.
  console.warn(
    `%cWARNING: Supabase credentials are not set!%c
The application is running in a mock, offline mode with placeholder data.
To connect to your backend, please update the 'supabaseUrl' and 'supabaseAnonKey' in 'supabase.ts' with your real project credentials.`,
    'color: orange; font-weight: bold; font-size: 16px;',
    'color: orange; font-size: 12px; line-height: 1.5;'
  );
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
