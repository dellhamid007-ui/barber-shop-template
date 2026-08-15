import React, { useState } from 'react';
import { Scissors, Calendar, MapPin, Phone, Clock, Star, Check, X, Menu, User } from 'lucide-react';

const SERVICES = [
  { id: 'coupe', name: 'Coupe Classique', price: '1 000 DA', duration: '30 min' },
  { id: 'barbe', name: 'Taille de Barbe', price: '800 DA', duration: '20 min' },
  { id: 'rituel', name: 'Formule Coupe & Barbe', price: '1 600 DA', duration: '45 min' },
  { id: 'rasage', name: "Rasage à l'Ancienne", price: '1 200 DA', duration: '30 min' },
];

const BARBERS = [
  { id: 'karim', name: 'Karim', role: 'Maître Barbier', initial: 'K' },
  { id: 'amine', name: 'Amine', role: 'Spécialiste Barbe', initial: 'A' },
  { id: 'sofiane', name: 'Sofiane', role: 'Styliste Coiffeur', initial: 'S' },
];

const REVIEWS = [
  { name: 'Yassine K.', text: 'Très satisfait du service. Travail propre et soigné.' },
  { name: 'Khaled B.', text: 'Meilleur barbier de la ville. Ambiance calme et accueil au top.' },
  { name: 'Nabil M.', text: 'Rasage parfait et serviette chaude très agréable.' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(SERVICES[0].id);
  const [selectedBarber, setSelectedBarber] = useState(BARBERS[0].id);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleBooking = (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;
    setConfirmed(true);
    notify('Rendez-vous confirmé !');
  };

  const handleContact = (e) => {
    e.preventDefault();
    notify('Message envoyé avec succès.');
    e.target.reset();
  };

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
            {SERVICES.map((s) => (
              <div key={s.id} className="service-card">
                <div className="service-info">
                  <h3>{s.name}</h3>
                  <span className="service-meta">{s.duration}</span>
                </div>
                <div className="service-right">
                  <span className="service-price">{s.price}</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setSelectedService(s.id); setConfirmed(false); setModalOpen(true); }}
                  >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
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
            {BARBERS.map((b) => (
              <div key={b.id} className="barber-card">
                <div className="blank-barber-avatar">
                  <User size={54} strokeWidth={1.5} />
                </div>
                <div className="barber-details">
                  <h3>{b.name}</h3>
                  <div className="barber-role">{b.role}</div>
                  <button
                    className="btn btn-secondary btn-sm btn-full"
                    onClick={() => { setSelectedBarber(b.id); setConfirmed(false); setModalOpen(true); }}
                  >
                    Réserver avec {b.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Contact</h4>
              <form onSubmit={handleContact}>
                <div className="form-group">
                  <label className="form-label">Nom complet</label>
                  <input type="text" className="form-input" placeholder="Mounir B." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" placeholder="Votre message..." required></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-full">Envoyer</button>
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

      {/* MODAL RÉSERVATION */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>

            {!confirmed ? (
              <>
                <h3 className="modal-title">Réservation</h3>
                <p className="modal-subtitle">Sélectionnez la prestation et le coiffeur.</p>

                <form onSubmit={handleBooking}>
                  <div className="form-group">
                    <label className="form-label">Prestation</label>
                    <select
                      className="form-select"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                    >
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.price})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Barbier</label>
                    <select
                      className="form-select"
                      value={selectedBarber}
                      onChange={(e) => setSelectedBarber(e.target.value)}
                    >
                      {BARBERS.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nom complet</label>
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
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="05 50 12 34 56"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>
                    Confirmer le Rendez-vous
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Réservation Confirmée !</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Merci {clientName}. Votre rendez-vous pour <strong>{SERVICES.find(s => s.id === selectedService)?.name}</strong> avec <strong>{BARBERS.find(b => b.id === selectedBarber)?.name}</strong> est enregistré.
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
