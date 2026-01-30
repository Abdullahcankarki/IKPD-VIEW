import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Toast,
  Badge,
} from "react-bootstrap";
import {
  fetchAlleRechnungen,
  createRechnung,
  deleteRechnung,
  getRechnungPdfUrl,
  fetchAlleKlienten,
} from "../services/api";
import { RechnungResource, KlientResource } from "../Resources";

type ToastType = { show: boolean; message: string; variant: "success" | "danger" | "info" };

const RechnungenPage: React.FC = () => {
  const [rechnungen, setRechnungen] = useState<RechnungResource[]>([]);
  const [klienten, setKlienten] = useState<KlientResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    monat: new Date().getMonth() + 1,
    jahr: new Date().getFullYear(),
    klientId: "",
    artDerMassnahme: "",
    umsatzsteuer: 0 as 0 | 7 | 19,
    rechnungsnummer: "",
  });
  const [validated, setValidated] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RechnungResource | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRechnung, setDetailRechnung] = useState<RechnungResource | null>(null);

  const [toast, setToast] = useState<ToastType>({ show: false, message: "", variant: "success" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rechnungenData, klientenData] = await Promise.all([
        fetchAlleRechnungen(),
        fetchAlleKlienten(),
      ]);
      setRechnungen(rechnungenData);
      setKlienten(klientenData);
    } catch {
      showToast("Fehler beim Laden der Daten.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, variant: ToastType["variant"] = "success") => {
    setToast({ show: true, message, variant });
  };

  const handleCreate = () => {
    setFormData({
      monat: new Date().getMonth() + 1,
      jahr: new Date().getFullYear(),
      klientId: "",
      artDerMassnahme: "",
      umsatzsteuer: 0,
      rechnungsnummer: "",
    });
    setValidated(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
    if (!formData.klientId || !formData.artDerMassnahme) return;

    setSaving(true);
    try {
      await createRechnung({
        monat: formData.monat,
        jahr: formData.jahr,
        klientId: formData.klientId,
        artDerMassnahme: formData.artDerMassnahme,
        umsatzsteuer: formData.umsatzsteuer,
        rechnungsnummer: formData.rechnungsnummer || undefined,
      });
      showToast("Rechnung erfolgreich erstellt.", "success");
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Fehler beim Erstellen der Rechnung.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (rechnung: RechnungResource) => {
    setDeleteTarget(rechnung);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRechnung(deleteTarget._id);
      showToast("Rechnung gelöscht.", "success");
      loadData();
    } catch {
      showToast("Fehler beim Löschen.", "danger");
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleDownloadPdf = (rechnung: RechnungResource) => {
    const url = getRechnungPdfUrl(rechnung._id);
    const token = localStorage.getItem("token");
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("PDF konnte nicht geladen werden");
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `Rechnung-${rechnung.rechnungsnummer}.pdf`;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => showToast("Fehler beim PDF-Download.", "danger"));
  };

  const handleShowDetail = (rechnung: RechnungResource) => {
    setDetailRechnung(rechnung);
    setShowDetailModal(true);
  };

  const filteredRechnungen = useMemo(() => {
    let data = rechnungen.filter((r) =>
      [r.rechnungsnummer, r.klientName, r.artDerMassnahme, r.auftraggeberName || ""]
        .some((field) => field.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortConfig) {
      data = [...data].sort((a: any, b: any) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [rechnungen, search, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const monate = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];

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
        <h2>Rechnungen</h2>
        <div className="ikpd-page-actions">
          <Form.Control
            type="text"
            className="ikpd-search-input"
            placeholder="Suche nach Nr., Klient, Maßnahme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="primary" onClick={handleCreate} title="Neue Rechnung">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="ikpd-loading">
          <Spinner animation="border" role="status" />
          <div className="mt-2 text-muted">Rechnungen werden geladen...</div>
        </div>
      ) : (
        <>
          {filteredRechnungen.length > 0 && (
            <div className="ikpd-list-count mb-2">{filteredRechnungen.length} Rechnungen</div>
          )}

          {filteredRechnungen.length === 0 ? (
            <div className="ikpd-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <p>Keine Rechnungen gefunden</p>
            </div>
          ) : (
            <div className="ikpd-list">
              {filteredRechnungen.map((r) => {
                const isExpanded = expandedId === r._id;
                return (
                  <div key={r._id} className={`ikpd-list-item${isExpanded ? ' expanded' : ''}`}>
                    <div className="ikpd-list-item-row" onClick={() => setExpandedId(isExpanded ? null : r._id)}>
                      <div className="ikpd-list-item-avatar amber">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="ikpd-list-item-content">
                        <div className="ikpd-list-item-primary">
                          <span className="ikpd-list-item-name">{r.rechnungsnummer}</span>
                          <span className="ikpd-list-item-name" style={{ fontWeight: 500 }}>{r.klientName}</span>
                          <span className="ikpd-amount">{r.gesamtBetrag?.toFixed(2)} €</span>
                        </div>
                        <div className="ikpd-list-item-secondary">
                          <span className="ikpd-list-item-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {monate[(r.monat || 1) - 1]} {r.jahr}
                          </span>
                          <span className="ikpd-list-item-meta">{r.artDerMassnahme}</span>
                          <Badge bg={r.empfaenger === "auftraggeber" ? "info" : "secondary"} className="ms-1">
                            {r.empfaenger === "auftraggeber" ? r.auftraggeberName : "Klient"}
                          </Badge>
                        </div>
                      </div>
                      <div className="ikpd-list-item-actions" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline-primary" size="sm" onClick={() => handleShowDetail(r)} title="Details">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Button>
                        <Button variant="outline-success" size="sm" onClick={() => handleDownloadPdf(r)} title="PDF herunterladen">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(r)} title="Löschen">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </Button>
                      </div>
                      <button className="ikpd-list-item-expand" aria-label="Details anzeigen">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    </div>
                    <div className="ikpd-list-item-details">
                      <div className="ikpd-list-item-details-inner">
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Rechnungsdatum</span>
                          <span className="ikpd-detail-value">{r.rechnungsdatum?.slice(0, 10) || '–'}</span>
                        </div>
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Umsatzsteuer</span>
                          <span className="ikpd-detail-value">{r.umsatzsteuer}%</span>
                        </div>
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Praxis</span>
                          <span className="ikpd-detail-value">{r.praxisInfo?.name || '–'}</span>
                        </div>
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Gesamtstunden</span>
                          <span className="ikpd-detail-value">{r.gesamtStunden || '–'}</span>
                        </div>
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Stundensatz</span>
                          <span className="ikpd-detail-value">{r.stundensatz ? `${r.stundensatz} €` : '–'}</span>
                        </div>
                        <div className="ikpd-detail-field">
                          <span className="ikpd-detail-label">Empfänger</span>
                          <span className="ikpd-detail-value">{r.empfaenger === "auftraggeber" ? r.auftraggeberName : "Klient"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Neue Rechnung erstellen</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="gy-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Klient</Form.Label>
                  <Form.Select
                    required
                    value={formData.klientId}
                    onChange={(e) => setFormData({ ...formData, klientId: e.target.value })}
                  >
                    <option value="">Klient auswählen...</option>
                    {klienten.map((k) => (
                      <option key={k._id} value={k._id}>{k.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">Bitte Klient auswählen.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Art der Maßnahme</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="z.B. Einzeltherapie"
                    value={formData.artDerMassnahme}
                    onChange={(e) => setFormData({ ...formData, artDerMassnahme: e.target.value })}
                  />
                  <Form.Control.Feedback type="invalid">Art der Maßnahme ist erforderlich.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Rechnungsnummer (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Wird automatisch generiert"
                    value={formData.rechnungsnummer}
                    onChange={(e) => setFormData({ ...formData, rechnungsnummer: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Monat</Form.Label>
                  <Form.Select
                    value={formData.monat}
                    onChange={(e) => setFormData({ ...formData, monat: Number(e.target.value) })}
                  >
                    {monate.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Jahr</Form.Label>
                  <Form.Control
                    type="number"
                    min={2020}
                    max={2030}
                    value={formData.jahr}
                    onChange={(e) => setFormData({ ...formData, jahr: Number(e.target.value) })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Umsatzsteuer</Form.Label>
                  <Form.Select
                    value={formData.umsatzsteuer}
                    onChange={(e) => setFormData({ ...formData, umsatzsteuer: Number(e.target.value) as 0 | 7 | 19 })}
                  >
                    <option value={0}>0%</option>
                    <option value={7}>7%</option>
                    <option value={19}>19%</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} title="Abbrechen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </Button>
            <Button variant="primary" type="submit" disabled={saving} title="Erstellen">
              {saving ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton className="ikpd-invoice-header">
          <Modal.Title className="d-flex align-items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            {detailRechnung?.rechnungsnummer}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ikpd-invoice-body">
          {detailRechnung && (
            <>
              <div className="ikpd-invoice-meta">
                <div className="ikpd-invoice-meta-block">
                  <div className="ikpd-invoice-meta-title">Klient</div>
                  <div className="ikpd-invoice-meta-value">{detailRechnung.klientName}</div>
                  <div className="ikpd-invoice-meta-sub">
                    Geb. {detailRechnung.geburtsdatum ? new Date(detailRechnung.geburtsdatum).toLocaleDateString("de-DE") : '–'}
                  </div>
                </div>
                <div className="ikpd-invoice-meta-block">
                  <div className="ikpd-invoice-meta-title">Empfänger</div>
                  <div className="ikpd-invoice-meta-value">
                    {detailRechnung.empfaenger === "auftraggeber" ? detailRechnung.auftraggeberName : "Klient (Selbstzahler)"}
                  </div>
                  <div className="ikpd-invoice-meta-sub">{detailRechnung.artDerMassnahme}</div>
                </div>
                <div className="ikpd-invoice-meta-block">
                  <div className="ikpd-invoice-meta-title">Zeitraum</div>
                  <div className="ikpd-invoice-meta-value">{monate[(detailRechnung.monat || 1) - 1]} {detailRechnung.jahr}</div>
                  <div className="ikpd-invoice-meta-sub">
                    Erstellt: {detailRechnung.rechnungsdatum ? new Date(detailRechnung.rechnungsdatum).toLocaleDateString("de-DE") : '–'}
                  </div>
                </div>
                <div className="ikpd-invoice-meta-block">
                  <div className="ikpd-invoice-meta-title">Praxis</div>
                  <div className="ikpd-invoice-meta-value">{detailRechnung.praxisInfo?.name || '–'}</div>
                  <div className="ikpd-invoice-meta-sub">{detailRechnung.praxisInfo?.adresse || ''}</div>
                </div>
              </div>

              <div className="ikpd-invoice-section">
                <div className="ikpd-invoice-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Leistungen ({detailRechnung.termine?.length || 0} Termine)
                </div>
                <div className="ikpd-invoice-table">
                  <div className="ikpd-invoice-table-header">
                    <span className="ikpd-invoice-col-date">Datum</span>
                    <span className="ikpd-invoice-col-dur">Dauer</span>
                    <span className="ikpd-invoice-col-desc">Beschreibung</span>
                    <span className="ikpd-invoice-col-ther">Therapeut</span>
                  </div>
                  {detailRechnung.termine?.map((t, i) => (
                    <div key={i} className="ikpd-invoice-table-row">
                      <span className="ikpd-invoice-col-date">{new Date(t.datum).toLocaleDateString("de-DE")}</span>
                      <span className="ikpd-invoice-col-dur">
                        <Badge bg="light" text="dark" className="fw-normal">{t.dauer} Min</Badge>
                      </span>
                      <span className="ikpd-invoice-col-desc">{t.beschreibung || "–"}</span>
                      <span className="ikpd-invoice-col-ther">{t.therapeutName}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ikpd-invoice-summary">
                <div className="ikpd-invoice-summary-row">
                  <span>Gesamtstunden</span>
                  <span>{detailRechnung.gesamtStunden}h</span>
                </div>
                <div className="ikpd-invoice-summary-row">
                  <span>Stundensatz</span>
                  <span>{detailRechnung.stundensatz} €</span>
                </div>
                <div className="ikpd-invoice-summary-row">
                  <span>Umsatzsteuer</span>
                  <span>{detailRechnung.umsatzsteuer}%</span>
                </div>
                <div className="ikpd-invoice-summary-total">
                  <span>Gesamtbetrag</span>
                  <span>{detailRechnung.gesamtBetrag?.toFixed(2)} €</span>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {detailRechnung && (
            <Button variant="success" onClick={() => handleDownloadPdf(detailRechnung)} title="PDF herunterladen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowDetailModal(false)} title="Schließen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Möchten Sie die Rechnung <strong>{deleteTarget?.rechnungsnummer}</strong> wirklich löschen?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} title="Abbrechen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirmed} title="Löschen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RechnungenPage;
