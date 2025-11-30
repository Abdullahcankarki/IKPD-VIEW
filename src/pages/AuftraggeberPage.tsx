import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Table,
  Toast,
  Alert,
  Row,
  Col,
} from 'react-bootstrap';

import {
  fetchAlleAuftraggeber,
  createAuftraggeber,
  updateAuftraggeber,
  deleteAuftraggeber,
} from '../services/api';


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

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'institution' | 'email' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (showModal) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }, [showModal]);

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
    if (!formData.praxisId) errors.praxisId = 'Praxis-ID ist erforderlich';

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
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Auftraggeber</h2>
        <div className="d-flex gap-2" style={{ maxWidth: '480px', width: '100%' }}>
          <Form.Control
            type="text"
            placeholder="Suche"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="primary" onClick={handleCreate}>
            Hinzufügen
          </Button>
        </div>
      </div>

      <div className="table-responsive shadow-sm border rounded">
        <Table className="align-middle mb-0 table-hover" responsive>
          <thead className="bg-light position-sticky top-0 z-1">
            <tr className="border-bottom">
              <th
                className="fw-semibold text-uppercase small"
                role="button"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="fw-semibold text-uppercase small"
                role="button"
                onClick={() => handleSort('institution')}
              >
                Institution {sortBy === 'institution' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="fw-semibold text-uppercase small">Funktion</th>
              <th className="fw-semibold text-uppercase small">Adresse</th>
              <th className="fw-semibold text-uppercase small">Telefon</th>
              <th
                className="fw-semibold text-uppercase small"
                role="button"
                onClick={() => handleSort('email')}
              >
                Email {sortBy === 'email' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="fw-semibold text-uppercase small">Praxis-ID</th>
              <th className="fw-semibold text-uppercase small text-end">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4 text-muted">
                  <i className="ci-search opacity-50 me-2"></i>
                  Keine passenden Auftraggeber gefunden.
                </td>
              </tr>
            ) : (
              filteredData.map((a) => (
                <tr key={a._id} className="border-bottom">
                  <td>{a.name}</td>
                  <td>{a.institution}</td>
                  <td>{a.funktion}</td>
                  <td>{a.adresse}</td>
                  <td>{a.telefonnummer}</td>
                  <td>{a.email}</td>
                  <td>{a.praxisId}</td>
                  <td className="text-end">
                    <Button variant="outline-secondary" size="sm" onClick={() => handleEdit(a)} className="me-2">
                      <i className="ci-edit me-1"></i> Bearbeiten
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(a._id)}>
                      <i className="ci-trash me-1"></i> Löschen
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

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
                    <Form.Label>Praxis-ID</Form.Label>
                    <Form.Control
                      name="praxisId"
                      value={formData.praxisId}
                      onChange={handleChange}
                      isInvalid={!!formErrors.praxisId}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.praxisId}</Form.Control.Feedback>
                  </Form.Group>
                </div>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {isEditing ? 'Speichern' : 'Erstellen'}
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
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Löschen
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