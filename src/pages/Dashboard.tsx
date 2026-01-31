import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner, Badge } from 'react-bootstrap';
import { fetchMeineTermine, fetchAlleKlienten, fetchAlleRechnungen } from '../services/api';
import { TerminResource, KlientResource, RechnungResource } from '../Resources';
import { useNavigate } from 'react-router-dom';

const monate = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const monateLang = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [termine, setTermine] = useState<TerminResource[]>([]);
  const [klienten, setKlienten] = useState<KlientResource[]>([]);
  const [rechnungen, setRechnungen] = useState<RechnungResource[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [termineData, klientenData, rechnungenData] = await Promise.all([
          fetchMeineTermine(),
          fetchAlleKlienten(),
          fetchAlleRechnungen(),
        ]);
        setTermine(termineData);
        setKlienten(klientenData);
        setRechnungen(rechnungenData);
      } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const upcomingTermine = useMemo(() =>
    termine
      .filter((t) => new Date(t.datum) >= now && t.status === 'geplant')
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
      .slice(0, 6),
    [termine]
  );

  const termineThisMonth = useMemo(() =>
    termine.filter((t) => {
      const d = new Date(t.datum);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }),
    [termine, currentMonth, currentYear]
  );

  const completedThisMonth = termineThisMonth.filter((t) => t.status === 'abgeschlossen').length;
  const plannedThisMonth = termineThisMonth.filter((t) => t.status === 'geplant').length;
  const cancelledThisMonth = termineThisMonth.filter((t) => t.status === 'abgesagt').length;

  const revenueTotal = useMemo(() =>
    rechnungen.reduce((sum, r) => sum + (r.gesamtBetrag || 0), 0),
    [rechnungen]
  );

  const revenueThisMonth = useMemo(() =>
    rechnungen
      .filter((r) => r.monat === currentMonth && r.jahr === currentYear)
      .reduce((sum, r) => sum + (r.gesamtBetrag || 0), 0),
    [rechnungen, currentMonth, currentYear]
  );

  // Mini bar chart data: last 6 months revenue
  const revenueByMonth = useMemo(() => {
    const months: { label: string; value: number; isCurrent: boolean }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const val = rechnungen
        .filter((r) => r.monat === m && r.jahr === y)
        .reduce((sum, r) => sum + (r.gesamtBetrag || 0), 0);
      months.push({ label: monate[m - 1], value: val, isCurrent: i === 0 });
    }
    return months;
  }, [rechnungen, currentMonth, currentYear]);

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.value), 1);

  // Termin status distribution for ring
  const totalTermineMonth = termineThisMonth.length;
  const completedPct = totalTermineMonth > 0 ? (completedThisMonth / totalTermineMonth) * 100 : 0;
  const plannedPct = totalTermineMonth > 0 ? (plannedThisMonth / totalTermineMonth) * 100 : 0;

  const fmtCurrency = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC';

  if (loading) {
    return (
      <div className="ikpd-loading">
        <Spinner animation="border" role="status" />
        <div className="mt-3 text-muted">Dashboard wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="ikpd-page">
      {/* Header */}
      <div className="ikpd-dash-header">
        <div>
          <h2 className="ikpd-dash-title">Dashboard</h2>
          <p className="ikpd-dash-subtitle">
            Willkommen, {user?.rolle === 'admin' ? 'Administrator' : 'Therapeut'} &mdash; {monateLang[currentMonth - 1]} {currentYear}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ikpd-dash-kpis">
        <div className="ikpd-dash-kpi ikpd-dash-kpi--primary" role="button" onClick={() => navigate('/klienten')}>
          <div className="ikpd-dash-kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="ikpd-dash-kpi-body">
            <span className="ikpd-dash-kpi-label">Klienten</span>
            <span className="ikpd-dash-kpi-value">{klienten.length}</span>
          </div>
          <div className="ikpd-dash-kpi-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div className="ikpd-dash-kpi ikpd-dash-kpi--info" role="button" onClick={() => navigate('/kalender')}>
          <div className="ikpd-dash-kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="ikpd-dash-kpi-body">
            <span className="ikpd-dash-kpi-label">Termine (Monat)</span>
            <span className="ikpd-dash-kpi-value">{termineThisMonth.length}</span>
            <span className="ikpd-dash-kpi-sub">{completedThisMonth} erledigt &middot; {plannedThisMonth} geplant</span>
          </div>
          <div className="ikpd-dash-kpi-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div className="ikpd-dash-kpi ikpd-dash-kpi--success" role="button" onClick={() => navigate('/rechnungen')}>
          <div className="ikpd-dash-kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
          </div>
          <div className="ikpd-dash-kpi-body">
            <span className="ikpd-dash-kpi-label">Rechnungen</span>
            <span className="ikpd-dash-kpi-value">{rechnungen.length}</span>
          </div>
          <div className="ikpd-dash-kpi-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div className="ikpd-dash-kpi ikpd-dash-kpi--warning">
          <div className="ikpd-dash-kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="ikpd-dash-kpi-body">
            <span className="ikpd-dash-kpi-label">Umsatz (Gesamt)</span>
            <span className="ikpd-dash-kpi-value">{fmtCurrency(revenueTotal)}</span>
            {revenueThisMonth > 0 && (
              <span className="ikpd-dash-kpi-sub">Dieser Monat: {fmtCurrency(revenueThisMonth)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="ikpd-dash-grid">
        {/* Revenue Chart Card */}
        <div className="ikpd-dash-card ikpd-dash-chart-card">
          <div className="ikpd-dash-card-header">
            <div className="ikpd-dash-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Umsatz (letzte 6 Monate)
            </div>
          </div>
          <div className="ikpd-dash-chart">
            {revenueByMonth.map((m, i) => (
              <div key={i} className={`ikpd-dash-bar-col ${m.isCurrent ? 'current' : ''}`}>
                <span className="ikpd-dash-bar-value">{m.value > 0 ? fmtCurrency(m.value) : ''}</span>
                <div className="ikpd-dash-bar-track">
                  <div
                    className="ikpd-dash-bar-fill"
                    style={{ height: `${Math.max((m.value / maxRevenue) * 100, 4)}%` }}
                  />
                </div>
                <span className="ikpd-dash-bar-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Termine Status Card */}
        <div className="ikpd-dash-card ikpd-dash-status-card">
          <div className="ikpd-dash-card-header">
            <div className="ikpd-dash-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Termine-Status ({monateLang[currentMonth - 1]})
            </div>
          </div>
          <div className="ikpd-dash-status-content">
            <div className="ikpd-dash-ring-wrapper">
              <svg viewBox="0 0 120 120" className="ikpd-dash-ring">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                {totalTermineMonth > 0 && (
                  <>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--ikpd-success)" strokeWidth="12"
                      strokeDasharray={`${completedPct * 3.14} ${314 - completedPct * 3.14}`}
                      strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 60 60)" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--ikpd-info)" strokeWidth="12"
                      strokeDasharray={`${plannedPct * 3.14} ${314 - plannedPct * 3.14}`}
                      strokeDashoffset={`${-completedPct * 3.14}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </>
                )}
                <text x="60" y="55" textAnchor="middle" className="ikpd-dash-ring-number">{totalTermineMonth}</text>
                <text x="60" y="72" textAnchor="middle" className="ikpd-dash-ring-label">Termine</text>
              </svg>
            </div>
            <div className="ikpd-dash-status-legend">
              <div className="ikpd-dash-legend-item">
                <span className="ikpd-dash-legend-dot" style={{ background: 'var(--ikpd-success)' }} />
                <span className="ikpd-dash-legend-label">Abgeschlossen</span>
                <span className="ikpd-dash-legend-value">{completedThisMonth}</span>
              </div>
              <div className="ikpd-dash-legend-item">
                <span className="ikpd-dash-legend-dot" style={{ background: 'var(--ikpd-info)' }} />
                <span className="ikpd-dash-legend-label">Geplant</span>
                <span className="ikpd-dash-legend-value">{plannedThisMonth}</span>
              </div>
              <div className="ikpd-dash-legend-item">
                <span className="ikpd-dash-legend-dot" style={{ background: 'var(--ikpd-danger)' }} />
                <span className="ikpd-dash-legend-label">Abgesagt</span>
                <span className="ikpd-dash-legend-value">{cancelledThisMonth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Termine */}
        <div className="ikpd-dash-card ikpd-dash-termine-card">
          <div className="ikpd-dash-card-header">
            <div className="ikpd-dash-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Kommende Termine
            </div>
            <button className="ikpd-dash-card-link" onClick={() => navigate('/kalender')}>
              Alle
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="ikpd-dash-termine-list">
            {upcomingTermine.length === 0 ? (
              <div className="ikpd-dash-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.25 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Keine anstehenden Termine</span>
              </div>
            ) : (
              upcomingTermine.map((t) => {
                const date = new Date(t.datum);
                const isToday = date.toDateString() === now.toDateString();
                const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                return (
                  <div key={t._id} className={`ikpd-dash-termin ${isToday ? 'today' : ''}`}>
                    <div className="ikpd-dash-termin-date">
                      <span className="ikpd-dash-termin-day">{date.getDate()}</span>
                      <span className="ikpd-dash-termin-month">{monate[date.getMonth()]}</span>
                    </div>
                    <div className="ikpd-dash-termin-body">
                      <span className="ikpd-dash-termin-name">{t.klientName}</span>
                      <span className="ikpd-dash-termin-time">
                        {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr &middot; {t.dauer} Min
                        {isToday && <Badge bg="primary" className="ms-2">Heute</Badge>}
                        {isTomorrow && <Badge bg="info" className="ms-2">Morgen</Badge>}
                      </span>
                    </div>
                    <div className="ikpd-dash-termin-status">
                      {t.status === 'geplant' && <span className="ikpd-dash-dot dot-planned" />}
                      {t.status === 'abgeschlossen' && <span className="ikpd-dash-dot dot-done" />}
                      {t.status === 'abgesagt' && <span className="ikpd-dash-dot dot-cancelled" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Latest Rechnungen */}
        <div className="ikpd-dash-card ikpd-dash-rechnungen-card">
          <div className="ikpd-dash-card-header">
            <div className="ikpd-dash-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
              Letzte Rechnungen
            </div>
            <button className="ikpd-dash-card-link" onClick={() => navigate('/rechnungen')}>
              Alle
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="ikpd-dash-rechnungen-list">
            {rechnungen.length === 0 ? (
              <div className="ikpd-dash-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.25 }}>
                  <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z"/><path d="M8 10h8"/><path d="M8 14h4"/>
                </svg>
                <span>Keine Rechnungen vorhanden</span>
              </div>
            ) : (
              rechnungen.slice(0, 5).map((r) => (
                <div key={r._id} className="ikpd-dash-rechnung" role="button" onClick={() => navigate('/rechnungen')}>
                  <div className="ikpd-dash-rechnung-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="ikpd-dash-rechnung-body">
                    <span className="ikpd-dash-rechnung-nr">{r.rechnungsnummer}</span>
                    <span className="ikpd-dash-rechnung-client">{r.klientName}</span>
                  </div>
                  <div className="ikpd-dash-rechnung-amount">{fmtCurrency(r.gesamtBetrag)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
