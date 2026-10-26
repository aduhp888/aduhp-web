import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://beajiozqffgbczkhmwan.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYWppb3pxZmZnYmN6a2htd2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjU2NzQsImV4cCI6MjEwODQ0MTY3NH0.2lxXwyIl4tQY1lhK52lVhwzLgmpzvRYNkQ9MTHQs-lg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});
