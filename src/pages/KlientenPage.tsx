import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Row,
  Col,
  InputGroup,
  Spinner,
  Toast,
} from "react-bootstrap";
import {
  fetchAlleKlienten,
  createKlient,
  updateKlient,
  deleteKlient,
} from "../services/api";
import { KlientResource } from "../Resources";

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

  useEffect(() => {
    loadKlienten();
  }, []);

  const loadKlienten = async () => {
    try {
      const data = await fetchAlleKlienten();
      setKlienten(data);
    } catch {
      showToast("Fehler beim Laden der Klienten.", "danger");
    }
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
    { key: "praxisId", label: "Praxis-ID" },
  ];

  return (
    <div className="container py-4">
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Klientenverwaltung</h2>
        <div className="d-flex align-items-center gap-3">
          <Form.Control
            type="text"
            placeholder="Nach Namen suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 260 }}
            aria-label="Klient suchen"
          />
          <Button
            variant="primary"
            onClick={() => openModal()}
          >
            Neuer Klient
          </Button>
        </div>
      </div>
      <div className="table-responsive shadow-sm border rounded">
        <Table className="align-middle table-hover border" style={{ borderRadius: "0.7rem", overflow: "hidden" }}>
          <thead className="bg-white text-dark sticky-top" style={{ borderRadius: "0.7rem", zIndex: 2 }}>
            <tr>
              {tableFields.map((field) => (
                <th
                  key={field.key}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() =>
                    setSortConfig((prev) => ({
                      key: field.key,
                      direction:
                        prev?.key === field.key && prev.direction === "asc" ? "desc" : "asc",
                    }))
                  }
                >
                  {field.label}{" "}
                  {sortConfig?.key === field.key && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredKlienten.length === 0 && (
              <tr>
                <td colSpan={tableFields.length + 1} className="text-center text-muted">
                  Keine Klienten gefunden.
                </td>
              </tr>
            )}
            {filteredKlienten.map((k) => (
              <tr key={k._id}>
                <td>{k.name}</td>
                <td>{k.geburtsdatum?.slice(0, 10)}</td>
                <td>{k.adresse}</td>
                <td>{k.email}</td>
                <td>{k.telefonnummer}</td>
                <td>{k.praxisId}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => openModal(k)}
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteClick(k)}
                  >
                    Löschen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

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
              <span className="fs-5 fw-semibold text-dark">
                Kontaktperson <span className="fw-normal text-secondary">(optional)</span>
              </span>
            </div>
            <Row className="gy-3">
              <Col md={6}>
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
              <Col md={6}>
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
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={saving}
            >
              {saving && (
                <Spinner animation="border" size="sm" role="status" className="me-1" />
              )}
              Speichern
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
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirmed}>
            Löschen
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default KlientenPage;