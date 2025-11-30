import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Toast,
  ToastContainer,
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
    <div className="p-3">
      <h1>Praxen</h1>
      <div className="d-flex mb-3 flex-wrap align-items-center gap-2">
        <input
          type="search"
          className="form-control"
          placeholder="Suchen..."
          style={{ maxWidth: "300px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Suche Praxen"
        />
        <Button variant="primary" onClick={() => handleOpenModal()}>
          Neue Praxis
        </Button>
      </div>


      <Row xs={1} md={2} lg={3} className="g-4">
        {loading ? (
          <Col>
            <div className="text-center w-100">Laden...</div>
          </Col>
        ) : filteredPraxen.length === 0 ? (
          <Col>
            <div className="text-center w-100">Keine Praxen gefunden</div>
          </Col>
        ) : (
          filteredPraxen.map((praxis) => (
            <Col key={praxis._id}>
              <div className="card h-100 shadow-sm border">
                <div className="card-body">
                  <h5 className="card-title">{praxis.name}</h5>
                  <p className="mb-1"><strong>Adresse:</strong> {praxis.adresse}</p>
                  <p className="mb-1"><strong>Telefon:</strong> {praxis.telefonnummer || "-"}</p>
                  <p className="mb-1"><strong>Email:</strong> {praxis.email || "-"}</p>
                  <p className="mb-1"><strong>IBAN:</strong> {praxis.iban || "-"}</p>
                  <p className="mb-1"><strong>Bank:</strong> {praxis.bankname || "-"}</p>
                  <p className="mb-1"><strong>BIC:</strong> {praxis.bic || "-"}</p>
                  <p className="mb-2"><strong>Therapeuten:</strong> {praxis.therapeuten.map(t => `${t.vorname} ${t.nachname}`).join(", ") || "-"}</p>
                  <div className="d-flex justify-content-end gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => handleOpenModal(praxis)}>
                      Bearbeiten
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => confirmDelete(praxis._id)}>
                      Löschen
                    </Button>
                  </div>
                </div>
              </div>
            </Col>
          ))
        )}
      </Row>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
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
            <Button variant="secondary" onClick={handleCloseModal}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary">
              Speichern
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchten Sie diese Praxis wirklich löschen?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Löschen
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