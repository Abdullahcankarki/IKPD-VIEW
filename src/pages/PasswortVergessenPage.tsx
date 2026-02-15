import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import logo from '../logo-ikpd.png';

export default function PasswortVergessenPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ikpd-login-wrapper">
      <div className="ikpd-login-card">
        <div className="text-center">
          <img src={logo} alt="IKPD Logo" className="ikpd-login-logo" />
          <h1 className="ikpd-login-title">Passwort vergessen</h1>
          <p className="ikpd-login-subtitle">
            Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#d4edda',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontSize: '15px', color: '#333', marginBottom: 8 }}>
              Falls ein Konto mit <strong>{email}</strong> existiert, wurde ein Link zum Zurücksetzen gesendet.
            </p>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Bitte prüfen Sie Ihren Posteingang (und ggf. den Spam-Ordner).
            </p>
            <Link to="/login" className="btn btn-primary w-100 ikpd-login-btn mt-3">
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">E-Mail-Adresse</label>
              <div className="ikpd-input-with-icon">
                <svg className="ikpd-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="email"
                  type="email"
                  className="form-control ikpd-login-input"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <div className="alert alert-danger py-2 mb-3" role="alert">{error}</div>
            )}
            <button type="submit" className="btn btn-primary w-100 ikpd-login-btn" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : 'Link senden'}
            </button>
            <div className="text-center mt-3">
              <Link to="/login" style={{ fontSize: '14px', color: '#666' }}>
                Zurück zum Login
              </Link>
            </div>
          </form>
        )}

        <div className="ikpd-login-footer">IKPD Praxisverwaltung</div>
      </div>
    </div>
  );
}
