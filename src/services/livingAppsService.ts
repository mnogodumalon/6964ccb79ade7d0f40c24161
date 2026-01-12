// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Kategorien, Aufgaben, Schnellerfassung } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- KATEGORIEN ---
  static async getKategorien(): Promise<Kategorien[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KATEGORIEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getKategorienEntry(id: string): Promise<Kategorien | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KATEGORIEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createKategorienEntry(fields: Kategorien['fields']) {
    return callApi('POST', `/apps/${APP_IDS.KATEGORIEN}/records`, { fields });
  }
  static async updateKategorienEntry(id: string, fields: Partial<Kategorien['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.KATEGORIEN}/records/${id}`, { fields });
  }
  static async deleteKategorienEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KATEGORIEN}/records/${id}`);
  }

  // --- AUFGABEN ---
  static async getAufgaben(): Promise<Aufgaben[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUFGABEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAufgabenEntry(id: string): Promise<Aufgaben | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUFGABEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAufgabenEntry(fields: Aufgaben['fields']) {
    return callApi('POST', `/apps/${APP_IDS.AUFGABEN}/records`, { fields });
  }
  static async updateAufgabenEntry(id: string, fields: Partial<Aufgaben['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.AUFGABEN}/records/${id}`, { fields });
  }
  static async deleteAufgabenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.AUFGABEN}/records/${id}`);
  }

  // --- SCHNELLERFASSUNG ---
  static async getSchnellerfassung(): Promise<Schnellerfassung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHNELLERFASSUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSchnellerfassungEntry(id: string): Promise<Schnellerfassung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHNELLERFASSUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSchnellerfassungEntry(fields: Schnellerfassung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHNELLERFASSUNG}/records`, { fields });
  }
  static async updateSchnellerfassungEntry(id: string, fields: Partial<Schnellerfassung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHNELLERFASSUNG}/records/${id}`, { fields });
  }
  static async deleteSchnellerfassungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHNELLERFASSUNG}/records/${id}`);
  }

}