import { Modal, Button, Form } from 'react-bootstrap';
import { fetchAlleKlienten, createTermin } from '../services/api';
import { Calendar, Views, dateFnsLocalizer, Event, View } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek as originalStartOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { de } from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState } from 'react';
import { fetchMeineTermine } from '../services/api';
import moment from 'moment-timezone';

moment.tz.setDefault('Europe/Berlin');

const locales = { de };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: any) => originalStartOfWeek(date, { locale: de }),
    getDay,
    locales,
});

const statusColors: Record<string, string> = {
    geplant: '#0d6efd',
    abgeschlossen: '#198754',
    abgesagt: '#dc3545',
};

const Kalender = () => {
    const [events, setEvents] = useState<Event[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [beschreibung, setBeschreibung] = useState('');
    const [dauer, setDauer] = useState(30);
    const [klientId, setKlientId] = useState('');
    const [klienten, setKlienten] = useState<any[]>([]);

    const [currentView, setCurrentView] = useState<View>(Views.MONTH);

    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadKlienten = async () => {
            try {
                const result = await fetchAlleKlienten();
                setKlienten(result);
            } catch (err) {
                console.error('Fehler beim Laden der Klienten:', err);
            }
        };
        loadKlienten();
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const termine = await fetchMeineTermine();
                const mapped = termine.map((t: any) => ({
                    title: t.klientName + ' (' + t.status + ')',
                    start: new Date(t.datum),
                    end: new Date(new Date(t.datum).getTime() + t.dauer * 60000),
                    status: t.status,
                }));
                setEvents(mapped);
            } catch (err) {
                console.error('Fehler beim Laden der Termine:', err);
            }
        };
        load();
    }, []);

    return (
        <div className="container mt-4" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h2 className="mb-4">Meine Termine</h2>
            <div style={{ flex: 1, minHeight: 0 }}>
                <Calendar
                    localizer={localizer}
                    culture="de"
                    messages={{
                        next: "Nächster",
                        previous: "Zurück",
                        today: "Heute",
                        month: "Monat",
                        week: "Woche",
                        day: "Tag",
                        agenda: "Agenda",
                        date: "Datum",
                        time: "Uhrzeit",
                        event: "Termin",
                        noEventsInRange: "Keine Termine im ausgewählten Zeitraum.",
                        showMore: (total) => `+${total} mehr`,
                    }}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '80vh', minHeight: 400 }}
                    eventPropGetter={(event: any) => {
                        const color = statusColors[event.status] || '#6c757d';
                        return { style: { backgroundColor: color, color: 'white' } };
                    }}
                    defaultView={Views.MONTH}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    selectable
                    onSelectSlot={(slotInfo) => {
                        setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
                        setShowModal(true);
                        setErrorMessage('');
                    }}
                    slotPropGetter={() => ({
                        style: {
                            backgroundColor: '#f8f9fa',
                        },
                    })}
                    view={currentView}
                    onView={(view) => setCurrentView(view)}
                />
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Neuen Termin erstellen</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedSlot && (
                            <>
                                <div className="mb-3">
                                    <strong>Startzeit:</strong>{' '}
                                    {moment(selectedSlot.start).tz('Europe/Berlin').locale('de').format('dddd, DD. MMMM YYYY, HH:mm')}
                                </div>
                                <Form.Group className="mb-3">
                                    <Form.Label>Startzeit bearbeiten</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={selectedSlot ? moment(selectedSlot.start).format('YYYY-MM-DDTHH:mm') : ''}
                                        onChange={(e) => {
                                            if (selectedSlot) {
                                                const updated = new Date(e.target.value);
                                                setSelectedSlot({ ...selectedSlot, start: updated });
                                            }
                                        }}
                                    />
                                </Form.Group>
                            </>
                        )}
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Klient</Form.Label>
                                <Form.Select value={klientId} onChange={(e: any) => setKlientId(e.target.value)}>
                                    <option value="">Klient auswählen</option>
                                    {klienten.map((k) => (
                                        <option key={k._id} value={k._id}>{k.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Dauer (Minuten)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={dauer}
                                    onChange={(e: any) => setDauer(Number(e.target.value))}
                                    min={1}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Beschreibung</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={beschreibung}
                                    onChange={(e: any) => setBeschreibung(e.target.value)}
                                />
                            </Form.Group>
                        </Form>
                        {errorMessage && (
                            <div className="alert alert-danger" role="alert">
                                {errorMessage}
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Schließen</Button>
                        <Button
                            variant="primary"
                            onClick={async () => {
                                if (!selectedSlot || !klientId) {
                                    setErrorMessage('Bitte wählen Sie einen Klienten.');
                                    return;
                                }
                                try {
                                    await createTermin({
                                        datum: moment(selectedSlot.start).toISOString(),
                                        dauer,
                                        beschreibung,
                                        klientId,
                                    });
                                    setShowModal(false);
                                    window.location.reload(); // einfachste Möglichkeit zum Aktualisieren
                                } catch (err) {
                                    setErrorMessage('Der Termin konnte nicht erstellt werden. Bitte überprüfe deine Eingaben.');
                                    console.error(err);
                                }
                            }}
                        >
                            Termin speichern
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default Kalender;