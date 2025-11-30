import { useEffect, useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { fetchAlleAuftraggeber, createAuftraggeber } from '../services/api';
import { AuftraggeberResource } from '../Resources';

export default function AuftraggeberPage() {
  const [auftraggeber, setAuftraggeber] = useState<AuftraggeberResource[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof AuftraggeberResource>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAuftraggeber, setNewAuftraggeber] = useState({
    name: '',
    institution: '',
    funktion: '',
    adresse: '',
    telefonnummer: '',
    email: '',
  });

  useEffect(() => {
    fetchAlleAuftraggeber()
      .then(setAuftraggeber)
      .catch((err) => console.error('Fehler beim Laden:', err));
  }, []);

  const filtered = auftraggeber
    .filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.institution.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

  const handleSort = (field: keyof AuftraggeberResource) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Auftraggeber</h2>
        <input
          type="text"
          className="form-control w-25"
          placeholder="Suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <Button onClick={() => setShowModal(true)} variant="success">
          Neuer Auftraggeber
        </Button>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name</th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('institution')}>Institution</th>
            <th>Funktion</th>
            <th>Adresse</th>
            <th>Telefon</th>
            <th>E-Mail</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a) => (
            <tr key={a._id}>
              <td>{a.name}</td>
              <td>{a.institution}</td>
              <td>{a.funktion}</td>
              <td>{a.adresse}</td>
              <td>{a.telefonnummer ?? '-'}</td>
              <td>{a.email}</td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2">Details</button>
                <button className="btn btn-sm btn-outline-danger">Löschen</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Neuen Auftraggeber anlegen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label>Name*</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAuftraggeber.name}
                    onChange={(e) =>
                      setNewAuftraggeber({ ...newAuftraggeber, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Institution</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAuftraggeber.institution}
                    onChange={(e) =>
                      setNewAuftraggeber({ ...newAuftraggeber, institution: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Funktion</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAuftraggeber.funktion}
                    onChange={(e) =>
                      setNewAuftraggeber({ ...newAuftraggeber, funktion: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Adresse</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAuftraggeber.adresse}
                    onChange={(e) =>
                      setNewAuftraggeber({ ...newAuftraggeber, adresse: e.target.value })
                    }
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label>Telefonnummer</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAuftraggeber.telefonnummer}
                    onChange={(e) =>
                      setNewAuftraggeber({ ...newAuftraggeber, telefonnummer: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Email*</Form.Label>
                  <Form.Control
                    type="email"
                    value={newAuftraggeber.email}
                    onChange={(e) =>
                      setNewAuftraggeber({ ...newAuftraggeber, email: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                await createAuftraggeber(newAuftraggeber);
                setShowModal(false);
                const aktualisiert = await fetchAlleAuftraggeber();
                setAuftraggeber(aktualisiert);
              } catch (err) {
                alert('Fehler beim Erstellen.');
              }
            }}
          >
            Speichern
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}