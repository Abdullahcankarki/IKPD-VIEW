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
  fetchAlleKlienten,
  createKlient,
  updateKlient,
  deleteKlient,
  fetchAllePraxen,
  fetchAlleAuftraggeber,
  fetchAlleTherapeuten,
} from "../services/api";
import { KlientResource, PraxisResource, AuftraggeberResource, TherapeutResource } from "../Resources";

type ToastType = { show: boolean; message: string; variant: "success" | "danger" | "info" };

const emptyKlient: KlientResource = {
  _id: "",
  name: "",
  geburtsdatum: "",
  adresse: "",
  email: "",
  telefonnummer: "",
  kontaktperson: {},
  auftraggeberNamen: [],
  praxisId: "",
  therapeutId: "",
};

const initialKontaktperson = { name: "", email: "" };

const KlientenPage = () => {
  const [klienten, setKlienten] = useState<KlientResource[]>([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<KlientResource>({ ...emptyKlient });
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KlientResource | null>(null);
  const [toast, setToast] = useState<ToastType>({ show: false, message: "", variant: "success" });
  const [validated, setValidated] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [praxen, setPraxen] = useState<PraxisResource[]>([]);
  const [auftraggeber, setAuftraggeber] = useState<AuftraggeberResource[]>([]);
  const [therapeuten, setTherapeuten] = useState<TherapeutResource[]>([]);

  useEffect(() => {
    loadKlienten();
    loadPraxen();
    loadAuftraggeber();
    loadTherapeuten();
  }, []);

  const loadKlienten = async () => {
    try {
      const data = await fetchAlleKlienten();
      setKlienten(data);
    } catch {
      showToast("Fehler beim Laden der Klienten.", "danger");
    }
  };

  const loadPraxen = async () => {
    try { setPraxen(await fetchAllePraxen()); } catch { /* ignore */ }
  };
  const loadAuftraggeber = async () => {
    try { setAuftraggeber(await fetchAlleAuftraggeber()); } catch { /* ignore */ }
  };
  const loadTherapeuten = async () => {
    try { setTherapeuten(await fetchAlleTherapeuten()); } catch { /* ignore */ }
  };

  const getPraxisName = (id: string) => praxen.find(p => p._id === id)?.name || '–';
  const getAuftraggeberName = (id: string) => auftraggeber.find(a => a._id === id)?.name || id;
  const getTherapeutName = (id: string) => {
    const t = therapeuten.find(t => t._id === id);
    return t ? `${t.vorname} ${t.nachname}` : '–';
  };

  // Filtering and sorting
  const filteredKlienten = useMemo(() => {
    let data = klienten.filter((k) =>
      k.name?.toLowerCase().includes(search.toLowerCase())
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
  }, [klienten, search, sortConfig]);

  const openModal = (klient?: KlientResource) => {
    if (klient) {
      setSelected({
        ...klient,
        kontaktperson: klient.kontaktperson || { ...initialKontaktperson },
      });
      setEditMode(true);
    } else {
      setSelected({ ...emptyKlient, kontaktperson: { ...initialKontaktperson } });
      setEditMode(false);
    }
    setValidated(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setValidated(false);
  };

  const showToast = (msg: string, variant: ToastType["variant"] = "success") => {
    setToast({ show: true, message: msg, variant });
  };

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
    if (!validateSelected(selected)) {
      showToast("Bitte alle Pflichtfelder korrekt ausfüllen.", "danger");
      return;
    }
    setSaving(true);
    try {
      if (editMode) {
        await updateKlient(selected, selected._id);
        showToast("Klient erfolgreich aktualisiert.", "success");
      } else {
        await createKlient(selected);
        showToast("Klient erfolgreich angelegt.", "success");
      }
      setShowModal(false);
      setValidated(false);
      loadKlienten();
    } catch {
      showToast("Fehler beim Speichern.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (klient: KlientResource) => {
    setDeleteTarget(klient);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await deleteKlient(deleteTarget._id);
      showToast("Klient gelöscht.", "success");
      loadKlienten();
    } catch {
      showToast("Fehler beim Löschen.", "danger");
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleChange = (field: keyof KlientResource, value: any) => {
    setSelected((prev) => ({ ...prev, [field]: value }));
  };

  const handleKontaktChange = (field: string, value: any) => {
    setSelected((prev) => ({
      ...prev,
      kontaktperson: { ...(prev.kontaktperson || {}), [field]: value },
    }));
  };

  // Validation
  function validateSelected(k: KlientResource) {
    if (!k.name || !k.geburtsdatum || !k.adresse || !k.email || !k.telefonnummer) return false;
    if (!/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(k.email)) return false;
    return true;
  }

  // Fields for table and sorting
  const tableFields: { key: keyof KlientResource; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "geburtsdatum", label: "Geburtsdatum" },
    { key: "adresse", label: "Adresse" },
    { key: "email", label: "E-Mail" },
    { key: "telefonnummer", label: "Telefonnummer" },
    { key: "praxisId", label: "Praxis" },
  ];

  return (
    <div className="ikpd-page">
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          minHeight: "100px",
          zIndex: 1060,
        }}
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
        <h2>Klientenverwaltung</h2>
        <div className="ikpd-page-actions">
          <Form.Control
            type="text"
            className="ikpd-search-input"
            placeholder="Nach Namen suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Klient suchen"
          />
          <Button variant="primary" onClick={() => openModal()} title="Neuer Klient">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </Button>
        </div>
      </div>
      {filteredKlienten.length > 0 && (
        <div className="ikpd-list-count mb-2">{filteredKlienten.length} Klienten</div>
      )}

      {filteredKlienten.length === 0 ? (
        <div className="ikpd-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          <p>Keine Klienten gefunden</p>
        </div>
      ) : (
        <div className="ikpd-list">
          {filteredKlienten.map((k) => {
            const initials = k.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
            const isExpanded = expandedId === k._id;
            return (
              <div key={k._id} className={`ikpd-list-item${isExpanded ? ' expanded' : ''}`}>
                <div className="ikpd-list-item-row" onClick={() => setExpandedId(isExpanded ? null : k._id)}>
                  <div className="ikpd-list-item-avatar">{initials}</div>
                  <div className="ikpd-list-item-content">
                    <div className="ikpd-list-item-primary">
                      <span className="ikpd-list-item-name">{k.name}</span>
                      {k.geburtsdatum && (
                        <Badge bg="light" text="dark" className="fw-normal">
                          {k.geburtsdatum.slice(0, 10)}
                        </Badge>
                      )}
                    </div>
                    <div className="ikpd-list-item-secondary">
                      <span className="ikpd-list-item-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        {k.email}
                      </span>
                      <span className="ikpd-list-item-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {k.telefonnummer}
                      </span>
                    </div>
                  </div>
                  <div className="ikpd-list-item-actions" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline-primary" size="sm" onClick={() => openModal(k)} title="Bearbeiten">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(k)} title="Löschen">
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
                      <span className="ikpd-detail-label">Adresse</span>
                      <span className="ikpd-detail-value">{k.adresse}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Praxis</span>
                      <span className="ikpd-detail-value">{getPraxisName(k.praxisId)}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Therapeut</span>
                      <span className="ikpd-detail-value">{getTherapeutName(k.therapeutId)}</span>
                    </div>
                    {k.kontaktperson?.name && (
                      <div className="ikpd-detail-field">
                        <span className="ikpd-detail-label">Kontaktperson</span>
                        <span className="ikpd-detail-value">{k.kontaktperson.name}{k.kontaktperson.email ? ` (${k.kontaktperson.email})` : ''}</span>
                      </div>
                    )}
                    {k.auftraggeberNamen && k.auftraggeberNamen.length > 0 && (
                      <div className="ikpd-detail-field">
                        <span className="ikpd-detail-label">Auftraggeber</span>
                        <span className="ikpd-detail-value">{k.auftraggeberNamen.map(id => getAuftraggeberName(id)).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg" centered>
        <Form noValidate validated={validated} onSubmit={handleModalSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">
              {editMode ? "Klient bearbeiten" : "Neuen Klienten anlegen"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="gy-4">
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Max Mustermann"
                    value={selected.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">
                    Name ist erforderlich.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formGeburtsdatum">
                  <Form.Label>Geburtsdatum</Form.Label>
                  <Form.Control
                    required
                    type="date"
                    placeholder="Geburtsdatum"
                    value={selected.geburtsdatum?.slice(0, 10) || ""}
                    onChange={(e) => handleChange("geburtsdatum", e.target.value)}
                  />
                  <Form.Control.Feedback type="invalid">
                    Geburtsdatum ist erforderlich.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formAdresse">
                  <Form.Label>Adresse</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Musterstraße 1, 12345 Musterstadt"
                    value={selected.adresse}
                    onChange={(e) => handleChange("adresse", e.target.value)}
                  />
                  <Form.Control.Feedback type="invalid">
                    Adresse ist erforderlich.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>E-Mail</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    placeholder="max@beispiel.de"
                    value={selected.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    autoComplete="email"
                    isInvalid={
                      !!selected.email &&
                      !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(selected.email)
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    Gültige E-Mail ist erforderlich.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formTelefonnummer">
                  <Form.Label>Telefonnummer</Form.Label>
                  <Form.Control
                    required
                    type="tel"
                    placeholder="+49 123 456789"
                    value={selected.telefonnummer}
                    onChange={(e) => handleChange("telefonnummer", e.target.value)}
                    autoComplete="tel"
                  />
                  <Form.Control.Feedback type="invalid">
                    Telefonnummer ist erforderlich.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-4 mb-2">
              <span className="fs-5 fw-semibold text-dark">Zuordnung</span>
            </div>
            <Row className="gy-3">
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formPraxisId">
                  <Form.Label>Praxis</Form.Label>
                  <Form.Select
                    value={selected.praxisId || ""}
                    onChange={(e) => handleChange("praxisId", e.target.value)}
                  >
                    <option value="">Bitte wählen</option>
                    {praxen.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formTherapeutId">
                  <Form.Label>Therapeut</Form.Label>
                  <Form.Select
                    value={selected.therapeutId || ""}
                    onChange={(e) => handleChange("therapeutId", e.target.value)}
                  >
                    <option value="">Bitte wählen</option>
                    {therapeuten.map(t => (
                      <option key={t._id} value={t._id}>{t.vorname} {t.nachname}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formAuftraggeber">
                  <Form.Label>Auftraggeber</Form.Label>
                  <Form.Select
                    multiple
                    value={selected.auftraggeberNamen || []}
                    onChange={(e) => {
                      const opts = e.target.options;
                      const vals: string[] = [];
                      for (let i = 0; i < opts.length; i++) {
                        if (opts[i].selected) vals.push(opts[i].value);
                      }
                      handleChange("auftraggeberNamen", vals);
                    }}
                    style={{ minHeight: "80px" }}
                  >
                    {auftraggeber.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">Strg/Cmd gedrückt halten für Mehrfachauswahl</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-4 mb-2">
              <span className="fs-5 fw-semibold text-dark">
                Kontaktperson <span className="fw-normal text-secondary">(optional)</span>
              </span>
            </div>
            <Row className="gy-3">
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formKontaktName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Kontaktperson Name"
                    value={selected.kontaktperson?.name || ""}
                    onChange={(e) =>
                      handleKontaktChange("name", e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formKontaktEmail">
                  <Form.Label>E-Mail</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="kontakt@beispiel.de"
                    value={selected.kontaktperson?.email || ""}
                    onChange={(e) =>
                      handleKontaktChange("email", e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formKontaktTelefon">
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+49 123 456789"
                    value={selected.kontaktperson?.telefonnummer || ""}
                    onChange={(e) =>
                      handleKontaktChange("telefonnummer", e.target.value)
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose} title="Abbrechen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={saving}
              title="Speichern"
            >
              {saving ? (
                <Spinner animation="border" size="sm" role="status" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Möchten Sie den Klienten <strong>{deleteTarget?.name}</strong> wirklich löschen?
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

export default KlientenPage;