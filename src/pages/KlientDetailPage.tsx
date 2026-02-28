import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Badge } from 'react-bootstrap';
import { KlientResource, TerminResource, RechnungResource, AuftraggeberResource } from '../Resources';
import { fetchKlient, fetchMeineTermine, fetchRechnungenVonKlient, getRechnungPdfUrl, fetchAlleAuftraggeber } from '../services/api';

const MONATE_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONATE_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export default function KlientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [klient, setKlient] = useState<KlientResource | null>(null);
  const [termine, setTermine] = useState<TerminResource[]>([]);
  const [rechnungen, setRechnungen] = useState<RechnungResource[]>([]);
  const [auftraggeber, setAuftraggeber] = useState<AuftraggeberResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchKlient(id),
      fetchMeineTermine(),
      fetchRechnungenVonKlient(id),
      fetchAlleAuftraggeber(),
    ])
      .then(([k, alleTermine, r, alleAuftraggeber]) => {
        setKlient(k);
        setTermine(alleTermine.filter(t => t.klientId === id));
        setRechnungen(r);
        setAuftraggeber(alleAuftraggeber.filter(a => k.auftraggeberNamen?.includes(a._id)));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const termineGrouped = useMemo(() => {
    const sorted = [...termine].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
    const years: { year: number; months: { month: number; termine: TerminResource[] }[] }[] = [];
    const yearMap = new Map<number, Map<number, TerminResource[]>>();
    for (const t of sorted) {
      const d = new Date(t.datum);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!yearMap.has(y)) yearMap.set(y, new Map());
      const monthMap = yearMap.get(y)!;
      if (!monthMap.has(m)) monthMap.set(m, []);
      monthMap.get(m)!.push(t);
    }
    for (const [year, monthMap] of Array.from(yearMap.entries()).sort((a, b) => b[0] - a[0])) {
      const months = Array.from(monthMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, termine]) => ({ month, termine }));
      years.push({ year, months });
    }
    return years;
  }, [termine]);

  // Standardmäßig nur den neuesten Monat offen lassen
  useEffect(() => {
    if (termineGrouped.length === 0) return;
    const collapsed = new Set<string>();
    termineGrouped.forEach(({ year, months }, yi) => {
      if (yi > 0) collapsed.add(`y-${year}`);
      months.forEach(({ month }, mi) => {
        if (yi > 0 || mi > 0) collapsed.add(`m-${year}-${month}`);
      });
    });
    setCollapsedGroups(collapsed);
  }, [termineGrouped]);

  if (loading) {
    return (
      <div className="ikpd-loading">
        <Spinner animation="border" />
        <div className="mt-3 text-muted">Laden...</div>
      </div>
    );
  }

  if (error || !klient) {
    return (
      <div className="ikpd-page">
        <div className="ikpd-detail-hero">
          <div className="ikpd-detail-hero-top">
            <button className="ikpd-back-btn" onClick={() => navigate('/klienten')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Zurück zu Klienten
            </button>
          </div>
        </div>
        <div className="ikpd-detail-empty">{error || 'Klient nicht gefunden.'}</div>
      </div>
    );
  }

  const gesamtBetrag = rechnungen.reduce((sum, r) => sum + r.gesamtBetrag, 0);
  const initials = klient.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const statusLabel = (s: string) => {
    if (s === 'abgeschlossen') return 'Abgeschlossen';
    if (s === 'abgesagt') return 'Abgesagt';
    return 'Geplant';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDauer = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  const isCollapsed = (key: string) => collapsedGroups !== null && collapsedGroups.has(key);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev ?? []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="ikpd-page">
      {/* Hero Header */}
      <div className="ikpd-detail-hero">
        <div className="ikpd-detail-hero-top">
          <button className="ikpd-back-btn" onClick={() => navigate('/klienten')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Zurück zu Klienten
          </button>
        </div>
        <div className="ikpd-detail-hero-content">
          <div className="ikpd-detail-avatar">{initials}</div>
          <div className="ikpd-detail-hero-info">
            <h1 className="ikpd-detail-title">{klient.name}</h1>
            <div className="ikpd-detail-subtitle">
              <span className="ikpd-detail-subtitle-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {formatDate(klient.geburtsdatum)}
              </span>
              {klient.email && (
                <span style={{ color: 'var(--ikpd-text-muted)' }}>
                  {klient.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Statistiken */}
      <div className="ikpd-detail-stats">
        <div className="ikpd-detail-stat ikpd-detail-stat--primary">
          <div className="ikpd-detail-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <div className="ikpd-detail-stat-body">
            <div className="ikpd-detail-stat-label">Termine</div>
            <div className="ikpd-detail-stat-value">{termine.length}</div>
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

      {/* Stammdaten */}
      <div className="ikpd-detail-card">
        <div className="ikpd-detail-card-header">
          <div className="ikpd-detail-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          </div>
          <h3>Stammdaten</h3>
        </div>
        <div className="ikpd-detail-card-body">
          <div className="ikpd-detail-grid">
            <div className="ikpd-detail-field">
              <span className="ikpd-detail-field-label">Name</span>
              <span className="ikpd-detail-field-value">{klient.name}</span>
            </div>
            <div className="ikpd-detail-field">
              <span className="ikpd-detail-field-label">Geburtsdatum</span>
              <span className="ikpd-detail-field-value">{formatDate(klient.geburtsdatum)}</span>
            </div>
            {klient.email && (
              <div className="ikpd-detail-field">
                <span className="ikpd-detail-field-label">E-Mail</span>
                <span className="ikpd-detail-field-value">{klient.email}</span>
              </div>
            )}
            {klient.telefonnummer && (
              <div className="ikpd-detail-field">
                <span className="ikpd-detail-field-label">Telefon</span>
                <span className="ikpd-detail-field-value">{klient.telefonnummer}</span>
              </div>
            )}
            {(klient.strasse || klient.ort) && (
              <div className="ikpd-detail-field">
                <span className="ikpd-detail-field-label">Adresse</span>
                <span className="ikpd-detail-field-value">
                  {[klient.strasse, klient.hausnummer].filter(Boolean).join(' ')}{klient.strasse && klient.plz ? ', ' : ''}{[klient.plz, klient.ort].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
            {klient.kontaktperson?.name && (
              <div className="ikpd-detail-field">
                <span className="ikpd-detail-field-label">Kontaktperson</span>
                <span className="ikpd-detail-field-value">
                  {klient.kontaktperson.name}
                  {klient.kontaktperson.telefonnummer && ` · ${klient.kontaktperson.telefonnummer}`}
                  {klient.kontaktperson.email && ` · ${klient.kontaktperson.email}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auftraggeber */}
      <div className="ikpd-detail-section">
        <div className="ikpd-detail-section-header">
          <h3>
            <span className="ikpd-detail-section-icon ikpd-detail-section-icon--users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
            </span>
            Auftraggeber
          </h3>
          <span className="ikpd-detail-section-count">{auftraggeber.length}</span>
        </div>
        <div className="ikpd-detail-section-body">
          {auftraggeber.length === 0 ? (
            <div className="ikpd-detail-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
              Keine Auftraggeber zugeordnet.
            </div>
          ) : (
            auftraggeber.map(a => {
              const ai = a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div
                  key={a._id}
                  className="ikpd-detail-list-item ikpd-detail-list-item-clickable"
                  onClick={() => navigate(`/auftraggeber/${a._id}`)}
                >
                  <div className="ikpd-detail-list-avatar ikpd-detail-list-avatar--user">{ai}</div>
                  <div className="ikpd-detail-list-item-info">
                    <div className="ikpd-detail-list-item-primary">{a.name}</div>
                    <div className="ikpd-detail-list-item-secondary">
                      {a.institution} · {a.funktion}
                      {a.email && ` · ${a.email}`}
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

      {/* Termine */}
      <div className="ikpd-detail-section">
        <div className="ikpd-detail-section-header">
          <h3>
            <span className="ikpd-detail-section-icon ikpd-detail-section-icon--cal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </span>
            Termine
          </h3>
          <span className="ikpd-detail-section-count">{termine.length}</span>
        </div>
        <div className="ikpd-detail-section-body">
          {termine.length === 0 ? (
            <div className="ikpd-detail-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              Keine Termine vorhanden.
            </div>
          ) : (
            termineGrouped.map(({ year, months }) => {
              const yearKey = `y-${year}`;
              const yearCollapsed = isCollapsed(yearKey);
              const yearCount = months.reduce((sum, m) => sum + m.termine.length, 0);
              return (
                <div key={year}>
                  <button
                    className="ikpd-detail-group-header ikpd-detail-group-header--year"
                    onClick={() => toggleGroup(yearKey)}
                  >
                    <svg className={`ikpd-detail-group-chevron${yearCollapsed ? '' : ' open'}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    <span className="ikpd-detail-group-title">{year}</span>
                    <span className="ikpd-detail-group-count">{yearCount}</span>
                  </button>
                  {!yearCollapsed && months.map(({ month, termine: monthTermine }) => {
                    const monthKey = `m-${year}-${month}`;
                    const monthCollapsed = isCollapsed(monthKey);
                    return (
                      <div key={month}>
                        <button
                          className="ikpd-detail-group-header ikpd-detail-group-header--month"
                          onClick={() => toggleGroup(monthKey)}
                        >
                          <svg className={`ikpd-detail-group-chevron${monthCollapsed ? '' : ' open'}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                          <span className="ikpd-detail-group-title">{MONATE_LANG[month]}</span>
                          <span className="ikpd-detail-group-count">{monthTermine.length}</span>
                        </button>
                        {!monthCollapsed && monthTermine.map(t => {
                          const d = new Date(t.datum);
                          return (
                            <div key={t._id} className="ikpd-detail-list-item">
                              <div className="ikpd-detail-list-avatar ikpd-detail-list-avatar--date">
                                <span className="day">{d.getDate()}</span>
                                <span className="month">{MONATE_KURZ[d.getMonth()]}</span>
                              </div>
                              <div className="ikpd-detail-list-item-info">
                                <div className="ikpd-detail-list-item-primary">
                                  <span className={`ikpd-detail-status-dot ikpd-detail-status-dot--${t.status}`} />
                                  {formatTime(t.datum)} · {formatDauer(t.dauer)}
                                </div>
                                <div className="ikpd-detail-list-item-secondary">
                                  {statusLabel(t.status)}
                                  {t.beschreibung && ` · ${t.beschreibung}`}
                                </div>
                              </div>
                              <div className="ikpd-detail-list-item-right">
                                <Badge bg={t.status === 'abgeschlossen' ? 'success' : t.status === 'abgesagt' ? 'danger' : 'warning'}
                                  style={{ fontSize: '0.7rem' }}>
                                  {statusLabel(t.status)}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
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
                      Nr. {r.rechnungsnummer}
                    </div>
                    <div className="ikpd-detail-list-item-secondary">
                      {String(r.monat).padStart(2, '0')}/{r.jahr} · {r.artDerMassnahme}
                      {r.empfaenger === 'auftraggeber' && r.auftraggeberName && ` · An: ${r.auftraggeberName}`}
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
