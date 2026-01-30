import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Row, Col, Card, Spinner, Table, Badge } from 'react-bootstrap';
import { fetchMeineTermine, fetchAlleKlienten, fetchAlleRechnungen } from '../services/api';
import { TerminResource, KlientResource, RechnungResource } from '../Resources';
import { useNavigate } from 'react-router-dom';

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
  const upcomingTermine = termine
    .filter((t) => new Date(t.datum) >= now && t.status === 'geplant')
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
    .slice(0, 5);

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const termineThisMonth = termine.filter((t) => {
    const d = new Date(t.datum);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const completedThisMonth = termineThisMonth.filter((t) => t.status === 'abgeschlossen').length;
  const plannedThisMonth = termineThisMonth.filter((t) => t.status === 'geplant').length;
  const cancelledThisMonth = termineThisMonth.filter((t) => t.status === 'abgesagt').length;

  const revenueThisMonth = rechnungen
    .filter((r) => r.monat === currentMonth && r.jahr === currentYear)
    .reduce((sum, r) => sum + (r.gesamtBetrag || 0), 0);

  const revenueTotal = rechnungen
    .reduce((sum, r) => sum + (r.gesamtBetrag || 0), 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'geplant': return <Badge bg="primary">Geplant</Badge>;
      case 'abgeschlossen': return <Badge bg="success">Abgeschlossen</Badge>;
      case 'abgesagt': return <Badge bg="danger">Abgesagt</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

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
      <div className="ikpd-page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="ikpd-page-subtitle">
            Willkommen zurück, {user?.rolle === 'admin' ? 'Administrator' : 'Therapeut'}
          </p>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="ikpd-stat-card stat-klienten h-100" role="button" onClick={() => navigate('/klienten')}>
            <Card.Body className="d-flex align-items-center gap-3 py-3 px-3">
              <div className="ikpd-stat-icon" style={{ background: 'var(--ikpd-primary-50)', color: 'var(--ikpd-primary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div className="ikpd-stat-label">Klienten</div>
                <div className="ikpd-stat-value">{klienten.length}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="ikpd-stat-card stat-termine h-100" role="button" onClick={() => navigate('/kalender')}>
            <Card.Body className="d-flex align-items-center gap-3 py-3 px-3">
              <div className="ikpd-stat-icon" style={{ background: 'var(--ikpd-info-bg)', color: 'var(--ikpd-info)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <div className="ikpd-stat-label">Termine (Monat)</div>
                <div className="ikpd-stat-value">{termineThisMonth.length}</div>
                <div className="ikpd-stat-detail">
                  {completedThisMonth} erledigt · {plannedThisMonth} geplant · {cancelledThisMonth} abgesagt
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="ikpd-stat-card stat-rechnungen h-100" role="button" onClick={() => navigate('/rechnungen')}>
            <Card.Body className="d-flex align-items-center gap-3 py-3 px-3">
              <div className="ikpd-stat-icon" style={{ background: 'var(--ikpd-success-bg)', color: 'var(--ikpd-success)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
              </div>
              <div>
                <div className="ikpd-stat-label">Rechnungen</div>
                <div className="ikpd-stat-value">{rechnungen.length}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="ikpd-stat-card stat-umsatz h-100">
            <Card.Body className="d-flex align-items-center gap-3 py-3 px-3">
              <div className="ikpd-stat-icon" style={{ background: 'var(--ikpd-warning-bg)', color: 'var(--ikpd-warning)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <div className="ikpd-stat-label">Umsatz (Gesamt)</div>
                <div className="ikpd-stat-value">{revenueTotal.toFixed(2)} €</div>
                {revenueThisMonth > 0 && (
                  <div className="ikpd-stat-detail">
                    Dieser Monat: {revenueThisMonth.toFixed(2)} €
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <Card className="h-100">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span>Nächste Termine</span>
              <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/kalender')}>
                Alle anzeigen
              </button>
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingTermine.length === 0 ? (
                <div className="ikpd-empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <p>Keine anstehenden Termine</p>
                </div>
              ) : (
                <Table className="mb-0 align-middle" hover>
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Uhrzeit</th>
                      <th>Klient</th>
                      <th>Dauer</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingTermine.map((t) => {
                      const date = new Date(t.datum);
                      return (
                        <tr key={t._id}>
                          <td>{date.toLocaleDateString('de-DE')}</td>
                          <td>{date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="fw-medium">{t.klientName}</td>
                          <td>{t.dauer} Min</td>
                          <td>{statusBadge(t.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="h-100">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span>Letzte Rechnungen</span>
              <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/rechnungen')}>
                Alle anzeigen
              </button>
            </Card.Header>
            <Card.Body className="p-0">
              {rechnungen.length === 0 ? (
                <div className="ikpd-empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                    <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z"/><path d="M8 10h8"/><path d="M8 14h4"/>
                  </svg>
                  <p>Keine Rechnungen vorhanden</p>
                </div>
              ) : (
                <Table className="mb-0 align-middle" hover>
                  <thead>
                    <tr>
                      <th>Nr.</th>
                      <th>Klient</th>
                      <th className="text-end">Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechnungen.slice(0, 5).map((r) => (
                      <tr key={r._id} role="button" onClick={() => navigate('/rechnungen')}>
                        <td className="text-muted">{r.rechnungsnummer}</td>
                        <td className="fw-medium">{r.klientName}</td>
                        <td className="text-end fw-semibold">{r.gesamtBetrag?.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
