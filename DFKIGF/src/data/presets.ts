import {
  FreeFireMap,
  ScoringPresetId,
  ScoringRules,
  TiebreakerCriterion,
  Tournament,
} from '../types/tournament';

export const FREE_FIRE_MAPS: FreeFireMap[] = [
  'Bermuda',
  'Purgatory',
  'Kalahari',
  'Alpine',
  'Nextera',
  'Solara',
];

export const TIEBREAKER_LABELS: Record<TiebreakerCriterion, string> = {
  booyahs: 'Total Booyahs',
  placementPoints: 'Placement Points',
  killPoints: 'Kill Points',
  bestMatchRank: 'Best Single Match Rank',
  teamName: 'Alphabetical (Team Name)',
};

export const ORG_ACCENT_OPTIONS = [
  { id: 'ember', name: 'Tournament Ember', hex: '#EA580C' },
  { id: 'cobalt', name: 'Pro Cobalt', hex: '#2563EB' },
  { id: 'emerald', name: 'Arena Emerald', hex: '#16A34A' },
  { id: 'crimson', name: 'Championship Crimson', hex: '#DC2626' },
  { id: 'amber', name: 'Gold Trophy', hex: '#D97706' },
];

export interface ScoringPresetDefinition {
  id: Exclude<ScoringPresetId, 'custom'>;
  name: string;
  summary: string;
  rules: ScoringRules;
}

export const SCORING_PRESETS: ScoringPresetDefinition[] = [
  {
    id: 'ffws-standard',
    name: 'Official FFWS Standard',
    summary: '12 pts for Booyah, 9 for 2nd, 8 for 3rd down to 0 for 12th · 1 pt per kill.',
    rules: {
      presetId: 'ffws-standard',
      maxTeamsPerLobby: 12,
      pointsPerKill: 1,
      booyahBonus: 0,
      placementPoints: {
        1: 12,
        2: 9,
        3: 8,
        4: 7,
        5: 6,
        6: 5,
        7: 4,
        8: 3,
        9: 2,
        10: 1,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
      },
      tiebreakers: ['booyahs', 'placementPoints', 'killPoints', 'bestMatchRank', 'teamName'],
    },
  },
  {
    id: 'high-kill-scrims',
    name: 'Aggressive Scrims (2x Kill)',
    summary: 'Rewards fragging squads: 12 pts for Booyah + 2 pts per elimination.',
    rules: {
      presetId: 'high-kill-scrims',
      maxTeamsPerLobby: 12,
      pointsPerKill: 2,
      booyahBonus: 0,
      placementPoints: {
        1: 12,
        2: 9,
        3: 8,
        4: 7,
        5: 6,
        6: 5,
        7: 4,
        8: 3,
        9: 2,
        10: 1,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
      },
      tiebreakers: ['killPoints', 'booyahs', 'placementPoints', 'bestMatchRank', 'teamName'],
    },
  },
  {
    id: 'placement-heavy',
    name: 'Survival & Booyah Classic',
    summary: 'Legacy survival format: 20 pts for Booyah (+2 bonus), 17 for 2nd, 1 pt per kill.',
    rules: {
      presetId: 'placement-heavy',
      maxTeamsPerLobby: 12,
      pointsPerKill: 1,
      booyahBonus: 2,
      placementPoints: {
        1: 20,
        2: 17,
        3: 15,
        4: 13,
        5: 12,
        6: 10,
        7: 8,
        8: 6,
        9: 4,
        10: 2,
        11: 1,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
      },
      tiebreakers: ['booyahs', 'placementPoints', 'killPoints', 'bestMatchRank', 'teamName'],
    },
  },
];

export function cloneScoringRules(rules: ScoringRules): ScoringRules {
  return {
    ...rules,
    placementPoints: { ...rules.placementPoints },
    tiebreakers: [...rules.tiebreakers],
  };
}

