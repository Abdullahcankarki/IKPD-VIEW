import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Toast, Row, Col, Badge } from "react-bootstrap";
import {fetchAlleTherapeuten, createTherapeut, updateTherapeut, deleteTherapeut, fetchAllePraxen } from "../services/api";
import { TherapeutResource, PraxisResource } from "../Resources";

const initialTherapeut: TherapeutResource = {
  _id: "",
  vorname: "",
  nachname: "",
  email: "",
  telefonnummer: "",
  username: "",
  rolle: "therapeut",
  qualifikation: "",
  praxisId: "",
  stundensatz: 0,
  anfang: "",
  wochenstunden: 0,
  password: ""
};

const TherapeutenPage: React.FC = () => {
  const [therapeuten, setTherapeuten] = useState<TherapeutResource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentTherapeut, setCurrentTherapeut] = useState<TherapeutResource>(initialTherapeut);
  const [isEditing, setIsEditing] = useState(false);
  const [validated, setValidated] = useState(false);
  const [toasts, setToasts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [therapeutToDelete, setTherapeutToDelete] = useState<TherapeutResource | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [praxen, setPraxen] = useState<PraxisResource[]>([]);

  useEffect(() => {
    loadTherapeuten();
    loadPraxen();
  }, []);

  const loadTherapeuten = async () => {
    try {
      const data = await fetchAlleTherapeuten();
      setTherapeuten(data);
    } catch (error) {
      showToastMessage("Fehler beim Laden der Therapeuten.");
    }
  };

  const loadPraxen = async () => {
    try {
      const data = await fetchAllePraxen();
      setPraxen(data);
    } catch { /* ignore */ }
  };

  const getPraxisName = (id: string) => praxen.find(p => p._id === id)?.name || '–';

  const handleShowModal = (therapeut?: TherapeutResource) => {
    if (therapeut) {
      setCurrentTherapeut(therapeut);
      setIsEditing(true);
    } else {
      setCurrentTherapeut(initialTherapeut);
      setIsEditing(false);
    }
    setValidated(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentTherapeut(prev => ({ ...prev, [name]: name === "stundensatz" || name === "wochenstunden" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    try {
      if (isEditing) {
        await updateTherapeut(currentTherapeut, currentTherapeut._id);
        showToastMessage("Therapeut erfolgreich aktualisiert.");
      } else {
        await createTherapeut(currentTherapeut);
        showToastMessage("Therapeut erfolgreich erstellt.");
      }
      setShowModal(false);
      loadTherapeuten();
    } catch (error) {
      showToastMessage("Fehler beim Speichern des Therapeuten.");
    }
  };

  const confirmDelete = (therapeut: TherapeutResource) => {
    setTherapeutToDelete(therapeut);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!therapeutToDelete) return;
    try {
      await deleteTherapeut(therapeutToDelete._id);
      showToastMessage("Therapeut erfolgreich gelöscht.");
      loadTherapeuten();
    } catch (error) {
      showToastMessage("Fehler beim Löschen des Therapeuten.");
    }
    setShowConfirmModal(false);
    setTherapeutToDelete(null);
  };

  const showToastMessage = (message: string) => {
    setToasts(prev => [...prev, message]);
  };

  const removeToast = (index: number) => {
    setToasts(prev => prev.filter((_, i) => i !== index));
  };

  const filteredTherapeuten = therapeuten.filter(t =>
    t.vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nachname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.telefonnummer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.rolle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.praxisId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ikpd-page">
      <div className="ikpd-page-header">
        <h2>Therapeuten</h2>
        <div className="ikpd-page-actions">
          <Form.Control
            type="text"
            className="ikpd-search-input"
            placeholder="Suche"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button variant="primary" onClick={() => handleShowModal()} title="Neuer Therapeut">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </Button>
        </div>
      </div>
      {filteredTherapeuten.length > 0 && (
        <div className="ikpd-list-count mb-2">{filteredTherapeuten.length} Therapeuten</div>
      )}

      {filteredTherapeuten.length === 0 ? (
        <div className="ikpd-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>Keine Therapeuten gefunden</p>
        </div>
      ) : (
        <div className="ikpd-list">
          {filteredTherapeuten.map(t => {
            const initials = (t.vorname?.[0] || '').toUpperCase() + (t.nachname?.[0] || '').toUpperCase();
            const isExpanded = expandedId === t._id;
            return (
              <div key={t._id} className={`ikpd-list-item${isExpanded ? ' expanded' : ''}`}>
                <div className="ikpd-list-item-row" onClick={() => setExpandedId(isExpanded ? null : t._id)}>
                  <div className={`ikpd-list-item-avatar${t.rolle === 'admin' ? ' purple' : ''}`}>{initials}</div>
                  <div className="ikpd-list-item-content">
                    <div className="ikpd-list-item-primary">
                      <span className="ikpd-list-item-name">{t.vorname} {t.nachname}</span>
                      <Badge bg={t.rolle === 'admin' ? 'primary' : 'secondary'}>{t.rolle}</Badge>
                    </div>
                    <div className="ikpd-list-item-secondary">
                      <span className="ikpd-list-item-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        {t.email}
                      </span>
                      <span className="ikpd-list-item-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        {t.stundensatz} €/h
                      </span>
                    </div>
                  </div>
                  <div className="ikpd-list-item-actions" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(t)} title="Bearbeiten">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(t)} title="Löschen">
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
                      <span className="ikpd-detail-label">Username</span>
                      <span className="ikpd-detail-value">{t.username}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Telefon</span>
                      <span className="ikpd-detail-value">{t.telefonnummer || '–'}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Praxis</span>
                      <span className="ikpd-detail-value">{getPraxisName(t.praxisId)}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Qualifikation</span>
                      <span className="ikpd-detail-value">{t.qualifikation || '–'}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Stundensatz</span>
                      <span className="ikpd-detail-value">{t.stundensatz} €</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Wochenstunden</span>
                      <span className="ikpd-detail-value">{t.wochenstunden}h</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Anfang</span>
                      <span className="ikpd-detail-value">{t.anfang?.slice(0, 10) || '–'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Therapeut bearbeiten" : "Neuen Therapeut anlegen"}</Modal.Title>
        </Modal.Header>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="vorname">
                  <Form.Label>Vorname</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Vorname"
                    name="vorname"
                    value={currentTherapeut.vorname}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte Vorname eingeben.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="nachname">
                  <Form.Label>Nachname</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Nachname"
                    name="nachname"
                    value={currentTherapeut.nachname}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte Nachname eingeben.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={currentTherapeut.email}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte gültige Email eingeben.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="telefonnummer">
                  <Form.Label>Telefonnummer</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Telefonnummer"
                    name="telefonnummer"
                    value={currentTherapeut.telefonnummer}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="rolle">
                  <Form.Label>Rolle</Form.Label>
                  <Form.Select
                    required
                    name="rolle"
                    value={currentTherapeut.rolle}
                    onChange={handleChange}
                  >
                    <option value="">Bitte wählen</option>
                    <option value="therapeut">Therapeut</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">Bitte Rolle auswählen.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="qualifikation">
                  <Form.Label>Qualifikation</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="z.B. Psychologe, Heilpraktiker"
                    name="qualifikation"
                    value={currentTherapeut.qualifikation || ""}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Username"
                    name="username"
                    value={currentTherapeut.username}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte Username eingeben.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="praxisId">
                  <Form.Label>Praxis</Form.Label>
                  <Form.Select
                    required
                    name="praxisId"
                    value={currentTherapeut.praxisId}
                    onChange={handleChange}
                  >
                    <option value="">Bitte wählen</option>
                    {praxen.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">Bitte Praxis auswählen.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="stundensatz">
                  <Form.Label>Stundensatz</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Stundensatz"
                    name="stundensatz"
                    value={currentTherapeut.stundensatz}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte Stundensatz eingeben.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="anfang">
                  <Form.Label>Anfang</Form.Label>
                  <Form.Control
                    required
                    type="date"
                    name="anfang"
                    value={currentTherapeut.anfang}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte Anfangsdatum eingeben.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="wochenstunden">
                  <Form.Label>Wochenstunden</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    min={0}
                    placeholder="Wochenstunden"
                    name="wochenstunden"
                    value={currentTherapeut.wochenstunden}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte Wochenstunden eingeben.</Form.Control.Feedback>
                </Form.Group>
                {!isEditing && (
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Passwort</Form.Label>
                    <Form.Control
                      required
                      type="password"
                      placeholder="Passwort"
                      name="password"
                      value={currentTherapeut.password}
                      onChange={handleChange}
                    />
                    <Form.Control.Feedback type="invalid">Bitte Passwort eingeben.</Form.Control.Feedback>
                  </Form.Group>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} title="Abbrechen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </Button>
            <Button variant="primary" type="submit" title={isEditing ? "Speichern" : "Erstellen"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Bestätigung</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchten Sie diesen Therapeuten wirklich löschen?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} title="Abbrechen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
          <Button variant="danger" onClick={handleDelete} title="Löschen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </Button>
        </Modal.Footer>
      </Modal>

      <div aria-live="polite" aria-atomic="true" className="position-relative">
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
          {toasts.map((msg, idx) => (
            <Toast key={idx} onClose={() => removeToast(idx)} show={true} delay={3000} autohide bg="info">
              <Toast.Body className="text-white">{msg}</Toast.Body>
            </Toast>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TherapeutenPage;
