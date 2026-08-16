import { useState, useEffect } from 'react';
import { Scissors, Calendar, MapPin, Phone, Clock, Star, Check, X, Menu, User, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import './Admin.css';
import {
  fetchBarbers,
  fetchServices,
  createAppointment,
  createMessage
} from '../lib/supabase';

export default function App() {
  const [view, setView] = useState('site'); // 'site' | 'admin'
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Dynamic Data from Supabase / Store
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllBarbers, setShowAllBarbers] = useState(false);

  // Selection & Form State
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load Barbers & Services dynamically
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [barbRes, servRes] = await Promise.all([
          fetchBarbers(),
          fetchServices()
        ]);

        if (isMounted) {
          const barbList = barbRes.data || [];
          const servList = servRes.data || [];

          setBarbers(barbList);
          setServices(servList);

          if (servList.length > 0) {
            setSelectedServiceId(prev => prev || servList[0].id);
          }
          if (barbList.length > 0) {
            setSelectedBarberId(prev => prev || barbList[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading barbers/services:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Handle Booking Submission
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedServiceId || !selectedBarberId) {
      notify('Veuillez remplir tous les champs requis.');
      return;
    }

    const startTimeIso = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();

    const payload = {
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail || null,
      barber_id: Number(selectedBarberId),
      service_id: Number(selectedServiceId),
      start_time: startTimeIso,
      status: 'confirmed'
    };

    const res = await createAppointment(payload);
    if (!res.error) {
      setConfirmed(true);
      notify('Rendez-vous enregistré avec succès dans la base de données !');
    } else {
      notify('Erreur lors de la réservation. Veuillez réessayer.');
    }
  };

  // Handle Contact Form Submission
  const handleContact = async (e) => {
    e.preventDefault();
    if (!contactName || !contactMsg) return;

    setContactSubmitting(true);
    const payload = {
      client_name: contactName,
      contact_info: contactInfo || 'Non spécifié',
      message: contactMsg
    };

    const res = await createMessage(payload);
    setContactSubmitting(false);

    if (!res.error) {
      notify('Message envoyé et enregistré avec succès !');
      setContactName('');
      setContactInfo('');
      setContactMsg('');
    } else {
      notify('Erreur lors de l\'envoi du message.');
    }
  };

  const REVIEWS = [
    { name: 'Yassine K.', text: 'Très satisfait du service. Travail propre et soigné.' },
    { name: 'Khaled B.', text: 'Meilleur barbier de la ville. Ambiance calme et accueil au top.' },
    { name: 'Nabil M.', text: 'Rasage parfait et serviette chaude très agréable.' }
  ];

  // Render Admin View if toggled
  if (view === 'admin') {
    return <AdminDashboard onReturnToSite={() => setView('site')} />;
  }

  const selectedServiceObj = services.find(s => s.id === Number(selectedServiceId)) || services[0];
  const selectedBarberObj = barbers.find(b => b.id === Number(selectedBarberId)) || barbers[0];

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <Check size={16} color="#c5a059" />
          <span>{toast}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="header">
        <div className="container nav-wrapper">
          <a href="#" className="brand-logo">
            <Scissors className="brand-icon" size={22} />
            <span>L'ATELIER BARBIER</span>
          </a>

          <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <li><a href="#services" onClick={() => setMenuOpen(false)}>Services</a></li>
            <li><a href="#equipe" onClick={() => setMenuOpen(false)}>Équipe</a></li>
            <li><a href="#avis" onClick={() => setMenuOpen(false)}>Avis</a></li>
            <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
          </ul>

          <div className="nav-actions">
            {/* Button to open Admin Dashboard */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setView('admin')}
              title="Accéder au Tableau de bord Administrateur"
            >
              <ShieldCheck size={15} color="var(--accent-gold)" />
              <span>Admin</span>
            </button>

            <button className="btn btn-primary btn-sm" onClick={() => { setConfirmed(false); setModalOpen(true); }}>
              <Calendar size={15} />
              <span>Réserver</span>
            </button>

            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="hero-tag">Alger &bull; Coiffure Homme</div>
            <h1>L'art du soin masculin.</h1>
            <p className="hero-subtitle">
              Coupes traditionnelles, taille de barbe et rasage dans un cadre épuré.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => { setConfirmed(false); setModalOpen(true); }}>
                <span>Prendre Rendez-vous</span>
              </button>
              <a href="#services" className="btn btn-secondary">
                <span>Voir les tarifs</span>
              </a>
            </div>
          </div>

          <div className="blank-hero-placeholder">
            <Scissors className="blank-hero-icon" size={48} />
            <span className="blank-hero-text">L'ATELIER BARBIER &bull; ALGER</span>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Services & Tarifs</h2>
            <p>Prestations réalisées avec soin par nos barbiers.</p>
          </div>

          <div className="services-grid">
            {(showAllServices ? services : services.slice(0, 3)).map((s) => (
              <div key={s.id} className="service-card">
                <div className="service-info">
                  <h3>{s.name}</h3>
                  <span className="service-meta">{s.duration_minutes} min</span>
                </div>
                <div className="service-right">
                  <span className="service-price">{s.price} DA</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setConfirmed(false);
                      setModalOpen(true);
                    }}
                  >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>

          {services.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAllServices(!showAllServices)}
              >
                <span>{showAllServices ? 'Voir moins de services' : `Voir tous les services (${services.length})`}</span>
                {showAllServices ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ÉQUIPE */}
      <section id="equipe" className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="container">
          <div className="section-header">
            <h2>L'Équipe</h2>
            <p>Vos coiffeurs barbiers à Alger.</p>
          </div>

          <div className="barbers-grid">
            {(showAllBarbers ? barbers : barbers.slice(0, 3)).map((b) => (
              <div key={b.id} className="barber-card">
                <div className="blank-barber-avatar">
                  <User size={54} strokeWidth={1.5} />
                </div>
                <div className="barber-details">
                  <h3>{b.name}</h3>
                  <div className="barber-role">{b.role || 'Barbier'}</div>
                  <button
                    className="btn btn-secondary btn-sm btn-full"
                    onClick={() => {
                      setSelectedBarberId(b.id);
                      setConfirmed(false);
                      setModalOpen(true);
                    }}
                  >
                    Réserver avec {b.name}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {barbers.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAllBarbers(!showAllBarbers)}
              >
                <span>{showAllBarbers ? 'Voir moins' : `Voir toute l'équipe (${barbers.length})`}</span>
                {showAllBarbers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* AVIS */}
      <section id="avis" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Avis Clients</h2>
            <p>Retour de nos clients réguliers.</p>
          </div>

          <div className="reviews-grid">
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={14} fill="#c5a059" color="#c5a059" />
                  ))}
                </div>
                <p className="review-text">"{r.text}"</p>
                <div className="reviewer-name">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Contact & Horaires</h2>
            <p>Rendez-vous simple et sans attente.</p>
          </div>

          <div className="contact-grid">
            <div className="contact-box">
              <div className="info-item">
                <MapPin className="info-icon" size={20} />
                <div className="info-text">
                  <h4>Adresse</h4>
                  <p>14 Rue Didouche Mourad, Alger</p>
                </div>
              </div>

              <div className="info-item">
                <Phone className="info-icon" size={20} />
                <div className="info-text">
                  <h4>Téléphone</h4>
                  <p><a href="tel:0550123456">05 50 12 34 56</a></p>
                </div>
              </div>

              <div className="info-item">
                <Clock className="info-icon" size={20} />
                <div className="info-text">
                  <h4>Horaires</h4>
                  <p>Samedi – Jeudi : 09h00 – 20h00</p>
                  <p>Vendredi : Fermé</p>
                </div>
              </div>
            </div>

            <div className="contact-box">
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Nous Ecrire</h4>
              <form onSubmit={handleContact}>
                <div className="form-group">
                  <label className="form-label">Nom complet *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Mounir B."
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email ou Téléphone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="mounir@example.com ou 05 50..."
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Votre message..."
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={contactSubmitting}>
                  {contactSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} L'Atelier Barbier - Alger. Tous droits réservés.</p>
        </div>
      </footer>

      {/* MODAL RÉSERVATION PERSISTANTE */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>

            {!confirmed ? (
              <>
                <h3 className="modal-title">Réservation en Ligne</h3>
                <p className="modal-subtitle">Sélectionnez la prestation, le barbier et l'horaire.</p>

                <form onSubmit={handleBooking}>
                  <div className="form-group">
                    <label className="form-label">Prestation *</label>
                    <select
                      className="form-select"
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.price} DA - {s.duration_minutes} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Barbier *</label>
                    <select
                      className="form-select"
                      value={selectedBarberId}
                      onChange={(e) => setSelectedBarberId(e.target.value)}
                    >
                      {barbers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.role || 'Barbier'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Heure *</label>
                      <input
                        type="time"
                        className="form-input"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nom complet *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bilal A."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Téléphone *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="05 50 12 34 56"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email (Optionnel)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="bilal@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>
                    Confirmer la Réservation
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(197, 160, 89, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <Check size={28} color="var(--accent-gold)" />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Réservation Enregistrée !</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Merci <strong>{clientName}</strong>. Votre rendez-vous pour <strong>{selectedServiceObj?.name}</strong> avec <strong>{selectedBarberObj?.name}</strong> le {new Date(bookingDate).toLocaleDateString('fr-FR')} à {bookingTime} est confirmé.
                </p>
                <button className="btn btn-primary btn-full" onClick={() => setModalOpen(false)}>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
