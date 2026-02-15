import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { validateResetToken, executePasswordReset } from '../services/api';
import logo from '../logo-ikpd.png';

export default function PasswortResetPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    validateResetToken(token)
      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);
    try {
      await executePasswordReset(token!, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="ikpd-login-wrapper">
        <div className="ikpd-login-card text-center">
          <div className="spinner-border" role="status" />
          <div className="mt-3 text-muted">Link wird überprüft...</div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="ikpd-login-wrapper">
        <div className="ikpd-login-card text-center">
          <img src={logo} alt="IKPD Logo" className="ikpd-login-logo" />
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#f8d7da',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="ikpd-login-title" style={{ fontSize: '18px' }}>Link ungültig oder abgelaufen</h1>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: 24 }}>
            Bitte fordern Sie einen neuen Link an.
          </p>
          <Link to="/passwort-vergessen" className="btn btn-primary w-100 ikpd-login-btn">
            Neuen Link anfordern
          </Link>
          <div className="ikpd-login-footer">IKPD Praxisverwaltung</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ikpd-login-wrapper">
      <div className="ikpd-login-card">
        <div className="text-center">
          <img src={logo} alt="IKPD Logo" className="ikpd-login-logo" />
          <h1 className="ikpd-login-title">Neues Passwort setzen</h1>
          <p className="ikpd-login-subtitle">Geben Sie Ihr neues Passwort ein.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#d4edda',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontSize: '15px', color: '#333', marginBottom: 24 }}>
              Ihr Passwort wurde erfolgreich geändert.
            </p>
            <Link to="/login" className="btn btn-primary w-100 ikpd-login-btn">
              Zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Neues Passwort</label>
              <div className="ikpd-input-with-icon">
                <svg className="ikpd-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  className="form-control ikpd-login-input"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="passwordConfirm" className="form-label">Passwort bestätigen</label>
              <div className="ikpd-input-with-icon">
                <svg className="ikpd-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="passwordConfirm"
                  type="password"
                  className="form-control ikpd-login-input"
                  placeholder="Passwort wiederholen"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <div className="alert alert-danger py-2 mb-3" role="alert">{error}</div>
            )}
            <button type="submit" className="btn btn-primary w-100 ikpd-login-btn" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : 'Passwort speichern'}
            </button>
          </form>
        )}

        <div className="ikpd-login-footer">IKPD Praxisverwaltung</div>
      </div>
    </div>
  );
}
