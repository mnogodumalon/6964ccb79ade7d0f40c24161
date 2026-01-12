// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Kategorien {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kategorie_name?: string;
    beschreibung?: string;
    farbe?: 'rot' | 'blau' | 'gruen' | 'gelb' | 'orange' | 'lila' | 'grau';
  };
}

export interface Aufgaben {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    faelligkeitsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    prioritaet?: 'mittel' | 'hoch' | 'sehr_hoch' | 'niedrig';
    kategorie?: string; // applookup -> URL zu 'Kategorien' Record
    erledigt?: boolean;
  };
}

export interface Schnellerfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    aufgabe_titel?: string;
    aufgabe_beschreibung?: string;
    aufgabe_faelligkeit?: string; // Format: YYYY-MM-DD oder ISO String
    aufgabe_prioritaet?: 'niedrig' | 'mittel' | 'hoch' | 'sehr_hoch';
    aufgabe_kategorie?: string; // applookup -> URL zu 'Kategorien' Record
  };
}

export const APP_IDS = {
  KATEGORIEN: '6964cc955a718af89fb4e689',
  AUFGABEN: '6964cc99fdae809a125528fb',
  SCHNELLERFASSUNG: '6964cc9a2e896daa6ab6e8e1',
} as const;

// Helper Types for creating new records
export type CreateKategorien = Kategorien['fields'];
export type CreateAufgaben = Aufgaben['fields'];
export type CreateSchnellerfassung = Schnellerfassung['fields'];