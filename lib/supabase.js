import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables (supports both VITE_ and NEXT_PUBLIC_ prefixes) or custom local storage override
const envUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim();

const envKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

const rawStoredUrl = typeof window !== 'undefined' ? (localStorage.getItem('supabase_url') || '').trim() : '';
const rawStoredKey = typeof window !== 'undefined' ? (localStorage.getItem('supabase_anon_key') || '').trim() : '';

export const SUPABASE_URL = rawStoredUrl || envUrl;
export const SUPABASE_ANON_KEY = rawStoredKey || envKey;

export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-supabase-project') &&
    SUPABASE_URL.startsWith('http')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const saveSupabaseConfig = (url, key) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
    window.location.reload();
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    window.location.reload();
  }
};

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================
export const checkAdminAuth = () => {
  if (typeof window === 'undefined') return false;
  const authSession = sessionStorage.getItem('admin_auth');
  return Boolean(authSession);
};

export const hasLocalPasscode = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('admin_passcode'));
};

export const loginAdmin = async (identifier, password) => {
  // 1. If Supabase is configured, authenticate directly via Supabase Auth
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password
      });

      if (!error && data?.session) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admin_auth', JSON.stringify({
            user: data.user,
            type: 'supabase',
            loggedAt: new Date().toISOString()
          }));
        }
        return { success: true, user: data.user, source: 'supabase' };
      }

      if (error) {
        let msg = error.message;
        if (msg.includes('Email not confirmed')) {
          msg = 'Email non confirmé dans Supabase. Désactivez "Confirm Email" dans le dashboard Supabase Auth ou confirmez le compte.';
        } else if (msg.includes('Invalid login credentials')) {
          msg = 'Identifiants Supabase incorrects. Vérifiez l\'email et le mot de passe dans Supabase Auth.';
        }
        return { success: false, error: msg };
      }
    } catch (err) {
      console.warn('Supabase auth attempt error:', err);
      return { success: false, error: 'Impossible de contacter Supabase. Vérifiez votre connexion ou la clé API.' };
    }
  }

  // 2. Local / Standalone Mode (No hardcoded credentials)
  const storedPasscode = typeof window !== 'undefined'
    ? localStorage.getItem('admin_passcode')
    : null;

  // If no local passcode has been set yet and Supabase is not connected
  if (!storedPasscode) {
    return {
      success: false,
      error: 'Supabase n\'est pas connecté et aucun mot de passe local n\'a été défini. Veuillez configurer Supabase ou créer un mot de passe.',
      needsSetup: true
    };
  }

  if (password === storedPasscode) {
    const localUser = { name: 'Admin Salon', email: 'admin@local' };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_auth', JSON.stringify({
        user: localUser,
        type: 'local',
        loggedAt: new Date().toISOString()
      }));
    }
    return { success: true, user: localUser, source: 'local' };
  }

  return { success: false, error: 'Mot de passe administrateur incorrect.' };
};

export const logoutAdmin = async () => {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
  }
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('admin_auth');
  }
};

export const updateAdminPasscode = (newPasscode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_passcode', newPasscode.trim());
  }
};

// Initial Seed Data for Local Fallback Storage
const INITIAL_BARBERS = [
  { id: 1, name: 'Karim', email: 'karim@barbershop.com', phone: '05 50 11 22 33', role: 'Maître Barbier' },
  { id: 2, name: 'Amine', email: 'amine@barbershop.com', phone: '05 50 44 55 66', role: 'Spécialiste Barbe' },
  { id: 3, name: 'Sofiane', email: 'sofiane@barbershop.com', phone: '05 50 77 88 99', role: 'Styliste Coiffeur' }
];

const INITIAL_SERVICES = [
  { id: 1, name: 'Coupe Classique', duration_minutes: 30, price: 1000 },
  { id: 2, name: 'Taille de Barbe', duration_minutes: 20, price: 800 },
  { id: 3, name: 'Formule Coupe & Barbe', duration_minutes: 45, price: 1600 },
  { id: 4, name: "Rasage à l'Ancienne", duration_minutes: 30, price: 1200 }
];

