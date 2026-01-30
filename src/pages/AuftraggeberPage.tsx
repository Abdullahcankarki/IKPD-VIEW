import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Toast,
  Alert,
  Row,
  Col,
  Badge,
} from 'react-bootstrap';

import {
  fetchAlleAuftraggeber,
  createAuftraggeber,
  updateAuftraggeber,
  deleteAuftraggeber,
  fetchAllePraxen,
} from '../services/api';
import { PraxisResource } from '../Resources';


export interface AuftraggeberResource {
  _id: string;
  name: string;
  institution: string;
  funktion: string;
  adresse: string;
  telefonnummer?: string;
  email: string;
  praxisId: string;
}

const initialForm: AuftraggeberResource = {
  _id: '',
  name: '',
  institution: '',
  funktion: '',
  adresse: '',
  telefonnummer: '',
  email: '',
  praxisId: '',
};

const AuftraggeberComponent = () => {
  const [auftraggeber, setAuftraggeber] = useState<AuftraggeberResource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<AuftraggeberResource>(initialForm);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [praxen, setPraxen] = useState<PraxisResource[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'institution' | 'email' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (showModal) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }, [showModal]);

  useEffect(() => {
    const loadPraxen = async () => {
      try {
        const data = await fetchAllePraxen();
        setPraxen(data);
      } catch { /* ignore */ }
    };
    loadPraxen();
  }, []);

  const getPraxisName = (id: string) => praxen.find(p => p._id === id)?.name || '–';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (data: AuftraggeberResource) => {
    setFormData(data);
    setIsEditing(true);
    setShowModal(true);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAlleAuftraggeber();
        setAuftraggeber(data);
      } catch (error) {
        console.error('Fehler beim Laden der Auftraggeber:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name) errors.name = 'Name ist erforderlich';
    if (!formData.institution) errors.institution = 'Institution ist erforderlich';
    if (!formData.funktion) errors.funktion = 'Funktion ist erforderlich';
    if (!formData.adresse) errors.adresse = 'Adresse ist erforderlich';
    if (!formData.email) errors.email = 'E-Mail ist erforderlich';
    if (!formData.praxisId) errors.praxisId = 'Praxis ist erforderlich';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (isEditing) {
        const updated = await updateAuftraggeber(formData, formData._id);
        setAuftraggeber((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
      } else {
        const created = await createAuftraggeber(formData);
        setAuftraggeber((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteAuftraggeber(pendingDeleteId);
      setAuftraggeber((prev) => prev.filter((a) => a._id !== pendingDeleteId));
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: 'Gelöscht',
          message: 'Der Auftraggeber wurde erfolgreich gelöscht.',
        },
      ]);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    } finally {
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredData = auftraggeber
    .filter((a) =>
      [a.name, a.institution, a.funktion, a.email].some((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortBy) return 0;
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      return sortOrder === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

  const handleSort = (field: 'name' | 'institution' | 'email') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="ikpd-page">
      <div className="ikpd-page-header">
        <h2>Auftraggeber</h2>
        <div className="ikpd-page-actions">
          <Form.Control
            type="text"
            className="ikpd-search-input"
            placeholder="Suche"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="primary" onClick={handleCreate} title="Hinzufügen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </Button>
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="ikpd-list-count mb-2">{filteredData.length} Auftraggeber</div>
      )}

      {filteredData.length === 0 ? (
        <div className="ikpd-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>Keine passenden Auftraggeber gefunden</p>
        </div>
      ) : (
        <div className="ikpd-list">
          {filteredData.map((a) => {
            const initials = a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const isExpanded = expandedId === a._id;
            return (
              <div key={a._id} className={`ikpd-list-item${isExpanded ? ' expanded' : ''}`}>
                <div className="ikpd-list-item-row" onClick={() => setExpandedId(isExpanded ? null : a._id)}>
                  <div className="ikpd-list-item-avatar blue">{initials}</div>
                  <div className="ikpd-list-item-content">
                    <div className="ikpd-list-item-primary">
                      <span className="ikpd-list-item-name">{a.name}</span>
                      <Badge bg="light" text="dark" className="fw-normal">{a.institution}</Badge>
                    </div>
                    <div className="ikpd-list-item-secondary">
                      <span className="ikpd-list-item-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        {a.email}
                      </span>
                      <span className="ikpd-list-item-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {a.funktion}
                      </span>
                    </div>
                  </div>
                  <div className="ikpd-list-item-actions" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(a)} title="Bearbeiten">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(a._id)} title="Löschen">
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
                      <span className="ikpd-detail-label">Institution</span>
                      <span className="ikpd-detail-value">{a.institution}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Funktion</span>
                      <span className="ikpd-detail-value">{a.funktion}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Adresse</span>
                      <span className="ikpd-detail-value">{a.adresse}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Telefon</span>
                      <span className="ikpd-detail-value">{a.telefonnummer || '–'}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">E-Mail</span>
                      <span className="ikpd-detail-value">{a.email}</span>
                    </div>
                    <div className="ikpd-detail-field">
                      <span className="ikpd-detail-label">Praxis</span>
                      <span className="ikpd-detail-value">{getPraxisName(a.praxisId)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Auftraggeber bearbeiten' : 'Neuer Auftraggeber'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {Object.keys(formErrors).length > 0 && (
              <Alert variant="danger">Bitte füllen Sie alle Pflichtfelder korrekt aus.</Alert>
            )}
            <Row className="g-3">
              <Col md={6}>
                <div className="border rounded p-3 bg-light h-100">
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      isInvalid={!!formErrors.name}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Institution</Form.Label>
                    <Form.Control
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      isInvalid={!!formErrors.institution}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.institution}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Funktion</Form.Label>
                    <Form.Control
                      name="funktion"
                      value={formData.funktion}
                      onChange={handleChange}
                      isInvalid={!!formErrors.funktion}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.funktion}</Form.Control.Feedback>
                  </Form.Group>
                </div>
              </Col>
              <Col md={6}>
                <div className="border rounded p-3 bg-light h-100">
                  <Form.Group className="mb-3">
                    <Form.Label>Adresse</Form.Label>
                    <Form.Control
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      isInvalid={!!formErrors.adresse}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.adresse}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Telefonnummer</Form.Label>
                    <Form.Control name="telefonnummer" value={formData.telefonnummer} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!formErrors.email}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Praxis</Form.Label>
                    <Form.Select
                      name="praxisId"
                      value={formData.praxisId}
                      onChange={handleChange as any}
                      isInvalid={!!formErrors.praxisId}
                    >
                      <option value="">Bitte wählen</option>
                      {praxen.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.praxisId}</Form.Control.Feedback>
                  </Form.Group>
                </div>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} title="Abbrechen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
          <Button variant="primary" onClick={handleSubmit} title={isEditing ? 'Speichern' : 'Erstellen'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchten Sie diesen Auftraggeber wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} title="Abbrechen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
          <Button variant="danger" onClick={confirmDelete} title="Löschen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </Button>
        </Modal.Footer>
      </Modal>

      <div aria-live="polite" aria-atomic="true" className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
        {toasts.map((t) => (
          <Toast key={t.id} onClose={() => removeToast(t.id)} show={true} autohide delay={3000} className="mb-2">
            <Toast.Header>
              <strong className="me-auto">{t.title}</strong>
            </Toast.Header>
            <Toast.Body>{t.message}</Toast.Body>
          </Toast>
        ))}
      </div>
    </div >
  );
};

export default AuftraggeberComponent;