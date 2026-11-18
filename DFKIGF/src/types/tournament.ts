export type FreeFireMap =
  | 'Bermuda'
  | 'Purgatory'
  | 'Kalahari'
  | 'Alpine'
  | 'Nextera'
  | 'Solara';

export type TiebreakerCriterion =
  | 'booyahs'
  | 'placementPoints'
  | 'killPoints'
  | 'bestMatchRank'
  | 'teamName';

export type ScoringPresetId =
  | 'ffws-standard'
  | 'high-kill-scrims'
  | 'placement-heavy'
  | 'custom';

export interface ScoringRules {
  presetId: ScoringPresetId;
  maxTeamsPerLobby: number;
  pointsPerKill: number;
  booyahBonus: number;
  placementPoints: Record<number, number>;
  tiebreakers: TiebreakerCriterion[];
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  captain?: string;
}

export interface MatchTeamResult {
  teamId: string;
  placement: number | null;
  kills: number;
  bonusPoints: number;
}

export interface MatchRecord {
  id: string;
  matchNumber: number;
  map: FreeFireMap;
  playedAt: string;
  notes?: string;
  results: MatchTeamResult[];
}

export type BroadcastTheme = 'obsidian' | 'slate' | 'paper';

export interface BroadcastConfig {
  theme: BroadcastTheme;
  showMatchesPlayed: boolean;
  showBooyahs: boolean;
  showPlacementPts: boolean;
  showKillPts: boolean;
  showBonusPts: boolean;
  showAvgPts: boolean;
  footerNote: string;
}

export interface Tournament {
  id: string;
  name: string;
  organizationName: string;
  subtitle: string;
  accentColor: string;
  scoringRules: ScoringRules;
  teams: Team[];
  matches: MatchRecord[];
  broadcastConfig: BroadcastConfig;
  updatedAt: string;
}

export interface TeamStanding {
  rank: number;
  previousRank: number | null;
  rankDelta: number | null;
  team: Team;
  matchesPlayed: number;
  booyahs: number;
  placementPoints: number;
  killPoints: number;
  kills: number;
  bonusPoints: number;
  totalPoints: number;
  averagePoints: number;
  bestPlacement: number | null;
  lastMatchPoints: number | null;
}

export interface LeaderboardResult {
  standings: TeamStanding[];
  totalMatches: number;
  totalTeams: number;
  totalEliminations: number;
  leader: TeamStanding | null;
  topEliminator: TeamStanding | null;
}

export interface MatchValidationError {
  field: string;
  message: string;
}
