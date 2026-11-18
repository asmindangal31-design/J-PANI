import { createDemoTournament } from '../data/presets';
import { Tournament } from '../types/tournament';

const STORAGE_KEY = 'booyahdesk_tournaments_v1';
const ACTIVE_ID_KEY = 'booyahdesk_active_tournament_v1';
const THEME_KEY = 'booyahdesk_theme_v1';

export interface StoredWorkspace {
  tournaments: Tournament[];
  activeTournamentId: string;
}

export function loadWorkspace(): StoredWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Tournament[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeId = localStorage.getItem(ACTIVE_ID_KEY);
        const validActive =
          activeId && parsed.some((t) => t.id === activeId) ? activeId : parsed[0].id;
        return {
          tournaments: parsed,
          activeTournamentId: validActive,
        };
      }
    }
  } catch {
    // Ignore corrupted storage and fall back to demo seed
  }

  const demo = createDemoTournament();
  return {
    tournaments: [demo],
    activeTournamentId: demo.id,
  };
}

export function saveWorkspace(tournaments: Tournament[], activeTournamentId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
    localStorage.setItem(ACTIVE_ID_KEY, activeTournamentId);
  } catch {
    // Ignore storage quota errors
  }
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function isValidTournamentPayload(data: unknown): data is Tournament {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<Tournament>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.organizationName === 'string' &&
    candidate.scoringRules !== undefined &&
    Array.isArray(candidate.teams) &&
    Array.isArray(candidate.matches)
  );
}
