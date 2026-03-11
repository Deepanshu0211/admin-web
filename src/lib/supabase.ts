import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pqousovvrvgioibfotsh.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb3Vzb3Z2cnZnaW9pYmZvdHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODU0NDAsImV4cCI6MjA4NjU2MTQ0MH0.3v_9o3jx0GBWfzCFLf6obHuRSQ9HgE4rvlm42x_gUbc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