const INITIAL_APPOINTMENTS = [
  {
    id: 1,
    client_name: 'Yassine K.',
    client_phone: '05 55 12 34 56',
    client_email: 'yassine@example.com',
    barber_id: 1,
    service_id: 1,
    start_time: new Date(Date.now() + 86400000).toISOString(),
    status: 'confirmed',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    client_name: 'Khaled B.',
    client_phone: '05 55 98 76 54',
    client_email: 'khaled@example.com',
    barber_id: 2,
    service_id: 3,
    start_time: new Date(Date.now() + 172800000).toISOString(),
    status: 'confirmed',
    created_at: new Date().toISOString()
  }
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    client_name: 'Mounir B.',
    contact_info: 'mounir@example.com',
    message: 'Bonjour, proposez-vous des cartes de fidélité pour les clients hebdomadaires ?',
    is_read: false,
    created_at: new Date().toISOString()
  }
];

// Helper for Local Storage Fallback
const getLocalData = (key, initial) => {
  if (typeof window === 'undefined') return initial;
  const data = localStorage.getItem(`barber_${key}`);
  if (!data) {
    localStorage.setItem(`barber_${key}`, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initial;
  }
};

const setLocalData = (key, value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`barber_${key}`, JSON.stringify(value));
  }
};

// ==========================================
// BARBERS PERSISTENCE
// ==========================================
export const fetchBarbers = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('barbers').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data, source: 'supabase' };
    } catch (err) {
      console.warn('Supabase fetchBarbers error, fallback to local storage:', err);
    }
  }
  return { data: getLocalData('barbers', INITIAL_BARBERS), source: 'local' };
};

export const createBarber = async (barber) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('barbers').insert([barber]).select();
      if (!error && data) return { data: data[0], error: null };
    } catch (err) {
      console.warn('Supabase createBarber error:', err);
    }
  }
  const current = getLocalData('barbers', INITIAL_BARBERS);
  const newBarber = { ...barber, id: Date.now(), created_at: new Date().toISOString() };
  setLocalData('barbers', [...current, newBarber]);
  return { data: newBarber, error: null };
};

export const updateBarber = async (id, barber) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('barbers').update(barber).eq('id', id).select();
      if (!error && data) return { data: data[0], error: null };
    } catch (err) {
      console.warn('Supabase updateBarber error:', err);
    }
  }
  const current = getLocalData('barbers', INITIAL_BARBERS);
  const updated = current.map(b => (b.id === id ? { ...b, ...barber } : b));
  setLocalData('barbers', updated);
  return { data: { id, ...barber }, error: null };
};

export const deleteBarber = async (id) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('barbers').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (err) {
      console.warn('Supabase deleteBarber error:', err);
    }
  }
  const current = getLocalData('barbers', INITIAL_BARBERS);
  setLocalData('barbers', current.filter(b => b.id !== id));
  return { error: null };
};

// ==========================================
// SERVICES PERSISTENCE
// ==========================================
export const fetchServices = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('services').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return { data, source: 'supabase' };
    } catch (err) {
      console.warn('Supabase fetchServices error, fallback to local storage:', err);
    }
  }
  return { data: getLocalData('services', INITIAL_SERVICES), source: 'local' };
};

export const createService = async (service) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('services').insert([service]).select();
      if (!error && data) return { data: data[0], error: null };
    } catch (err) {
      console.warn('Supabase createService error:', err);
    }
  }
  const current = getLocalData('services', INITIAL_SERVICES);
  const newService = { ...service, id: Date.now(), created_at: new Date().toISOString() };
  setLocalData('services', [...current, newService]);
  return { data: newService, error: null };
};

