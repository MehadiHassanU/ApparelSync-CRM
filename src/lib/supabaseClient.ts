import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kndtuchbhtyunhmybjmr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZHR1Y2hiaHR5dW5obXliam1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjcwMjUsImV4cCI6MjA5ODI0MzAyNX0.Y_zFXB5Df1phZ4LekvD7CwQWDW5C7aMNjzzdPcFj6YY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
