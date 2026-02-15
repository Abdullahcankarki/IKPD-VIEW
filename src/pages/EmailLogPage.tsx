import React, { useEffect, useState, useMemo } from "react";
import { Spinner, Form, Badge, Toast } from "react-bootstrap";
import { fetchEmailLogs } from "../services/api";
import { EmailLogResource } from "../Resources";

type ToastType = { show: boolean; message: string; variant: "success" | "danger" };

const EmailLogPage: React.FC = () => {
  const [logs, setLogs] = useState<EmailLogResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTyp, setFilterTyp] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("alle");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastType>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchEmailLogs();
      setLogs(data);
    } catch {
      setToast({ show: true, message: "Fehler beim Laden der E-Mail-Logs.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        [log.empfaenger, log.betreff, log.klientName || "", log.therapeutName || ""]
          .some((f) => f.toLowerCase().includes(search.toLowerCase()));
      const matchesTyp = filterTyp === "alle" || log.typ === filterTyp;
      const matchesStatus = filterStatus === "alle" || log.status === filterStatus;
      return matchesSearch && matchesTyp && matchesStatus;
    });
  }, [logs, search, filterTyp, filterStatus]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "gesendet":
        return <Badge bg="success">Gesendet</Badge>;
      case "fehlgeschlagen":
        return <Badge bg="danger">Fehlgeschlagen</Badge>;
      case "eingereiht":
        return <Badge bg="warning" text="dark">Eingereiht</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const typLabel = (typ: string) => {
    switch (typ) {
      case "terminBestaetigung":
        return "Terminbestätigung";
      case "stornoNotification":
        return "Storno-Benachrichtigung";
      case "passwortReset":
        return "Passwort-Reset";
      case "rechnung":
        return "Rechnung";
      default:
        return typ;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="ikpd-page">
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "fixed", bottom: 0, right: 0, minHeight: "100px", zIndex: 1060 }}
      >
        <Toast
          show={toast.show}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
          bg={toast.variant}
          delay={3000}
          autohide
          className="mb-3 me-3"
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </div>

      <div className="ikpd-page-header">
        <h2>E-Mail-Protokoll</h2>
        <div className="ikpd-page-actions">
          <Form.Control
            type="text"
            className="ikpd-search-input"
            placeholder="Suche nach Empfänger, Betreff, Klient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Form.Select
          size="sm"
          style={{ width: "auto" }}
          value={filterTyp}
          onChange={(e) => setFilterTyp(e.target.value)}
        >
          <option value="alle">Alle Typen</option>
          <option value="terminBestaetigung">Terminbestätigung</option>
          <option value="stornoNotification">Storno-Benachrichtigung</option>
          <option value="passwortReset">Passwort-Reset</option>
          <option value="rechnung">Rechnung</option>
        </Form.Select>
        <Form.Select
          size="sm"
          style={{ width: "auto" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="alle">Alle Status</option>
          <option value="gesendet">Gesendet</option>
          <option value="fehlgeschlagen">Fehlgeschlagen</option>
          <option value="eingereiht">Eingereiht</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="ikpd-loading">
          <Spinner animation="border" role="status" />
          <div className="mt-2 text-muted">E-Mail-Logs werden geladen...</div>
        </div>
      ) : (
        <>
          {filteredLogs.length > 0 && (
            <div className="ikpd-list-count mb-2">{filteredLogs.length} E-Mails</div>
          )}

          {filteredLogs.length === 0 ? (
            <div className="ikpd-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <p>Keine E-Mail-Logs gefunden</p>
            </div>
          ) : (
            <div className="ikpd-list">
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log._id;
                return (
                  <div key={log._id} className={`ikpd-list-item${isExpanded ? " expanded" : ""}`}>
                    <div
                      className="ikpd-list-item-row"
                      onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    >
                      <div className={`ikpd-list-item-avatar ${log.status === "gesendet" ? "green" : log.status === "fehlgeschlagen" ? "red" : "amber"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <div className="ikpd-list-item-content">
                        <div className="ikpd-list-item-primary">
                          <span className="ikpd-list-item-name">{log.empfaenger}</span>
                          {statusBadge(log.status)}
                        </div>
                        <div className="ikpd-list-item-secondary">
                          <span className="ikpd-list-item-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatDate(log.createdAt)}
                          </span>
                          <Badge bg="light" text="dark" className="fw-normal">
                            {typLabel(log.typ)}
                          </Badge>
                          {log.klientName && (
                            <span className="ikpd-list-item-meta">{log.klientName}</span>
                          )}
                        </div>
                      </div>
                      <button className="ikpd-list-item-expand" aria-label="Details anzeigen">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                    <div className="ikpd-list-item-details">
                      <div className="ikpd-list-item-details-inner">
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Betreff</span>
                          <span className="ikpd-detail-value">{log.betreff}</span>
                        </div>
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Typ</span>
                          <span className="ikpd-detail-value">{typLabel(log.typ)}</span>
                        </div>
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Empfänger</span>
                          <span className="ikpd-detail-value">{log.empfaenger}</span>
                        </div>
                        {log.klientName && (
                          <div className="ikpd-detail-field">
                            <span className="ikpd-detail-label">Klient</span>
                            <span className="ikpd-detail-value">{log.klientName}</span>
                          </div>
                        )}
                        {log.therapeutName && (
                          <div className="ikpd-detail-field">
                            <span className="ikpd-detail-label">Therapeut</span>
                            <span className="ikpd-detail-value">{log.therapeutName}</span>
                          </div>
                        )}
                        {log.gesendetAm && (
                          <div className="ikpd-detail-field">
                            <span className="ikpd-detail-label">Gesendet am</span>
                            <span className="ikpd-detail-value">{formatDate(log.gesendetAm)}</span>
                          </div>
                        )}
                        {log.fehler && (
                          <div className="ikpd-detail-field">
                            <span className="ikpd-detail-label">Fehler</span>
                            <span className="ikpd-detail-value" style={{ color: "#dc3545" }}>{log.fehler}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailLogPage;
