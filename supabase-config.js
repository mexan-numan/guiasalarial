// supabase-config.js
// Configuración de Supabase para la Calculadora de Salarios

// REEMPLAZAR con tus credenciales reales de Supabase
const SUPABASE_URL = 'https://mrpchslrqjjlieqsgeca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycGNoc2xycWpqbGllcXNnZWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MzExNzcsImV4cCI6MjA5MTAwNzE3N30.ZFhS0Ijliy6x2zYOv5OMKzN698_AvjkgsoVxmYd_Dv8';

// Inicializar el cliente de Supabase (sin const para que sea global)
supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
