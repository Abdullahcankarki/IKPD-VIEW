import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  Toast,
  Spinner,
  Modal,
  Badge,
} from "react-bootstrap";
import { fetchMeinProfil, updateMeinProfil, updateMeinPasswort } from "../services/api";
import { TherapeutResource } from "../Resources";

type ToastType = { show: boolean; message: string; variant: "success" | "danger" };

const ProfilPage: React.FC = () => {
  const [profil, setProfil] = useState<TherapeutResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastType>({ show: false, message: "", variant: "success" });

  const [formData, setFormData] = useState({
    vorname: "",
    nachname: "",
    email: "",
    telefonnummer: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    loadProfil();
  }, []);

  const loadProfil = async () => {
    setLoading(true);
    try {
      const data = await fetchMeinProfil();
      setProfil(data);
      setFormData({
        vorname: data.vorname || "",
        nachname: data.nachname || "",
        email: data.email || "",
        telefonnummer: data.telefonnummer || "",
      });
    } catch {
      showToast("Fehler beim Laden des Profils.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, variant: ToastType["variant"]) => {
    setToast({ show: true, message, variant });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMeinProfil(formData);
      setProfil(updated);
      showToast("Profil erfolgreich aktualisiert.", "success");
    } catch {
      showToast("Fehler beim Speichern.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Passwörter stimmen nicht überein.", "danger");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast("Das Passwort muss mindestens 6 Zeichen lang sein.", "danger");
      return;
    }
    setPasswordSaving(true);
    try {
      await updateMeinPasswort(passwordData.oldPassword, passwordData.newPassword);
      showToast("Passwort erfolgreich geändert.", "success");
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      showToast(err.message || "Fehler beim Ändern des Passworts.", "danger");
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = () => {
    if (!profil) return "";
    return (profil.vorname?.[0] || "").toUpperCase() + (profil.nachname?.[0] || "").toUpperCase();
  };

  if (loading) {
    return (
      <div className="ikpd-page ikpd-loading">
        <Spinner animation="border" role="status" />
        <div className="mt-2 text-muted">Profil wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="ikpd-page">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 1060 }}
      >
        <Toast
          show={toast.show}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
          bg={toast.variant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </div>

      <div className="ikpd-page-header">
        <h2>Mein Profil</h2>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <div className="ikpd-profil-sidebar">
            <div className="ikpd-profil-avatar">
              {getInitials()}
            </div>
            <h4 className="ikpd-profil-name">
              {profil?.vorname} {profil?.nachname}
            </h4>
            <Badge bg={profil?.rolle === "admin" ? "primary" : "secondary"} className="mb-4">
              {profil?.rolle === "admin" ? "Administrator" : "Therapeut"}
            </Badge>

            <div className="ikpd-profil-info-list">
              <div className="ikpd-profil-info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <div>
                  <span className="ikpd-profil-info-label">Benutzername</span>
                  <span className="ikpd-profil-info-value">{profil?.username}</span>
                </div>
              </div>
              <div className="ikpd-profil-info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <div>
                  <span className="ikpd-profil-info-label">Stundensatz</span>
                  <span className="ikpd-profil-info-value">{profil?.stundensatz} €</span>
                </div>
              </div>
              {profil?.wochenstunden ? (
                <div className="ikpd-profil-info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div>
                    <span className="ikpd-profil-info-label">Wochenstunden</span>
                    <span className="ikpd-profil-info-value">{profil.wochenstunden}h</span>
                  </div>
                </div>
              ) : null}
              {profil?.anfang ? (
                <div className="ikpd-profil-info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <div>
                    <span className="ikpd-profil-info-label">Anfang</span>
                    <span className="ikpd-profil-info-value">{profil.anfang.slice(0, 10)}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <Button
              variant="outline-secondary"
              className="w-100 mt-3"
              onClick={() => setShowPasswordModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </Button>
          </div>
        </Col>

        <Col lg={8}>
          <div className="ikpd-profil-form-card">
            <h5 className="ikpd-profil-form-title">Persönliche Daten bearbeiten</h5>
            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Vorname</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.vorname}
                      onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nachname</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.nachname}
                      onChange={(e) => setFormData({ ...formData, nachname: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>E-Mail</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Telefonnummer</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.telefonnummer}
                      onChange={(e) => setFormData({ ...formData, telefonnummer: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="mt-4">
                <Button type="submit" variant="primary" disabled={saving} title="Änderungen speichern">
                  {saving ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </Button>
              </div>
            </Form>
          </div>
        </Col>
      </Row>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered backdrop="static">
        <Form onSubmit={handlePasswordChange}>
          <Modal.Header closeButton>
            <Modal.Title>Passwort ändern</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Aktuelles Passwort</Form.Label>
              <Form.Control
                type="password"
                required
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Neues Passwort</Form.Label>
              <Form.Control
                type="password"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Neues Passwort bestätigen</Form.Label>
              <Form.Control
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                isInvalid={
                  passwordData.confirmPassword.length > 0 &&
                  passwordData.newPassword !== passwordData.confirmPassword
                }
              />
              <Form.Control.Feedback type="invalid">
                Passwörter stimmen nicht überein.
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)} title="Abbrechen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </Button>
            <Button variant="primary" type="submit" disabled={passwordSaving} title="Passwort ändern">
              {passwordSaving ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilPage;
