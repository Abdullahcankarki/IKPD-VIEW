import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { AuftraggeberResource, KlientResource, RechnungResource } from '../Resources';
import { fetchAuftraggeber, fetchAlleKlienten, fetchAlleRechnungen, getRechnungPdfUrl } from '../services/api';

export default function AuftraggeberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [auftraggeber, setAuftraggeber] = useState<AuftraggeberResource | null>(null);
  const [klienten, setKlienten] = useState<KlientResource[]>([]);
  const [rechnungen, setRechnungen] = useState<RechnungResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchAuftraggeber(id),
      fetchAlleKlienten(),
      fetchAlleRechnungen(),
    ])
      .then(([a, alleKlienten, alleRechnungen]) => {
        setAuftraggeber(a);
        const zugeordneteKlienten = alleKlienten.filter(k =>
          k.auftraggeberNamen?.includes(id)
        );
        setKlienten(zugeordneteKlienten);
        const klientenIds = new Set(zugeordneteKlienten.map(k => k._id));
        setRechnungen(alleRechnungen.filter(r => klientenIds.has(r.klientId)));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="ikpd-loading">
        <Spinner animation="border" />
        <div className="mt-3 text-muted">Laden...</div>
      </div>
    );
  }

  if (error || !auftraggeber) {
    return (
      <div className="ikpd-page">
        <div className="ikpd-detail-hero">
          <div className="ikpd-detail-hero-top">
            <button className="ikpd-back-btn" onClick={() => navigate('/auftraggeber')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Zurück zu Auftraggeber
            </button>
          </div>
        </div>
        <div className="ikpd-detail-empty">{error || 'Auftraggeber nicht gefunden.'}</div>
      </div>
    );
  }

  const gesamtBetrag = rechnungen.reduce((sum, r) => sum + r.gesamtBetrag, 0);
  const initials = auftraggeber.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="ikpd-page">
      {/* Hero Header */}
      <div className="ikpd-detail-hero">
        <div className="ikpd-detail-hero-top">
          <button className="ikpd-back-btn" onClick={() => navigate('/auftraggeber')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Zurück zu Auftraggeber
          </button>
        </div>
        <div className="ikpd-detail-hero-content">
          <div className="ikpd-detail-avatar">{initials}</div>
          <div className="ikpd-detail-hero-info">
            <h1 className="ikpd-detail-title">{auftraggeber.name}</h1>
            <div className="ikpd-detail-subtitle">
              <span className="ikpd-detail-subtitle-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                {auftraggeber.institution}
              </span>
              <span style={{ color: 'var(--ikpd-text-muted)' }}>
                {auftraggeber.funktion}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Statistiken */}
      <div className="ikpd-detail-stats">
        <div className="ikpd-detail-stat ikpd-detail-stat--primary">
          <div className="ikpd-detail-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div className="ikpd-detail-stat-body">
            <div className="ikpd-detail-stat-label">Klienten</div>
            <div className="ikpd-detail-stat-value">{klienten.length}</div>
          </div>
        </div>
        <div className="ikpd-detail-stat ikpd-detail-stat--info">
          <div className="ikpd-detail-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z" /><path d="M8 10h8" /><path d="M8 14h4" /></svg>
          </div>
          <div className="ikpd-detail-stat-body">
            <div className="ikpd-detail-stat-label">Rechnungen</div>
            <div className="ikpd-detail-stat-value">{rechnungen.length}</div>
          </div>
        </div>
        <div className="ikpd-detail-stat ikpd-detail-stat--success">
          <div className="ikpd-detail-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <div className="ikpd-detail-stat-body">
            <div className="ikpd-detail-stat-label">Gesamtbetrag</div>
            <div className="ikpd-detail-stat-value">{gesamtBetrag.toFixed(2)} €</div>
          </div>
        </div>
      </div>

      {/* Kontaktdaten */}
      <div className="ikpd-detail-card">
        <div className="ikpd-detail-card-header">
          <div className="ikpd-detail-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
          </div>
          <h3>Kontaktdaten</h3>
        </div>
        <div className="ikpd-detail-card-body">
          <div className="ikpd-detail-grid">
            <div className="ikpd-detail-field">
              <span className="ikpd-detail-field-label">Name</span>
              <span className="ikpd-detail-field-value">{auftraggeber.name}</span>
            </div>
            <div className="ikpd-detail-field">
              <span className="ikpd-detail-field-label">Institution</span>
              <span className="ikpd-detail-field-value">{auftraggeber.institution}</span>
            </div>
            <div className="ikpd-detail-field">
              <span className="ikpd-detail-field-label">Funktion</span>
              <span className="ikpd-detail-field-value">{auftraggeber.funktion}</span>
            </div>
            <div className="ikpd-detail-field">
              <span className="ikpd-detail-field-label">E-Mail</span>
              <span className="ikpd-detail-field-value">{auftraggeber.email}</span>
            </div>
            {auftraggeber.telefonnummer && (
              <div className="ikpd-detail-field">
                <span className="ikpd-detail-field-label">Telefon</span>
                <span className="ikpd-detail-field-value">{auftraggeber.telefonnummer}</span>
              </div>
            )}
            <div className="ikpd-detail-field">
              <span className="ikpd-detail-field-label">Adresse</span>
              <span className="ikpd-detail-field-value">{auftraggeber.adresse}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Klienten */}
      <div className="ikpd-detail-section">
        <div className="ikpd-detail-section-header">
          <h3>
            <span className="ikpd-detail-section-icon ikpd-detail-section-icon--users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
            Klienten
          </h3>
          <span className="ikpd-detail-section-count">{klienten.length}</span>
        </div>
        <div className="ikpd-detail-section-body">
          {klienten.length === 0 ? (
            <div className="ikpd-detail-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              Keine Klienten zugeordnet.
            </div>
          ) : (
            klienten.map(k => {
              const ki = k.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
              return (
                <div
                  key={k._id}
                  className="ikpd-detail-list-item ikpd-detail-list-item-clickable"
                  onClick={() => navigate(`/klienten/${k._id}`)}
                >
                  <div className="ikpd-detail-list-avatar ikpd-detail-list-avatar--user">{ki}</div>
                  <div className="ikpd-detail-list-item-info">
                    <div className="ikpd-detail-list-item-primary">{k.name}</div>
                    <div className="ikpd-detail-list-item-secondary">
                      {k.geburtsdatum && new Date(k.geburtsdatum).toLocaleDateString('de-DE')}
                      {k.email && ` · ${k.email}`}
                    </div>
                  </div>
                  <div className="ikpd-detail-list-item-right">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ikpd-text-muted)' }}><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rechnungen */}
      <div className="ikpd-detail-section">
        <div className="ikpd-detail-section-header">
          <h3>
            <span className="ikpd-detail-section-icon ikpd-detail-section-icon--bill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z" /><path d="M8 10h8" /><path d="M8 14h4" /></svg>
            </span>
            Rechnungen
          </h3>
          <span className="ikpd-detail-section-count">{rechnungen.length}</span>
        </div>
        <div className="ikpd-detail-section-body">
          {rechnungen.length === 0 ? (
            <div className="ikpd-detail-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z" /><path d="M8 10h8" /><path d="M8 14h4" /></svg>
              Keine Rechnungen vorhanden.
            </div>
          ) : (
            rechnungen
              .sort((a, b) => {
                if (a.jahr !== b.jahr) return b.jahr - a.jahr;
                return b.monat - a.monat;
              })
              .map(r => (
                <div key={r._id} className="ikpd-detail-list-item">
                  <div className="ikpd-detail-list-avatar ikpd-detail-list-avatar--bill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  </div>
                  <div className="ikpd-detail-list-item-info">
                    <div className="ikpd-detail-list-item-primary">
                      Nr. {r.rechnungsnummer} · {r.klientName}
                    </div>
                    <div className="ikpd-detail-list-item-secondary">
                      {String(r.monat).padStart(2, '0')}/{r.jahr} · {r.artDerMassnahme}
                    </div>
                  </div>
                  <div className="ikpd-detail-list-item-right">
                    <span className="ikpd-detail-list-item-amount">
                      {r.gesamtBetrag.toFixed(2)} €
                    </span>
                    <a
                      href={getRechnungPdfUrl(r._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm ikpd-btn ikpd-btn-outline-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      {' '}PDF
                    </a>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
