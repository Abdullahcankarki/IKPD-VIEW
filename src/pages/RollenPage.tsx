import { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { RolleResource } from '../Resources';
import { fetchAlleRollen, createRolle, updateRolle, deleteRolle, fetchPermissionList } from '../services/api';

const PERMISSION_LABELS: Record<string, string> = {
  'klienten:view': 'Anzeigen',
  'klienten:create': 'Erstellen',
  'klienten:edit': 'Bearbeiten',
  'klienten:delete': 'Löschen',
  'auftraggeber:view': 'Anzeigen',
  'auftraggeber:create': 'Erstellen',
  'auftraggeber:edit': 'Bearbeiten',
  'auftraggeber:delete': 'Löschen',
  'termine:view': 'Anzeigen',
  'termine:create': 'Erstellen',
  'termine:edit': 'Bearbeiten',
  'termine:delete': 'Löschen',
  'rechnungen:view': 'Anzeigen',
  'rechnungen:create': 'Erstellen',
  'rechnungen:delete': 'Löschen',
  'rechnungen:send_email': 'Per E-Mail senden',
  'therapeuten:view': 'Anzeigen',
  'therapeuten:manage': 'Verwalten',
  'praxis:view': 'Anzeigen',
  'praxis:manage': 'Verwalten',
  'email_log:view': 'Anzeigen',
  'stundensatz:edit': 'Bearbeiten',
  'rollen:view': 'Anzeigen',
  'rollen:manage': 'Verwalten',
};

const GROUP_LABELS: Record<string, string> = {
  klienten: 'Klienten',
  auftraggeber: 'Auftraggeber',
  termine: 'Termine',
  rechnungen: 'Rechnungen',
  therapeuten: 'Therapeuten',
  praxis: 'Praxis',
  sonstiges: 'Sonstiges',
};

interface PermGroup {
  label: string;
  permissions: string[];
}

export default function RollenPage() {
  const [rollen, setRollen] = useState<RolleResource[]>([]);
  const [groups, setGroups] = useState<Record<string, PermGroup>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRolle, setEditRolle] = useState<RolleResource | null>(null);
  const [formName, setFormName] = useState('');
  const [formBeschreibung, setFormBeschreibung] = useState('');
  const [formBerechtigungen, setFormBerechtigungen] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RolleResource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [rollenData, permData] = await Promise.all([
        fetchAlleRollen(),
        fetchPermissionList(),
      ]);
      setRollen(rollenData);
      setGroups(permData.groups as Record<string, PermGroup>);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditRolle(null);
    setFormName('');
    setFormBeschreibung('');
    setFormBerechtigungen([]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (rolle: RolleResource) => {
    setEditRolle(rolle);
    setFormName(rolle.name);
    setFormBeschreibung(rolle.beschreibung || '');
    setFormBerechtigungen([...rolle.berechtigungen]);
    setError('');
    setShowModal(true);
  };

  const togglePermission = (perm: string) => {
    setFormBerechtigungen(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const toggleGroup = (groupKey: string, checked: boolean) => {
    const groupPerms = groups[groupKey]?.permissions || [];
    setFormBerechtigungen(prev => {
      if (checked) {
        return Array.from(new Set([...prev, ...groupPerms]));
      }
      return prev.filter(p => !groupPerms.includes(p));
    });
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const data = {
        name: formName.trim(),
        beschreibung: formBeschreibung.trim() || undefined,
        berechtigungen: formBerechtigungen,
      };
      if (editRolle) {
        await updateRolle(editRolle._id, data);
      } else {
        await createRolle(data);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setError('');
    try {
      await deleteRolle(deleteConfirm._id);
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const filtered = rollen.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="ikpd-page ikpd-loading">
        <Spinner animation="border" role="status" />
        <div className="mt-3 text-muted">Rollen werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="ikpd-page">
      {/* Header */}
      <div className="ikpd-page-header">
        <h2>Rollen</h2>
        <div className="ikpd-page-actions">
          <Form.Control
            type="text"
            className="ikpd-search-input"
            placeholder="Suche"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button variant="primary" onClick={openCreate} title="Neue Rolle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </Button>
        </div>
      </div>
      {filtered.length > 0 && (
        <div className="ikpd-list-count mb-2">{filtered.length} Rollen</div>
      )}

      {filtered.length === 0 ? (
        <div className="ikpd-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>Keine Rollen gefunden</p>
        </div>
      ) : (
        <div className="ikpd-list">
          {filtered.map(rolle => (
            <div key={rolle._id} className="ikpd-list-item">
              <div className="ikpd-list-item-row" onClick={() => openEdit(rolle)}>
                <div className={`ikpd-list-item-avatar${rolle.istSystem ? ' blue' : ''}`}>
                  {rolle.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="ikpd-list-item-content">
                  <div className="ikpd-list-item-primary">
                    <span className="ikpd-list-item-name">{rolle.name}</span>
                    {rolle.istSystem && (
                      <Badge bg="secondary">System</Badge>
                    )}
                  </div>
                  {rolle.beschreibung && (
                    <div className="ikpd-list-item-secondary">
                      <span className="ikpd-list-item-meta">{rolle.beschreibung}</span>
                    </div>
                  )}
                </div>
                <div className="ikpd-list-item-actions" onClick={e => e.stopPropagation()}>
                  <Badge bg="primary" pill>{rolle.berechtigungen.length} Rechte</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Erstellen/Bearbeiten Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            <span className={`ikpd-modal-icon ${editRolle ? 'ikpd-modal-icon--primary' : 'ikpd-modal-icon--success'}`}>
              {editRolle ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="11" x2="12" y2="15"/><line x1="10" y1="13" x2="14" y2="13"/></svg>
              )}
            </span>
            <span className="ikpd-modal-header-text">
              {editRolle ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}
              <span className="ikpd-modal-subtitle">{editRolle ? 'Berechtigungen und Informationen anpassen' : 'Name und Berechtigungen festlegen'}</span>
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger py-2" role="alert">{error}</div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              disabled={editRolle?.istSystem}
              placeholder="z.B. Assistent"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Beschreibung</Form.Label>
            <Form.Control
              type="text"
              value={formBeschreibung}
              onChange={e => setFormBeschreibung(e.target.value)}
              placeholder="Optionale Beschreibung"
            />
          </Form.Group>

          <div className="ikpd-modal-section-title">Berechtigungen</div>

          {Object.entries(groups).map(([key, group]) => {
            const allChecked = group.permissions.every(p => formBerechtigungen.includes(p));
            const someChecked = group.permissions.some(p => formBerechtigungen.includes(p));

            return (
              <div key={key} className="ikpd-rollen-perm-group">
                <Form.Check
                  type="checkbox"
                  id={`group-${key}`}
                  label={<strong>{GROUP_LABELS[key] || group.label}</strong>}
                  checked={allChecked}
                  ref={(el: HTMLInputElement | null) => {
                    if (el) el.indeterminate = someChecked && !allChecked;
                  }}
                  onChange={e => toggleGroup(key, e.target.checked)}
                />
                <div className="ikpd-rollen-perm-list">
                  {group.permissions.map(perm => (
                    <Form.Check
                      key={perm}
                      type="checkbox"
                      id={`perm-${perm}`}
                      label={PERMISSION_LABELS[perm] || perm}
                      checked={formBerechtigungen.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      inline
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="ikpd-rollen-perm-count">
            {formBerechtigungen.length} von {Object.values(groups).reduce((sum, g) => sum + g.permissions.length, 0)} Berechtigungen ausgewählt
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="ikpd-modal-footer-full">
            {editRolle && !editRolle.istSystem ? (
              <Button
                variant="outline-danger"
                onClick={() => { setShowModal(false); setDeleteConfirm(editRolle); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                {' '}Löschen
              </Button>
            ) : <div />}
            <Button variant="light" onClick={() => setShowModal(false)}>Abbrechen</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? <Spinner animation="border" size="sm" /> : (editRolle ? 'Speichern' : 'Erstellen')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Löschen-Bestätigung */}
      <Modal show={!!deleteConfirm} onHide={() => { setDeleteConfirm(null); setDeleting(false); }} centered size="sm">
        <Modal.Body>
          <div className="ikpd-modal-delete-body">
            <div className="ikpd-modal-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            <div className="ikpd-modal-delete-title">Rolle löschen?</div>
            <p className="ikpd-modal-delete-text">
              <strong>{deleteConfirm?.name}</strong> wird unwiderruflich gelöscht.
              Die Rolle kann nur gelöscht werden, wenn keine Therapeuten zugewiesen sind.
            </p>
          </div>
          {error && (
            <div className="alert alert-danger py-2 mx-3" role="alert">{error}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="ikpd-modal-footer-full">
            <Button variant="light" onClick={() => { setDeleteConfirm(null); setDeleting(false); }}>Abbrechen</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner animation="border" size="sm" /> : 'Löschen'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
