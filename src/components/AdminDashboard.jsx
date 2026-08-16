import { useState, useEffect } from 'react';
import {
  Scissors, Calendar, User, DollarSign, CheckCircle, XCircle, Clock,
  Plus, Edit, Trash2, Database, MessageSquare, ExternalLink,
  Search, Check, Copy, AlertCircle
} from 'lucide-react';
import {
  isSupabaseConfigured, SUPABASE_URL, saveSupabaseConfig, clearSupabaseConfig,
  checkAdminAuth, loginAdmin, logoutAdmin, updateAdminPasscode,
  fetchBarbers, createBarber, updateBarber, deleteBarber,
  fetchServices, createService, updateService, deleteService,
  fetchAppointments, createAppointment, updateAppointmentStatus, deleteAppointment,
  fetchMessages, markMessageRead, deleteMessage
} from '../../lib/supabase';
import { Lock, LogOut } from 'lucide-react';

export default function AdminDashboard({ onReturnToSite }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAdminAuth());
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [dataSource, setDataSource] = useState('local');

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [messages, setMessages] = useState([]);

  // Toast & Search
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Supabase Config Form
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(SUPABASE_URL || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Modals
  const [showApptModal, setShowApptModal] = useState(false);
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [apptForm, setApptForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    barber_id: '',
    service_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00'
  });

  const [barberForm, setBarberForm] = useState({
    name: '',
    role: 'Barbier',
    email: '',
    phone: ''
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration_minutes: 30,
    price: 1000
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [barbRes, servRes, apptRes, msgRes] = await Promise.all([
        fetchBarbers(),
        fetchServices(),
        fetchAppointments(),
        fetchMessages()
      ]);

      setBarbers(barbRes.data || []);
      setServices(servRes.data || []);
      setAppointments(apptRes.data || []);
      setMessages(msgRes.data || []);
      if (barbRes.source) setDataSource(barbRes.source);
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    const res = await loginAdmin(loginId, loginPass);
    setLoginSubmitting(false);

    if (res.success) {
      setIsAuthenticated(true);
      showToast('Connexion réussie en tant qu\'administrateur');
      setLoginId('');
      setLoginPass('');
    } else {
      setLoginError(res.error || 'Connexion échouée');
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    showToast('Déconnexion effectuée');
  };

  const handleChangePasscode = (e) => {
    e.preventDefault();
    if (!newPasscode || newPasscode.length < 4) {
      showToast('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    updateAdminPasscode(newPasscode);
    setNewPasscode('');
    showToast('Nouveau mot de passe administrateur enregistré !');
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchBarbers(),
      fetchServices(),
      fetchAppointments(),
      fetchMessages()
    ]).then(([barbRes, servRes, apptRes, msgRes]) => {
      if (!isMounted) return;
      const barbList = barbRes.data || [];
      const servList = servRes.data || [];

      setBarbers(barbList);
      setServices(servList);
      setAppointments(apptRes.data || []);
      setMessages(msgRes.data || []);
      setDataSource(barbRes.source || 'local');

      setApptForm(prev => ({
        ...prev,
        barber_id: prev.barber_id || (barbList.length > 0 ? barbList[0].id : ''),
        service_id: prev.service_id || (servList.length > 0 ? servList[0].id : '')
      }));
    }).catch(err => {
      console.error('Error initializing admin data:', err);
    });

    return () => { isMounted = false; };
  }, []);

  // Appointment Actions
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!apptForm.client_name || !apptForm.client_phone) {
      showToast('Veuillez remplir les champs obligatoires');
      return;
    }
    const startTimeIso = new Date(`${apptForm.date}T${apptForm.time}:00`).toISOString();
    const payload = {
      client_name: apptForm.client_name,
      client_phone: apptForm.client_phone,
      client_email: apptForm.client_email || null,
      barber_id: Number(apptForm.barber_id),
      service_id: Number(apptForm.service_id),
      start_time: startTimeIso,
      status: 'confirmed'
    };

    const res = await createAppointment(payload);
    if (!res.error) {
      showToast('Rendez-vous ajouté avec succès');
      setShowApptModal(false);
      setApptForm({
        client_name: '',
        client_phone: '',
        client_email: '',
        barber_id: barbers[0]?.id || '',
        service_id: services[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00'
      });
      loadData();
    }
  };

  const handleStatusChange = async (id, status) => {
    const res = await updateAppointmentStatus(id, status);
    if (!res.error) {
      showToast(`Statut mis à jour : ${status}`);
      loadData();
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      const res = await deleteAppointment(id);
      if (!res.error) {
        showToast('Rendez-vous supprimé');
        loadData();
      }
    }
  };

  // Barber Actions
  const handleSaveBarber = async (e) => {
    e.preventDefault();
    if (!barberForm.name) return;

    if (editingItem) {
      const res = await updateBarber(editingItem.id, barberForm);
      if (!res.error) showToast('Barbier mis à jour');
    } else {
      const res = await createBarber(barberForm);
      if (!res.error) showToast('Nouveau barbier ajouté');
    }
    setShowBarberModal(false);
    setEditingItem(null);
    setBarberForm({ name: '', role: 'Barbier', email: '', phone: '' });
    loadData();
  };

  const handleDeleteBarber = async (id) => {
    if (window.confirm('Supprimer ce barbier ?')) {
      await deleteBarber(id);
      showToast('Barbier supprimé');
      loadData();
    }
  };

  // Service Actions
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name) return;

    const payload = {
      name: serviceForm.name,
      duration_minutes: Number(serviceForm.duration_minutes),
      price: Number(serviceForm.price)
    };

    if (editingItem) {
      const res = await updateService(editingItem.id, payload);
      if (!res.error) showToast('Service mis à jour');
    } else {
      const res = await createService(payload);
      if (!res.error) showToast('Nouveau service ajouté');
    }
    setShowServiceModal(false);
    setEditingItem(null);
    setServiceForm({ name: '', duration_minutes: 30, price: 1000 });
    loadData();
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Supprimer ce service ?')) {
      await deleteService(id);
      showToast('Service supprimé');
      loadData();
    }
  };

  // Message Actions
  const handleMarkRead = async (id) => {
    await markMessageRead(id);
    showToast('Message marqué comme lu');
    loadData();
  };

  const handleDeleteMsg = async (id) => {
    if (window.confirm('Supprimer ce message ?')) {
      await deleteMessage(id);
      showToast('Message supprimé');
      loadData();
    }
  };

  // Supabase Config Submission
  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!supabaseUrlInput || !supabaseKeyInput) {
      showToast('Veuillez fournir l\'URL et la clé anonyme');
      return;
    }
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
  };

  const copySqlScript = () => {
    const sqlText = `-- 1. Create Barbers Table
CREATE TABLE IF NOT EXISTS barbers (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'Barbier'
);

-- 2. Create Services Table
CREATE TABLE IF NOT EXISTS services (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  price NUMERIC(10, 2) NOT NULL
);

-- 3. Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  barber_id BIGINT REFERENCES barbers(id) ON DELETE SET NULL,
  service_id BIGINT REFERENCES services(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed'))
);

-- 4. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public barbers policy" ON barbers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public services policy" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public appointments policy" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public messages policy" ON messages FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    showToast('Script SQL copié dans le presse-papier !');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Calculations for Stats
  const totalAppointments = appointments.length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  const totalRevenue = appointments
    .filter(a => a.status !== 'cancelled')
    .reduce((sum, a) => {
      const s = services.find(serv => serv.id === Number(a.service_id)) || a.services;
      return sum + (s ? Number(s.price) : 0);
    }, 0);

  const unreadMessagesCount = messages.filter(m => !m.is_read).length;

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch =
      a.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.client_phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="admin-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {toast && (
          <div className="toast">
            <Check size={16} color="#c5a059" />
            <span>{toast}</span>
          </div>
        )}
        <header className="admin-header">
          <div className="admin-nav-content">
            <div className="admin-brand">
              <Scissors size={24} className="brand-icon" />
              <div>
                <h2>L'ATELIER BARBIER</h2>
                <span className="admin-badge-sub">Espace d'Administration</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onReturnToSite}>
              <ExternalLink size={14} />
              <span>Voir le Site Web</span>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div className="admin-login-card">
            <div className="login-icon-wrapper">
              <Lock size={32} color="var(--accent-gold)" />
            </div>
            <h2 className="login-title">Accès Administrateur</h2>
            <p className="login-subtitle">
              {isSupabaseConfigured()
                ? 'Connectez-vous avec vos identifiants Supabase Auth.'
                : 'Connectez-vous avec votre mot de passe administrateur.'}
            </p>

            {loginError && (
              <div className="status-alert warning" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem' }}>
                <AlertCircle size={18} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin}>
              <div className="form-group">
                <label className="form-label">
                  {isSupabaseConfigured() ? 'Adresse Email Supabase *' : 'Identifiant / Email'}
                </label>
                <input
                  type={isSupabaseConfigured() ? 'email' : 'text'}
                  className="form-input"
                  placeholder={isSupabaseConfigured() ? 'ex: admin@domaine.com' : 'votre email ou identifiant'}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required={isSupabaseConfigured()}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loginSubmitting} style={{ marginTop: '1.25rem' }}>
                {loginSubmitting ? 'Vérification...' : 'Se connecter'}
              </button>
            </form>

            {/* Supabase Status & Quick Configuration Toggle */}
            <div className="auth-status-info" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isSupabaseConfigured() ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80' }}>
                  <Database size={14} />
                  <span>Base Supabase Connectée &bull; Authentification Cloud Active</span>
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    <strong>Statut Supabase :</strong> Non connecté. Pour activer Supabase Auth sur Vercel, vous pouvez soit configurer vos identifiants ci-dessous, soit ajouter vos variables dans Vercel.
                  </p>
                  
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-full"
                    onClick={() => setShowQuickSetup(!showQuickSetup)}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    <Database size={14} color="var(--accent-gold)" />
                    <span>{showQuickSetup ? 'Masquer la configuration' : '⚙️ Entrer les identifiants Supabase'}</span>
                  </button>

                  {showQuickSetup && (
                    <form onSubmit={handleSaveConfig} style={{ marginTop: '0.75rem', background: '#090a0c', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-gold)' }}>
                      <h4 style={{ fontSize: '0.88rem', marginBottom: '0.75rem', color: 'var(--accent-gold)' }}>Configuration Supabase Instantanée</h4>
                      <div className="form-group">
                        <label className="form-label">URL Supabase (VITE_SUPABASE_URL)</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://xyzcompany.supabase.co"
                          value={supabaseUrlInput}
                          onChange={(e) => setSupabaseUrlInput(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Clé Anonyme (VITE_SUPABASE_ANON_KEY)</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="eyJhbGciOiJIUzI1Ni..."
                          value={supabaseKeyInput}
                          onChange={(e) => setSupabaseKeyInput(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm btn-full">
                        Enregistrer & Connecter
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <Check size={16} color="#c5a059" />
          <span>{toast}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="admin-header">
        <div className="admin-nav-content">
          <div className="admin-brand">
            <Scissors size={24} className="brand-icon" />
            <div>
              <h2>L'ATELIER BARBIER</h2>
              <span className="admin-badge-sub">Espace d'Administration</span>
            </div>
          </div>

          <div className="admin-header-actions">
            {/* Status indicator badge */}
            <button
              className={`db-status-pill ${isSupabaseConfigured() && dataSource === 'supabase' ? 'connected' : 'demo'}`}
              onClick={() => setActiveTab('setup')}
              title="Cliquer pour configurer Supabase"
            >
              <Database size={14} />
              <span>
                {isSupabaseConfigured() && dataSource === 'supabase'
                  ? 'Supabase Connecté'
                  : 'Mode Démo / Mock Storage'}
              </span>
            </button>

            <button className="btn btn-secondary btn-sm" onClick={onReturnToSite}>
              <ExternalLink size={14} />
              <span>Voir le Site Web</span>
            </button>

            <button className="btn btn-secondary btn-sm danger" onClick={handleAdminLogout} title="Déconnexion Admin">
              <LogOut size={14} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Wrapper */}
      <main className="admin-body">
        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Clock size={16} />
            <span>Vue d'ensemble</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={16} />
            <span>Rendez-vous ({totalAppointments})</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'barbers' ? 'active' : ''}`}
            onClick={() => setActiveTab('barbers')}
          >
            <User size={16} />
            <span>Barbiers ({barbers.length})</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Scissors size={16} />
            <span>Services ({services.length})</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={16} />
            <span>Messages {unreadMessagesCount > 0 && `(${unreadMessagesCount})`}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            <Database size={16} />
            <span>Base Supabase</span>
          </button>
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper gold">
                  <Calendar size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Rendez-vous</span>
                  <h3 className="stat-value">{totalAppointments}</h3>
                  <span className="stat-sub">{confirmedCount} confirmés</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper green">
                  <CheckCircle size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Rendez-vous Honorés</span>
                  <h3 className="stat-value">{completedCount}</h3>
                  <span className="stat-sub">{cancelledCount} annulés</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper gold">
                  <DollarSign size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Chiffre d'Affaires Est.</span>
                  <h3 className="stat-value">{totalRevenue.toLocaleString()} DA</h3>
                  <span className="stat-sub">Prestations réservées</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper blue">
                  <MessageSquare size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Messages Reçus</span>
                  <h3 className="stat-value">{messages.length}</h3>
                  <span className="stat-sub">{unreadMessagesCount} non lus</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Appointments */}
            <div className="admin-section-block">
              <div className="block-header">
                <h3>Derniers Rendez-vous</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowApptModal(true);
                  }}
                >
                  <Plus size={14} />
                  <span>Nouveau Rendez-vous</span>
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={36} color="var(--text-muted)" />
                  <p>Aucun rendez-vous enregistré pour le moment.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Téléphone</th>
                        <th>Barbier</th>
                        <th>Prestation</th>
                        <th>Date & Heure</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0, 5).map((appt) => {
                        const barber = barbers.find(b => b.id === Number(appt.barber_id)) || appt.barbers;
                        const service = services.find(s => s.id === Number(appt.service_id)) || appt.services;
                        return (
                          <tr key={appt.id}>
                            <td><strong>{appt.client_name}</strong></td>
                            <td>{appt.client_phone}</td>
                            <td>{barber ? barber.name : '—'}</td>
                            <td>{service ? service.name : '—'}</td>
                            <td>
                              {new Date(appt.start_time).toLocaleDateString('fr-FR')} &bull;{' '}
                              {new Date(appt.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <span className={`status-badge ${appt.status}`}>
                                {appt.status === 'confirmed' ? 'Confirmé' : appt.status === 'completed' ? 'Terminé' : 'Annulé'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="tab-content">
            <div className="admin-toolbar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher nom, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-actions">
                <select
                  className="form-select status-select-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="confirmed">Confirmés</option>
                  <option value="completed">Terminés</option>
                  <option value="cancelled">Annulés</option>
                </select>

                <button className="btn btn-primary btn-sm" onClick={() => setShowApptModal(true)}>
                  <Plus size={15} />
                  <span>Ajouter Rendez-vous</span>
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Barbier</th>
                    <th>Prestation</th>
                    <th>Prix</th>
                    <th>Date & Heure</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                        Aucun rendez-vous trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt) => {
                      const barber = barbers.find(b => b.id === Number(appt.barber_id)) || appt.barbers;
                      const service = services.find(s => s.id === Number(appt.service_id)) || appt.services;
                      return (
                        <tr key={appt.id}>
                          <td><strong>{appt.client_name}</strong></td>
                          <td>{appt.client_phone}</td>
                          <td>{appt.client_email || '—'}</td>
                          <td>{barber ? barber.name : '—'}</td>
                          <td>{service ? service.name : '—'}</td>
                          <td>{service ? `${service.price} DA` : '—'}</td>
                          <td>
                            {new Date(appt.start_time).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(appt.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            <span className={`status-badge ${appt.status}`}>
                              {appt.status === 'confirmed' ? 'Confirmé' : appt.status === 'completed' ? 'Terminé' : 'Annulé'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {appt.status !== 'completed' && (
                                <button
                                  className="action-btn success"
                                  title="Marquer comme Terminé"
                                  onClick={() => handleStatusChange(appt.id, 'completed')}
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              {appt.status !== 'cancelled' && (
                                <button
                                  className="action-btn warning"
                                  title="Annuler"
                                  onClick={() => handleStatusChange(appt.id, 'cancelled')}
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                              <button
                                className="action-btn danger"
                                title="Supprimer"
                                onClick={() => handleDeleteAppointment(appt.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: BARBERS */}
        {activeTab === 'barbers' && (
          <div className="tab-content">
            <div className="block-header">
              <h3>Équipe de Barbiers</h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingItem(null);
                  setBarberForm({ name: '', role: 'Barbier', email: '', phone: '' });
                  setShowBarberModal(true);
                }}
              >
                <Plus size={14} />
                <span>Ajouter un Barbier</span>
              </button>
            </div>

            <div className="barbers-admin-grid">
              {barbers.map((b) => (
                <div key={b.id} className="barber-admin-card">
                  <div className="barber-admin-avatar">
                    <User size={36} color="var(--accent-gold)" />
                  </div>
                  <div className="barber-admin-info">
                    <h4>{b.name}</h4>
                    <span className="role-tag">{b.role || 'Barbier'}</span>
                    <p className="contact-detail">{b.email || 'Pas d\'email'}</p>
                    <p className="contact-detail">{b.phone || 'Pas de téléphone'}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingItem(b);
                        setBarberForm({
                          name: b.name,
                          role: b.role || 'Barbier',
                          email: b.email || '',
                          phone: b.phone || ''
                        });
                        setShowBarberModal(true);
                      }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      className="btn btn-secondary btn-sm danger"
                      onClick={() => handleDeleteBarber(b.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: SERVICES */}
        {activeTab === 'services' && (
          <div className="tab-content">
            <div className="block-header">
              <h3>Services & Tarifs</h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingItem(null);
                  setServiceForm({ name: '', duration_minutes: 30, price: 1000 });
                  setShowServiceModal(true);
                }}
              >
                <Plus size={14} />
                <span>Nouveau Service</span>
              </button>
            </div>

            <div className="services-admin-grid">
              {services.map((s) => (
                <div key={s.id} className="service-admin-card">
                  <div className="service-main-detail">
                    <h4>{s.name}</h4>
                    <span className="duration-tag">{s.duration_minutes} minutes</span>
                  </div>
                  <div className="service-price-tag">
                    {s.price} DA
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingItem(s);
                        setServiceForm({
                          name: s.name,
                          duration_minutes: s.duration_minutes,
                          price: s.price
                        });
                        setShowServiceModal(true);
                      }}
                    >
                      <Edit size={14} /> Modifier
                    </button>
                    <button
                      className="btn btn-secondary btn-sm danger"
                      onClick={() => handleDeleteService(s.id)}
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="tab-content">
            <div className="block-header">
              <h3>Messages Clientélisme</h3>
            </div>

            {messages.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={36} color="var(--text-muted)" />
                <p>Aucun message reçu pour le moment.</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((m) => (
                  <div key={m.id} className={`message-card ${m.is_read ? 'read' : 'unread'}`}>
                    <div className="message-header">
                      <div>
                        <h4>{m.client_name}</h4>
                        <span className="contact-sub">{m.contact_info}</span>
                      </div>
                      <span className="message-date">
                        {new Date(m.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="message-body">{m.message}</p>
                    <div className="message-actions">
                      {!m.is_read && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMarkRead(m.id)}
                        >
                          <Check size={14} /> Marquer comme lu
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm danger"
                        onClick={() => handleDeleteMsg(m.id)}
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: SUPABASE BASE SETUP */}
        {activeTab === 'setup' && (
          <div className="tab-content">
            <div className="setup-grid">
              <div className="setup-card">
                <h3>Configuration Supabase</h3>
                <p className="setup-desc">
                  Connectez votre projet Supabase cloud ou enregistrez vos identifiants pour la synchronisation directe.
                </p>

                <div className="connection-status-box">
                  {isSupabaseConfigured() ? (
                    <div className="status-alert success">
                      <CheckCircle size={20} />
                      <div>
                        <strong>Supabase Configuré</strong>
                        <p>URL: {SUPABASE_URL}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="status-alert warning">
                      <AlertCircle size={20} />
                      <div>
                        <strong>Supabase Non Configuré</strong>
                        <p>L'application utilise actuellement un stockage réactif local (Local Storage).</p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSaveConfig} style={{ marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">URL Supabase (VITE_SUPABASE_URL)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Clé Anonyme (VITE_SUPABASE_ANON_KEY)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button type="submit" className="btn btn-primary">
                      Enregistrer & Connecter
                    </button>
                    {isSupabaseConfigured() && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={clearSupabaseConfig}
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </form>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>Mot de passe Administrateur</h4>
                  <p className="setup-desc" style={{ marginBottom: '0.75rem' }}>
                    Modifiez le mot de passe local d'accès au tableau de bord.
                  </p>
                  <form onSubmit={handleChangePasscode} style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Nouveau mot de passe"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      Enregistrer
                    </button>
                  </form>
                </div>
              </div>

              <div className="setup-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Script SQL (.sqlScript)</h3>
                  <button className="btn btn-secondary btn-sm" onClick={copySqlScript}>
                    {copiedSql ? <Check size={14} color="#c5a059" /> : <Copy size={14} />}
                    <span>{copiedSql ? 'Copié !' : 'Copier SQL'}</span>
                  </button>
                </div>
                <p className="setup-desc">
                  Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase pour créer les tables (`barbers`, `services`, `appointments`, `messages`) et configurer la sécurité RLS.
                </p>

                <div className="code-block-preview">
                  <pre>
{`CREATE TABLE barbers (...);
CREATE TABLE services (...);
CREATE TABLE appointments (...);
CREATE TABLE messages (...);

ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public barbers policy" ON barbers FOR ALL USING (true);`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD APPOINTMENT */}
      {showApptModal && (
        <div className="modal-overlay" onClick={() => setShowApptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Nouveau Rendez-vous</h3>
            <form onSubmit={handleCreateAppointment}>
              <div className="form-group">
                <label className="form-label">Nom du client *</label>
                <input
                  type="text"
                  className="form-input"
                  value={apptForm.client_name}
                  onChange={(e) => setApptForm({ ...apptForm, client_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={apptForm.client_phone}
                  onChange={(e) => setApptForm({ ...apptForm, client_phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Barbier</label>
                <select
                  className="form-select"
                  value={apptForm.barber_id}
                  onChange={(e) => setApptForm({ ...apptForm, barber_id: e.target.value })}
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service</label>
                <select
                  className="form-select"
                  value={apptForm.service_id}
                  onChange={(e) => setApptForm({ ...apptForm, service_id: e.target.value })}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.price} DA</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={apptForm.date}
                    onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Heure</label>
                  <input
                    type="time"
                    className="form-input"
                    value={apptForm.time}
                    onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary btn-full">Enregistrer</button>
                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowApptModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT BARBER */}
      {showBarberModal && (
        <div className="modal-overlay" onClick={() => setShowBarberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingItem ? 'Modifier Barbier' : 'Nouveau Barbier'}</h3>
            <form onSubmit={handleSaveBarber}>
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input
                  type="text"
                  className="form-input"
                  value={barberForm.name}
                  onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rôle / Spécialité</label>
                <input
                  type="text"
                  className="form-input"
                  value={barberForm.role}
                  onChange={(e) => setBarberForm({ ...barberForm, role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={barberForm.email}
                  onChange={(e) => setBarberForm({ ...barberForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={barberForm.phone}
                  onChange={(e) => setBarberForm({ ...barberForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary btn-full">Sauvegarder</button>
                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowBarberModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT SERVICE */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingItem ? 'Modifier Service' : 'Nouveau Service'}</h3>
            <form onSubmit={handleSaveService}>
              <div className="form-group">
                <label className="form-label">Nom de la prestation *</label>
                <input
                  type="text"
                  className="form-input"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Durée (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prix (DA)</label>
                <input
                  type="number"
                  className="form-input"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary btn-full">Sauvegarder</button>
                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowServiceModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