export const updateService = async (id, service) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('services').update(service).eq('id', id).select();
      if (!error && data) return { data: data[0], error: null };
    } catch (err) {
      console.warn('Supabase updateService error:', err);
    }
  }
  const current = getLocalData('services', INITIAL_SERVICES);
  const updated = current.map(s => (s.id === id ? { ...s, ...service } : s));
  setLocalData('services', updated);
  return { data: { id, ...service }, error: null };
};

export const deleteService = async (id) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (err) {
      console.warn('Supabase deleteService error:', err);
    }
  }
  const current = getLocalData('services', INITIAL_SERVICES);
  setLocalData('services', current.filter(s => s.id !== id));
  return { error: null };
};

// ==========================================
// APPOINTMENTS PERSISTENCE
// ==========================================
export const fetchAppointments = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barbers ( id, name, role ),
          services ( id, name, price, duration_minutes )
        `)
        .order('start_time', { ascending: false });

      if (!error && data) return { data, source: 'supabase' };
    } catch (err) {
      console.warn('Supabase fetchAppointments error, fallback to local storage:', err);
    }
  }
  return { data: getLocalData('appointments', INITIAL_APPOINTMENTS), source: 'local' };
};

export const createAppointment = async (appointment) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('appointments').insert([appointment]).select();
      if (!error && data) return { data: data[0], error: null };
    } catch (err) {
      console.warn('Supabase createAppointment error:', err);
    }
  }
  const current = getLocalData('appointments', INITIAL_APPOINTMENTS);
  const newAppt = {
    ...appointment,
    id: Date.now(),
    status: appointment.status || 'confirmed',
    created_at: new Date().toISOString()
  };
  setLocalData('appointments', [newAppt, ...current]);
  return { data: newAppt, error: null };
};

export const updateAppointmentStatus = async (id, status) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).select();
      if (!error && data) return { data: data[0], error: null };
    } catch (err) {
      console.warn('Supabase updateAppointmentStatus error:', err);
    }
  }
  const current = getLocalData('appointments', INITIAL_APPOINTMENTS);
  const updated = current.map(a => (a.id === id ? { ...a, status } : a));
  setLocalData('appointments', updated);
  return { data: { id, status }, error: null };
};

export const deleteAppointment = async (id) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (err) {
      console.warn('Supabase deleteAppointment error:', err);
    }
  }
  const current = getLocalData('appointments', INITIAL_APPOINTMENTS);
  setLocalData('appointments', current.filter(a => a.id !== id));
  return { error: null };
};

// ==========================================
// MESSAGES / CONTACT PERSISTENCE
// ==========================================
export const fetchMessages = async () => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (!error && data) return { data, source: 'supabase' };
    } catch (err) {
      console.warn('Supabase fetchMessages error:', err);
    }
  }
  return { data: getLocalData('messages', INITIAL_MESSAGES), source: 'local' };
};

export const createMessage = async (msg) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('messages').insert([msg]).select();
      if (!error && data) return { data: data[0], error: null };
    } catch (err) {
      console.warn('Supabase createMessage error:', err);
    }
  }
  const current = getLocalData('messages', INITIAL_MESSAGES);
  const newMsg = { ...msg, id: Date.now(), is_read: false, created_at: new Date().toISOString() };
  setLocalData('messages', [newMsg, ...current]);
  return { data: newMsg, error: null };
};

export const markMessageRead = async (id) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', id);
      if (!error) return { error: null };
    } catch (err) {
      console.warn('Supabase markMessageRead error:', err);
    }
  }
  const current = getLocalData('messages', INITIAL_MESSAGES);
  setLocalData('messages', current.map(m => (m.id === id ? { ...m, is_read: true } : m)));
  return { error: null };
};

export const deleteMessage = async (id) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (!error) return { error: null };
    } catch (err) {
      console.warn('Supabase deleteMessage error:', err);
    }
  }
  const current = getLocalData('messages', INITIAL_MESSAGES);
  setLocalData('messages', current.filter(m => m.id !== id));
  return { error: null };
};
