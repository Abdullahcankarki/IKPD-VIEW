import { AuftraggeberResource, KlientResource, TerminResource, TherapeutResource, PraxisResource, RechnungResource } from "../Resources";

const API_URL = process.env.REACT_APP_API_SERVER_URL || "";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

export async function fetchLogin(username: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/therapeut/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login fehlgeschlagen');
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('Kein Token erhalten');
  }

  return data.token;
}

export async function fetchMeineTermine(): Promise<TerminResource[]> {
  const response = await fetch(`${API_URL}/api/termine/meine`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login fehlgeschlagen');
  }

  return await response.json();
}

interface CreateTerminPayload {
  datum: string;
  dauer: number;
  beschreibung?: string;
  klientId: string;
  status?: 'geplant' | 'abgeschlossen' | 'abgesagt';
}

export async function createTermin(terminData: CreateTerminPayload): Promise<any> {
  const response = await fetch(`${API_URL}/api/termine/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: 'geplant', ...terminData }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Termin konnte nicht erstellt werden');
  }

  return await response.json();
}

export async function fetchAlleKlienten(): Promise<KlientResource[]> {
  const response = await fetch(`${API_URL}/api/klienten/meine`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Klienten konnten nicht gealden werden');
  }

  return await response.json();
}

export async function createKlient(klient: Partial<KlientResource>): Promise<any> {
  const response = await fetch(`${API_URL}/api/klienten/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(klient),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Klient konnte nicht erstellt werden');
  }

  return await response.json();
}

export async function updateKlient(klient: Partial<KlientResource>, id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/klienten/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(klient),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Klient konnte nicht erstellt werden');
  }

  return await response.json();
}

export async function deleteKlient(id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/klienten/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Klient konnte nicht erstellt werden');
  }

  return await response.json();
}

export async function fetchAlleAuftraggeber(): Promise<AuftraggeberResource[]> {
  const response = await fetch(`${API_URL}/api/auftraggeber/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Auftraggeber konnten nicht gealden werdenn');
  }

  return await response.json();
}

export async function createAuftraggeber(klient: Partial<AuftraggeberResource>): Promise<any> {
  const response = await fetch(`${API_URL}/api/auftraggeber/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(klient),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Auftraggeber konnte nicht erstellt werden');
  }

  return await response.json();
}

export async function updateAuftraggeber(auftraggeber: Partial<AuftraggeberResource>, id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/auftraggeber/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(auftraggeber),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Auftraggeber konnte nicht aktualisiert werden');
  }

  return await response.json();
}

export async function deleteAuftraggeber(id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/auftraggeber/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Auftraggeber konnte nicht gelöscht werden');
  }

  return await response.json();
}

// Therapeuten-API-Funktionen
export async function fetchAlleTherapeuten(): Promise<TherapeutResource[]> {
  const response = await fetch(`${API_URL}/api/therapeut/all`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Therapeuten konnten nicht geladen werden');
  }
  return await response.json();
}

export async function createTherapeut(therapeut: Partial<TherapeutResource>): Promise<any> {
  const response = await fetch(`${API_URL}/api/therapeut/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(therapeut),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Therapeut konnte nicht erstellt werden');
  }
  return await response.json();
}

export async function updateTherapeut(therapeut: Partial<TherapeutResource>, id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/therapeut/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(therapeut),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Therapeut konnte nicht aktualisiert werden');
  }
  return await response.json();
}

export async function deleteTherapeut(id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/therapeut/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Therapeut konnte nicht gelöscht werden');
  }
  return await response.json();
}

// Praxen-API-Funktionen
export async function fetchAllePraxen(): Promise<PraxisResource[]> {
  const response = await fetch(`${API_URL}/api/praxen/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Praxen konnten nicht geladen werden');
  }
  return await response.json();
}

export async function fetchMeinePraxen(): Promise<PraxisResource[]> {
  const response = await fetch(`${API_URL}/api/praxen/meine`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Praxen konnten nicht geladen werden');
  }
  return await response.json();
}

export async function createPraxis(praxis: Partial<PraxisResource>): Promise<any> {
  const response = await fetch(`${API_URL}/api/praxen/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(praxis),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Praxis konnte nicht erstellt werden');
  }
  return await response.json();
}

export async function deletePraxis(id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/praxen/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Praxis konnte nicht gelöscht werden');
  }
  return await response.json();
}

export async function updatePraxis(praxis: Partial<PraxisResource>, id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/praxen/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(praxis),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Praxis konnte nicht aktualisiert werden');
  }
  return await response.json();
}

// Rechnungen-API-Funktionen
export async function fetchAlleRechnungen(): Promise<RechnungResource[]> {
  const response = await fetch(`${API_URL}/api/rechnungen/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Rechnungen konnten nicht geladen werden');
  }
  return await response.json();
}

export async function fetchRechnung(id: string): Promise<RechnungResource> {
  const response = await fetch(`${API_URL}/api/rechnungen/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Rechnung konnte nicht geladen werden');
  }
  return await response.json();
}

export async function createRechnung(data: {
  monat: number;
  jahr: number;
  klientId: string;
  artDerMassnahme: string;
  umsatzsteuer?: number;
  rechnungsnummer?: string;
  therapeutId?: string;
}): Promise<RechnungResource> {
  const response = await fetch(`${API_URL}/api/rechnungen/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Rechnung konnte nicht erstellt werden');
  }
  return await response.json();
}

export async function deleteRechnung(id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/rechnungen/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Rechnung konnte nicht gelöscht werden');
  }
  return await response.json();
}

export function getRechnungPdfUrl(id: string): string {
  return `${API_URL}/api/rechnungen/${id}/pdf`;
}

// Profil-API-Funktionen
export async function fetchMeinProfil(): Promise<TherapeutResource> {
  const response = await fetch(`${API_URL}/api/therapeut/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Profil konnte nicht geladen werden');
  }
  return await response.json();
}

export async function updateMeinProfil(data: Partial<TherapeutResource>): Promise<TherapeutResource> {
  const response = await fetch(`${API_URL}/api/therapeut/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Profil konnte nicht aktualisiert werden');
  }
  return await response.json();
}

export async function updateMeinPasswort(oldPassword: string, newPassword: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/therapeut/me/password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Passwort konnte nicht geändert werden');
  }
  return await response.json();
}