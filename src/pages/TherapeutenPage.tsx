import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Table, Toast, Row, Col, InputGroup, FormControl } from "react-bootstrap";
import {fetchAlleTherapeuten, createTherapeut, updateTherapeut, deleteTherapeut } from "../services/api";
import { TherapeutResource } from "../Resources";

const initialTherapeut: TherapeutResource = {
  _id: "",
  vorname: "",
  nachname: "",
  email: "",
  telefonnummer: "",
  username: "",
  rolle: "therapeut",
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

  useEffect(() => {
    loadTherapeuten();
  }, []);

  const loadTherapeuten = async () => {
    try {
      const data = await fetchAlleTherapeuten();
      setTherapeuten(data);
    } catch (error) {
      showToastMessage("Fehler beim Laden der Therapeuten.");
    }
  };

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
    <div className="container mt-4">
      <h2>Therapeuten</h2>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <InputGroup style={{ maxWidth: "300px" }}>
          <FormControl
            placeholder="Suche"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Button variant="primary" onClick={() => handleShowModal()}>
          Neuer Therapeut
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Vorname</th>
            <th>Nachname</th>
            <th>Email</th>
            <th>Rolle</th>
            <th>Praxis ID</th>
            <th>Stundensatz</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredTherapeuten.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center">Keine Therapeuten gefunden.</td>
            </tr>
          )}
          {filteredTherapeuten.map(t => (
            <tr key={t._id}>
              <td>{t.vorname}</td>
              <td>{t.nachname}</td>
              <td>{t.email}</td>
              <td>{t.rolle}</td>
              <td>{t.praxisId}</td>
              <td>{t.stundensatz}</td>
              <td>
                <Button variant="outline-secondary" size="sm" onClick={() => handleShowModal(t)} className="me-2">
                  Bearbeiten
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(t)}>
                  Löschen
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

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
                  <Form.Label>Praxis ID</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    placeholder="Praxis ID"
                    name="praxisId"
                    value={currentTherapeut.praxisId}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">Bitte Praxis ID eingeben.</Form.Control.Feedback>
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
            <Button variant="secondary" onClick={handleCloseModal}>
              Abbrechen
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? "Speichern" : "Erstellen"}
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
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Löschen
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
