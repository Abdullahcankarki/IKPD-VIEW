import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Toast,
  ToastContainer,
  Badge,
} from "react-bootstrap";
import {
  fetchAllePraxen,
  fetchAlleTherapeuten,
  createPraxis,
  updatePraxis,
  deletePraxis,
} from "../services/api";

export interface PraxisResource {
  _id: string;
  name: string;
  adresse: string;
  telefonnummer?: string;
  email?: string;
  therapeuten: {
    _id: string;
    vorname: string;
    nachname: string;
  }[];
  iban?: string;
  bankname?: string;
  bic?: string;
}

interface TherapeutResource {
  _id: string;
  vorname: string;
  nachname: string;
}

const PraxisPage: React.FC = () => {
  const [praxen, setPraxen] = useState<PraxisResource[]>([]);
  const [therapeuten, setTherapeuten] = useState<TherapeutResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editPraxis, setEditPraxis] = useState<PraxisResource | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; bg: string } | null>(
    null
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadData();
    loadTherapeuten();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllePraxen();
      setPraxen(data);
    } catch {
      setToast({ message: "Fehler beim Laden der Praxen", bg: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const loadTherapeuten = async () => {
    try {
      const data = await fetchAlleTherapeuten();
      setTherapeuten(data);
    } catch {
      setToast({ message: "Fehler beim Laden der Therapeuten", bg: "danger" });
    }
  };

  const handleOpenModal = (praxis?: PraxisResource) => {
    setEditPraxis(praxis || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditPraxis(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const formData = new FormData(form);
    const therapeutenIds = formData.getAll("therapeuten") as string[];

    const praxisToSave: PraxisResource = {
      _id: editPraxis?._id || "",
      name: formData.get("name")?.toString() || "",
      adresse: formData.get("adresse")?.toString() || "",
      telefonnummer: formData.get("telefonnummer")?.toString() || undefined,
      email: formData.get("email")?.toString() || undefined,
      iban: formData.get("iban")?.toString() || undefined,
      bankname: formData.get("bankname")?.toString() || undefined,
      bic: formData.get("bic")?.toString() || undefined,
      therapeuten: therapeuten.filter((t) => therapeutenIds.includes(t._id)),
    };

    try {
      if (editPraxis) {
        await updatePraxis(praxisToSave, editPraxis._id);
        setToast({ message: "Praxis aktualisiert", bg: "success" });
      } else {
        await createPraxis(praxisToSave);
        setToast({ message: "Praxis erstellt", bg: "success" });
      }
      handleCloseModal();
      loadData();
    } catch {
      setToast({ message: "Fehler beim Speichern", bg: "danger" });
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePraxis(deleteId);
      setToast({ message: "Praxis gelöscht", bg: "success" });
      setShowDeleteModal(false);
      setDeleteId(null);
      loadData();
    } catch {
      setToast({ message: "Fehler beim Löschen", bg: "danger" });
    }
  };

  const filteredPraxen = praxen.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.adresse.toLowerCase().includes(searchLower) ||
      (p.telefonnummer?.toLowerCase().includes(searchLower) ?? false) ||
      (p.email?.toLowerCase().includes(searchLower) ?? false) ||
      (p.iban?.toLowerCase().includes(searchLower) ?? false) ||
      (p.bankname?.toLowerCase().includes(searchLower) ?? false) ||
      (p.bic?.toLowerCase().includes(searchLower) ?? false) ||
      p.therapeuten.some(
        (t) =>
          `${t.vorname} ${t.nachname}`.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="ikpd-page">
      <div className="ikpd-page-header">
        <h2>Praxen</h2>
        <div className="ikpd-page-actions">
          <Form.Control
            type="search"
            className="ikpd-search-input"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Suche Praxen"
          />
          <Button variant="primary" onClick={() => handleOpenModal()} title="Neue Praxis">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="ikpd-loading">
          <div className="spinner-border text-primary" role="status" />
          <div className="mt-2 text-muted">Praxen werden geladen...</div>
        </div>
      ) : filteredPraxen.length === 0 ? (
        <div className="ikpd-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p>Keine Praxen gefunden</p>
        </div>
      ) : (
        <Row xs={1} md={2} xl={3} className="g-4">
          {filteredPraxen.map((praxis) => (
            <Col key={praxis._id}>
              <div className="ikpd-praxis-card">
                <div className="ikpd-praxis-card-header">
                  <div className="ikpd-praxis-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="ikpd-praxis-card-title">{praxis.name}</h5>
                    <span className="ikpd-praxis-card-address">{praxis.adresse}</span>
                  </div>
                </div>
                <div className="ikpd-praxis-card-body">
                  <div className="ikpd-praxis-detail">
                    <span className="ikpd-praxis-detail-label">Telefon</span>
                    <span className="ikpd-praxis-detail-value">{praxis.telefonnummer || "–"}</span>
                  </div>
                  <div className="ikpd-praxis-detail">
                    <span className="ikpd-praxis-detail-label">E-Mail</span>
                    <span className="ikpd-praxis-detail-value">{praxis.email || "–"}</span>
                  </div>
                  <div className="ikpd-praxis-detail">
                    <span className="ikpd-praxis-detail-label">IBAN</span>
                    <span className="ikpd-praxis-detail-value" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{praxis.iban || "–"}</span>
                  </div>
                  <div className="ikpd-praxis-detail">
                    <span className="ikpd-praxis-detail-label">Bank / BIC</span>
                    <span className="ikpd-praxis-detail-value">{praxis.bankname || "–"}{praxis.bic ? ` (${praxis.bic})` : ""}</span>
                  </div>
                  {praxis.therapeuten.length > 0 && (
                    <div className="ikpd-praxis-detail">
                      <span className="ikpd-praxis-detail-label">Therapeuten</span>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {praxis.therapeuten.map(t => (
                          <Badge key={t._id} bg="light" text="dark" className="fw-normal">{t.vorname} {t.nachname}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="ikpd-praxis-card-actions">
                  <Button size="sm" variant="outline-primary" onClick={() => handleOpenModal(praxis)} title="Bearbeiten">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => confirmDelete(praxis._id)} title="Löschen">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editPraxis ? "Praxis bearbeiten" : "Neue Praxis"}
          </Modal.Title>
        </Modal.Header>
        <Form
          noValidate
          onSubmit={handleSave}
          ref={formRef}
          className="needs-validation"
        >
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="name" className="mb-3">
                  <Form.Label>Name*</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="name"
                    defaultValue={editPraxis?.name || ""}
                    placeholder="Name"
                  />
                  <Form.Control.Feedback type="invalid">
                    Bitte Name eingeben
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="adresse" className="mb-3">
                  <Form.Label>Adresse*</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="adresse"
                    defaultValue={editPraxis?.adresse || ""}
                    placeholder="Adresse"
                  />
                  <Form.Control.Feedback type="invalid">
                    Bitte Adresse eingeben
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="telefonnummer" className="mb-3">
                  <Form.Label>Telefonnummer*</Form.Label>
                  <Form.Control
                    required
                    type="tel"
                    name="telefonnummer"
                    defaultValue={editPraxis?.telefonnummer || ""}
                    placeholder="Telefonnummer"
                  />
                  <Form.Control.Feedback type="invalid">
                    Bitte Telefonnummer eingeben
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>E-Mail*</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    name="email"
                    defaultValue={editPraxis?.email || ""}
                    placeholder="E-Mail"
                  />
                  <Form.Control.Feedback type="invalid">
                    Bitte gültige E-Mail eingeben
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="iban" className="mb-3">
                  <Form.Label>IBAN*</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="iban"
                    defaultValue={editPraxis?.iban || ""}
                    placeholder="IBAN"
                  />
                  <Form.Control.Feedback type="invalid">
                    Bitte IBAN eingeben
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="bankname" className="mb-3">
                  <Form.Label>Bankname*</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="bankname"
                    defaultValue={editPraxis?.bankname || ""}
                    placeholder="Bankname"
                  />
                  <Form.Control.Feedback type="invalid">
                    Bitte Bankname eingeben
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="bic" className="mb-3">
                  <Form.Label>BIC*</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="bic"
                    defaultValue={editPraxis?.bic || ""}
                    placeholder="BIC"
                  />
                  <Form.Control.Feedback type="invalid">
                    Bitte BIC eingeben
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="therapeuten" className="mb-3">
                  <Form.Label>Therapeuten</Form.Label>
                  <Form.Select
                    multiple
                    name="therapeuten"
                    defaultValue={editPraxis?.therapeuten.map((t) => t._id) || []}
                    aria-label="Therapeuten auswählen"
                  >
                    {therapeuten.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.vorname} {t.nachname}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} title="Abbrechen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </Button>
            <Button type="submit" variant="primary" title="Speichern">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchten Sie diese Praxis wirklich löschen?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} title="Abbrechen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
          <Button variant="danger" onClick={handleDelete} title="Löschen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="bottom-end" className="p-3">
        {toast && (
          <Toast
            onClose={() => setToast(null)}
            bg={toast.bg}
            delay={3000}
            autohide
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <Toast.Body className={toast.bg === "danger" ? "text-white" : ""}>
              {toast.message}
            </Toast.Body>
          </Toast>
        )}
      </ToastContainer>
    </div>
  );
};

export default PraxisPage;
