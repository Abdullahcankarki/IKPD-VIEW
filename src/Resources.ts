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

export interface KlientResource {
  _id: string;
  name: string;
  geburtsdatum: string;
  adresse?: string;
  telefonnummer?: string;
  email?: string;
  kontaktperson?: {
    name?: string;
    email?: string;
    telefonnummer?: string;
  };
  auftraggeberNamen: string[];
  praxisId: string;
  therapeutId: string;
}

export interface TherapeutResource {
  _id: string;
  username: string;
  vorname: string;
  nachname: string;
  email: string;
  telefonnummer?: string;
  rolle: 'admin' | 'therapeut';
  praxisId: string;
  stundensatz: number;
  anfang?: string;
  wochenstunden?: number;
  password?: string;
}

export interface LoginPayload {
  _id: string;
  rolle: 'admin' | 'therapeut';
  praxisId: string;
  exp?: number; // Ablaufzeit des Tokens (Unix-Timestamp)
}

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
export interface TerminResource {
  _id: string;
  datum: string; // ISO-Format mit Uhrzeit
  dauer: number; // in Minuten
  beschreibung?: string;
  status: 'geplant' | 'abgeschlossen' | 'abgesagt';
  klientId: string;
  klientName: string;
  therapeutId: string;
  therapeutName: string;
  praxisId: string;
}

export interface RechnungResource {
  _id: string;
  monat: number;
  jahr: number;
  rechnungsdatum: string;
  rechnungsnummer: string;
  umsatzsteuer: 0 | 7 | 19;

  klientId: string;
  klientName: string;
  geburtsdatum: string;
  artDerMassnahme: string;

  auftraggeberId?: string;
  auftraggeberName?: string;
  empfaenger: 'klient' | 'auftraggeber';

  termine: {
    datum: string;
    dauer: number;
    beschreibung?: string;
    therapeutName: string;
    qualifikation: string;
  }[];

  gesamtStunden: number;
  stundensatz: number;
  gesamtBetrag: number;

  praxisInfo: {
    name: string;
    adresse: string;
    telefonnummer?: string;
    email?: string;
    iban?: string;
    bankname?: string;
    bic?: string;
  };

  praxisId: string;
  erstelltVon: string;
}