export function createDemoTournament(): Tournament {
  return {
    id: 'tourney-ff-pro-scrims',
    name: 'South Asia Open Scrims — Week 4',
    organizationName: 'Vanguard Esports',
    subtitle: 'Group A · 12-Team Battle Royale',
    accentColor: '#EA580C',
    scoringRules: cloneScoringRules(SCORING_PRESETS[0].rules),
    teams: [
      { id: 't1', name: 'Phoenix Guild', tag: 'PHX', captain: 'Aarav' },
      { id: 't2', name: 'Garuda Five', tag: 'GRD', captain: 'Rizky' },
      { id: 't3', name: 'Siam Strikers', tag: 'SSM', captain: 'Nattapong' },
      { id: 't4', name: 'Ironclad Esports', tag: 'IRC', captain: 'Kiran' },
      { id: 't5', name: 'Krakatoa Unit', tag: 'KRK', captain: 'Bima' },
      { id: 't6', name: 'Valkyrie Squad', tag: 'VLK', captain: 'Somchai' },
      { id: 't7', name: 'Crimson Horizon', tag: 'CRH', captain: 'Dev' },
      { id: 't8', name: 'Delta Outlaws', tag: 'DLT', captain: 'Fajar' },
      { id: 't9', name: 'Naga Dynasty', tag: 'NGA', captain: 'Thanawat' },
      { id: 't10', name: 'Shadow Brigade', tag: 'SHD', captain: 'Arjun' },
      { id: 't11', name: 'Zenith Hunters', tag: 'ZNH', captain: 'Kittisak' },
      { id: 't12', name: 'Apex Raiders', tag: 'APX', captain: 'Vikram' },
    ],
    matches: [
      {
        id: 'm1',
        matchNumber: 1,
        map: 'Bermuda',
        playedAt: '2026-11-18T14:00:00.000Z',
        notes: 'Opening drop — Peak contested by PHX & SSM',
        results: [
          { teamId: 't1', placement: 1, kills: 11, bonusPoints: 0 },
          { teamId: 't2', placement: 2, kills: 8, bonusPoints: 0 },
          { teamId: 't3', placement: 3, kills: 7, bonusPoints: 0 },
          { teamId: 't4', placement: 4, kills: 5, bonusPoints: 0 },
          { teamId: 't5', placement: 5, kills: 6, bonusPoints: 0 },
          { teamId: 't6', placement: 6, kills: 3, bonusPoints: 0 },
          { teamId: 't7', placement: 7, kills: 4, bonusPoints: 0 },
          { teamId: 't8', placement: 8, kills: 2, bonusPoints: 0 },
          { teamId: 't9', placement: 9, kills: 1, bonusPoints: 0 },
          { teamId: 't10', placement: 10, kills: 2, bonusPoints: 0 },
          { teamId: 't11', placement: 11, kills: 0, bonusPoints: 0 },
          { teamId: 't12', placement: 12, kills: 1, bonusPoints: 0 },
        ],
      },
      {
        id: 'm2',
        matchNumber: 2,
        map: 'Purgatory',
        playedAt: '2026-11-18T14:40:00.000Z',
        notes: 'Brasilias final zone — GRD clutch 3v4',
        results: [
          { teamId: 't2', placement: 1, kills: 10, bonusPoints: 0 },
          { teamId: 't3', placement: 2, kills: 9, bonusPoints: 0 },
          { teamId: 't4', placement: 3, kills: 6, bonusPoints: 0 },
          { teamId: 't1', placement: 4, kills: 4, bonusPoints: 0 },
          { teamId: 't6', placement: 5, kills: 5, bonusPoints: 0 },
          { teamId: 't7', placement: 6, kills: 4, bonusPoints: 0 },
          { teamId: 't5', placement: 7, kills: 3, bonusPoints: 0 },
          { teamId: 't9', placement: 8, kills: 2, bonusPoints: 0 },
          { teamId: 't8', placement: 9, kills: 3, bonusPoints: 0 },
          { teamId: 't11', placement: 10, kills: 1, bonusPoints: 0 },
          { teamId: 't12', placement: 11, kills: 2, bonusPoints: 0 },
          { teamId: 't10', placement: 12, kills: 0, bonusPoints: 0 },
        ],
      },
      {
        id: 'm3',
        matchNumber: 3,
        map: 'Kalahari',
        playedAt: '2026-11-18T15:20:00.000Z',
        notes: 'Refinery finish',
        results: [
          { teamId: 't3', placement: 1, kills: 12, bonusPoints: 0 },
          { teamId: 't5', placement: 2, kills: 7, bonusPoints: 0 },
          { teamId: 't1', placement: 3, kills: 6, bonusPoints: 0 },
          { teamId: 't2', placement: 5, kills: 4, bonusPoints: 0 },
          { teamId: 't4', placement: 4, kills: 5, bonusPoints: 0 },
          { teamId: 't8', placement: 6, kills: 6, bonusPoints: 0 },
          { teamId: 't6', placement: 7, kills: 3, bonusPoints: 0 },
          { teamId: 't10', placement: 8, kills: 4, bonusPoints: 0 },
          { teamId: 't7', placement: 9, kills: 2, bonusPoints: 0 },
          { teamId: 't12', placement: 10, kills: 1, bonusPoints: 0 },
          { teamId: 't9', placement: 11, kills: 1, bonusPoints: 0 },
          { teamId: 't11', placement: 12, kills: 0, bonusPoints: 0 },
        ],
      },
    ],
    broadcastConfig: {
      theme: 'obsidian',
      showMatchesPlayed: true,
      showBooyahs: true,
      showPlacementPts: true,
      showKillPts: true,
      showBonusPts: false,
      showAvgPts: false,
      footerNote: 'Top 4 teams advance to Grand Finals · Official Standings',
    },
    updatedAt: '2026-11-18T15:20:00.000Z',
  };
}

export function createBlankTournament(
  name: string,
  organizationName: string,
  subtitle = 'Custom Lobby'
): Tournament {
  return {
    id: `tourney-${Date.now()}`,
    name: name.trim(),
    organizationName: organizationName.trim(),
    subtitle: subtitle.trim(),
    accentColor: '#EA580C',
    scoringRules: cloneScoringRules(SCORING_PRESETS[0].rules),
    teams: [],
    matches: [],
    broadcastConfig: {
      theme: 'obsidian',
      showMatchesPlayed: true,
      showBooyahs: true,
      showPlacementPts: true,
      showKillPts: true,
      showBonusPts: false,
      showAvgPts: false,
      footerNote: 'Official Tournament Standings',
    },
    updatedAt: new Date().toISOString(),
  };
}
