import { useEffect, useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { KlientResource } from '../Resources';
import { fetchAlleKlienten, createKlient, fetchAlleAuftraggeber, updateKlient, deleteKlient } from '../services/api';

export default function KlientenPage() {
    const [klienten, setKlienten] = useState<KlientResource[]>([]);
    const [auftraggeber, setAuftraggeber] = useState<{ _id: string; name: string }[]>([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<keyof KlientResource>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [detailModal, setDetailModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedKlient, setSelectedKlient] = useState<KlientResource | null>(null);
    const [newKlient, setNewKlient] = useState({
        name: '',
        geburtsdatum: '',
        adresse: '',
        telefonnummer: '',
        email: '',
        kontaktperson: {
            name: '',
            email: '',
            telefonnummer: '',
        },
        auftraggeberIds: [] as string[],
    });

    useEffect(() => {
        fetchAlleKlienten()
            .then(setKlienten)
            .catch((err: Error) => console.error('Fehler beim Laden der Klienten:', err));

        fetchAlleAuftraggeber()
            .then(setAuftraggeber)
            .catch((err: Error) => console.error('Fehler beim Laden der Auftraggeber:', err));
    }, []);

    // Handler zur Erstellung eines neuen Klienten
    const handleCreateKlient = async () => {
        try {
            await createKlient(newKlient);
            setShowModal(false);
            const aktualisiert = await fetchAlleKlienten();
            setKlienten(aktualisiert);
            // Reset
            setNewKlient({
                name: '',
                geburtsdatum: '',
                adresse: '',
                telefonnummer: '',
                email: '',
                kontaktperson: {
                    name: '',
                    email: '',
                    telefonnummer: '',
                },
                auftraggeberIds: [],
            });
        } catch (err) {
            console.error('Fehler beim Erstellen des Klienten:', err);
            alert('Fehler beim Erstellen des Klienten.');
        }
    };

    const handleDeleteKlient = async (id: string) => {
        const confirmed = window.confirm('Möchten Sie diesen Klienten wirklich löschen?');
        if (!confirmed) return;
        try {
            await deleteKlient(id);
            const aktualisiert = await fetchAlleKlienten();
            setKlienten(aktualisiert);
        } catch (err) {
            console.error('Fehler beim Löschen des Klienten:', err);
            alert('Fehler beim Löschen des Klienten.');
        }
    };

    const handleUpdateKlient = async (id: string) => {
        // Handler zum Löschen eines Klienten mit Bestätigung
        if (!selectedKlient) return;
        try {
            // Annahme: Es gibt eine updateKlient Funktion in api, die den Klienten aktualisiert
            // import { updateKlient } from '../services/api'; müsste dann ergänzt werden
            await updateKlient(selectedKlient, id);
            const aktualisiert = await fetchAlleKlienten();
            setKlienten(aktualisiert);
            setDetailModal(false);
            setEditMode(false);
            setSelectedKlient(null);
        } catch (err) {
            console.error('Fehler beim Aktualisieren des Klienten:', err);
            alert('Fehler beim Aktualisieren des Klienten.');
        }
    };

    const sorted = [...klienten]
        .filter((k) =>
            k.name.toLowerCase().includes(search.toLowerCase()) ||
            (k.auftraggeberNamen?.join(', ') ?? '').toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const valA = a[sortBy] ?? '';
            const valB = b[sortBy] ?? '';
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return 0;
        });

    const handleSort = (field: keyof KlientResource) => {
        if (sortBy === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(field);
            setSortAsc(true);
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Klientenübersicht</h2>
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
                    Neuer Klient
                </Button>
            </div>
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name</th>
                        <th onClick={() => handleSort('geburtsdatum')} style={{ cursor: 'pointer' }}>Geburtsdatum</th>
                        <th>Telefon</th>
                        <th>Email</th>
                        <th>Auftraggeber</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((k) => (
                        <tr key={k._id}>
                            <td>{k.name}</td>
                            <td>{k.geburtsdatum ? new Date(k.geburtsdatum).toLocaleDateString('de-DE') : '-'}</td>
                            <td>{k.telefonnummer ?? '-'}</td>
                            <td>{k.email ?? '-'}</td>
                            <td>{k.auftraggeberNamen?.join(', ')}</td>
                            <td>
                                <button
                                    className="btn btn-sm btn-outline-primary me-2"
                                    onClick={() => {
                                        setSelectedKlient(k);
                                        setDetailModal(true);
                                        setEditMode(false);
                                    }}
                                >
                                    Details
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteKlient(k._id)}
                                >
                                    Löschen
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Modal für neuen Klienten */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Neuen Klienten anlegen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-2">
                                    <Form.Label>Name*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newKlient.name}
                                        onChange={(e) => setNewKlient({ ...newKlient, name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Geburtsdatum</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={newKlient.geburtsdatum}
                                        onChange={(e) => setNewKlient({ ...newKlient, geburtsdatum: e.target.value })}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Adresse</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newKlient.adresse}
                                        onChange={(e) => setNewKlient({ ...newKlient, adresse: e.target.value })}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Telefonnummer</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newKlient.telefonnummer}
                                        onChange={(e) => setNewKlient({ ...newKlient, telefonnummer: e.target.value })}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={newKlient.email}
                                        onChange={(e) => setNewKlient({ ...newKlient, email: e.target.value })}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-2">
                                    <Form.Label>Kontaktperson: Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newKlient.kontaktperson.name}
                                        onChange={(e) =>
                                            setNewKlient({
                                                ...newKlient,
                                                kontaktperson: { ...newKlient.kontaktperson, name: e.target.value },
                                            })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Kontaktperson: Telefonnummer</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newKlient.kontaktperson.telefonnummer}
                                        onChange={(e) =>
                                            setNewKlient({
                                                ...newKlient,
                                                kontaktperson: { ...newKlient.kontaktperson, telefonnummer: e.target.value },
                                            })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Kontaktperson: Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={newKlient.kontaktperson.email}
                                        onChange={(e) =>
                                            setNewKlient({
                                                ...newKlient,
                                                kontaktperson: { ...newKlient.kontaktperson, email: e.target.value },
                                            })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Auftraggeber</Form.Label>
                                    <Form.Select
                                        multiple
                                        value={newKlient.auftraggeberIds}
                                        onChange={(e) => {
                                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                                            setNewKlient({ ...newKlient, auftraggeberIds: selected });
                                        }}
                                        required
                                    >
                                        {auftraggeber.map((ag) => (
                                            <option key={ag._id} value={ag._id}>
                                                {ag.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Abbrechen
                    </Button>
                    <Button variant="primary" onClick={handleCreateKlient}>
                        Speichern
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Detail Modal */}
            <Modal show={detailModal} onHide={() => { setDetailModal(false); setEditMode(false); setSelectedKlient(null); }}>
                <Modal.Header closeButton>
                    <Modal.Title>Klientendetails</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedKlient && (
                        <Form>
                            <div className="row">
                                <div className="col-md-6">
                                    <Form.Group className="mb-2">
                                        <Form.Label>Name*</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={selectedKlient.name}
                                            readOnly={!editMode}
                                            onChange={(e) => setSelectedKlient({ ...selectedKlient, name: e.target.value })}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Geburtsdatum</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={selectedKlient.geburtsdatum ? new Date(selectedKlient.geburtsdatum).toISOString().substring(0, 10) : ''}
                                            readOnly={!editMode}
                                            onChange={(e) => setSelectedKlient({ ...selectedKlient, geburtsdatum: e.target.value })}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Adresse</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={selectedKlient.adresse ?? ''}
                                            readOnly={!editMode}
                                            onChange={(e) => setSelectedKlient({ ...selectedKlient, adresse: e.target.value })}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Telefonnummer</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={selectedKlient.telefonnummer ?? ''}
                                            readOnly={!editMode}
                                            onChange={(e) => setSelectedKlient({ ...selectedKlient, telefonnummer: e.target.value })}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={selectedKlient.email ?? ''}
                                            readOnly={!editMode}
                                            onChange={(e) => setSelectedKlient({ ...selectedKlient, email: e.target.value })}
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-md-6">
                                    <Form.Group className="mb-2">
                                        <Form.Label>Kontaktperson: Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={selectedKlient.kontaktperson?.name ?? ''}
                                            readOnly={!editMode}
                                            onChange={(e) =>
                                                setSelectedKlient({
                                                    ...selectedKlient,
                                                    kontaktperson: { ...selectedKlient.kontaktperson, name: e.target.value },
                                                })
                                            }
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Kontaktperson: Telefonnummer</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={selectedKlient.kontaktperson?.telefonnummer ?? ''}
                                            readOnly={!editMode}
                                            onChange={(e) =>
                                                setSelectedKlient({
                                                    ...selectedKlient,
                                                    kontaktperson: { ...selectedKlient.kontaktperson, telefonnummer: e.target.value },
                                                })
                                            }
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Kontaktperson: Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={selectedKlient.kontaktperson?.email ?? ''}
                                            readOnly={!editMode}
                                            onChange={(e) =>
                                                setSelectedKlient({
                                                    ...selectedKlient,
                                                    kontaktperson: { ...selectedKlient.kontaktperson, email: e.target.value },
                                                })
                                            }
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Auftraggeber</Form.Label>
                                        <Form.Select
                                            multiple
                                            value={selectedKlient.auftraggeberNamen ?? []}
                                            disabled={!editMode}
                                            onChange={(e) => {
                                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                setSelectedKlient({
                                                    ...selectedKlient,
                                                    auftraggeberNamen: selected,
                                                });
                                            }}
                                        >
                                            {auftraggeber.map((ag) => (
                                                <option key={ag._id} value={ag._id}>
                                                    {ag.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                </Form.Group>
                            </div>
                        </div>
            </Form>
          )}
            </Modal.Body>
            <Modal.Footer>
                {!editMode && (
                    <Button variant="primary" onClick={() => setEditMode(true)}>
                        Bearbeiten
                    </Button>
                )}
                {editMode && (
                    <>
                        <Button variant="secondary" onClick={() => setEditMode(false)}>
                            Abbrechen
                        </Button>
                        <Button variant="primary" onClick={() => handleUpdateKlient(selectedKlient!._id)}>
                            Speichern
                        </Button>
                    </>
                )}
                <Button variant="secondary" onClick={() => { setDetailModal(false); setEditMode(false); setSelectedKlient(null); }}>
                    Schließen
                </Button>
            </Modal.Footer>
        </Modal>
    </div >
  );
}