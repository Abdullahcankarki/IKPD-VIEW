import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { StornoInfo } from '../Resources';
import { fetchStornoInfo, executeStorno } from '../services/api';

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function formatDatum(dateStr: string): string {
  const d = new Date(dateStr);
  return `${WOCHENTAGE[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDauer(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h} Std. ${m} Min.`;
  if (h > 0) return `${h} Std.`;
  return `${m} Min.`;
}

export default function TerminStornoPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<StornoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storniert, setStorniert] = useState(false);
  const [stornoLoading, setStornoLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchStornoInfo(token)
      .then(setInfo)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleStorno = async () => {
    if (!token || stornoLoading) return;
    setStornoLoading(true);
    try {
      await executeStorno(token);
      setStorniert(true);
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStornoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ikpd-storno-page">
        <div className="ikpd-storno-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Spinner animation="border" />
            <div className="mt-3" style={{ color: '#666' }}>Laden...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="ikpd-storno-page">
        <div className="ikpd-storno-card">
          <div className="ikpd-storno-status ikpd-storno-status--error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h2>Termin nicht gefunden</h2>
            <p>Der Stornierungslink ist ungültig oder abgelaufen.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="ikpd-storno-page">
      <div className="ikpd-storno-card">
        {/* Header */}
        <div className="ikpd-storno-header">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <h1>Terminstornierung</h1>
            <p>{info.praxisName}</p>
          </div>
        </div>

        {/* Termin-Details */}
        <div className="ikpd-storno-details">
          <div className="ikpd-storno-detail-row">
            <span className="ikpd-storno-label">Datum</span>
            <span className="ikpd-storno-value">{formatDatum(info.terminDatum)}</span>
          </div>
          <div className="ikpd-storno-detail-row">
            <span className="ikpd-storno-label">Uhrzeit</span>
            <span className="ikpd-storno-value">{info.terminZeit} Uhr</span>
          </div>
          <div className="ikpd-storno-detail-row">
            <span className="ikpd-storno-label">Dauer</span>
            <span className="ikpd-storno-value">{formatDauer(info.dauer)}</span>
          </div>
          <div className="ikpd-storno-detail-row">
            <span className="ikpd-storno-label">Therapeut</span>
            <span className="ikpd-storno-value">{info.therapeutName}</span>
          </div>
          <div className="ikpd-storno-detail-row">
            <span className="ikpd-storno-label">Praxis</span>
            <span className="ikpd-storno-value">
              {info.praxisName}
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginTop: '2px' }}>
                {info.praxisAdresse}
              </span>
            </span>
          </div>
        </div>

        {/* Status / Aktionen */}
        {storniert ? (
          <div className="ikpd-storno-status ikpd-storno-status--success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h2>Termin storniert</h2>
            <p>Ihr Termin wurde erfolgreich storniert. Ihr Therapeut wurde benachrichtigt.</p>
          </div>
        ) : info.bereitsStorniert ? (
          <div className="ikpd-storno-status ikpd-storno-status--info">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <h2>Bereits storniert</h2>
            <p>Dieser Termin wurde bereits storniert.</p>
          </div>
        ) : !info.kannStorniert ? (
          <div className="ikpd-storno-status ikpd-storno-status--warning">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h2>Stornierung nicht mehr möglich</h2>
            <p>Eine Stornierung ist nur bis 48 Stunden vor dem Termin möglich.</p>
          </div>
        ) : (
          <div className="ikpd-storno-actions">
            {!showConfirm ? (
              <button
                className="ikpd-storno-btn ikpd-storno-btn--danger"
                onClick={() => setShowConfirm(true)}
              >
                Termin stornieren
              </button>
            ) : (
              <div className="ikpd-storno-confirm">
                <p>Möchten Sie diesen Termin wirklich stornieren?</p>
                {error && <div className="ikpd-storno-error">{error}</div>}
                <div className="ikpd-storno-confirm-btns">
                  <button
                    className="ikpd-storno-btn ikpd-storno-btn--light"
                    onClick={() => setShowConfirm(false)}
                    disabled={stornoLoading}
                  >
                    Abbrechen
                  </button>
                  <button
                    className="ikpd-storno-btn ikpd-storno-btn--danger"
                    onClick={handleStorno}
                    disabled={stornoLoading}
                  >
                    {stornoLoading ? <Spinner animation="border" size="sm" /> : 'Ja, stornieren'}
                  </button>
                </div>
              </div>
            )}
            <p className="ikpd-storno-hint">
              Stornierung ist bis 48 Stunden vor dem Termin möglich.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
