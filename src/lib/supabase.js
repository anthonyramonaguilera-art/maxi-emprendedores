import { createClient } from '@supabase/supabase-js';

// Colocamos la URL que ya sabemos que está bien
const supabaseUrl = 'https://ejhixxtuecouczsnsejp.supabase.co';

// Pega tu llave real entre las comillas simples de abajo:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaGl4eHR1ZWNvdWN6c25zZWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzE5NjMsImV4cCI6MjA5MzgwNzk2M30.Swqd81GBUW0RHI0vP6jcPM38wJWgeXu_kR3yNGLxVbw'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);