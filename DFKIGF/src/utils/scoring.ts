import {
  LeaderboardResult,
  MatchRecord,
  MatchTeamResult,
  MatchValidationError,
  ScoringRules,
  Team,
  TeamStanding,
  TiebreakerCriterion,
  Tournament,
} from '../types/tournament';

export function roundPts(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatPts(value: number): string {
  const rounded = roundPts(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export interface ComputedMatchTeamPoints {
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  totalPoints: number;
  isBooyah: boolean;
}

export function calculateMatchTeamPoints(
  result: MatchTeamResult,
  rules: ScoringRules
): ComputedMatchTeamPoints {
  const kills = Math.max(0, result.kills);
  const killPoints = roundPts(kills * rules.pointsPerKill);

  if (result.placement === null) {
    return {
      placementPoints: 0,
      killPoints,
      bonusPoints: roundPts(result.bonusPoints),
      totalPoints: roundPts(killPoints + result.bonusPoints),
      isBooyah: false,
    };
  }

  const basePlacement = rules.placementPoints[result.placement] ?? 0;
  const isBooyah = result.placement === 1;
  const booyahExtra = isBooyah ? rules.booyahBonus : 0;
  const placementPoints = roundPts(basePlacement + booyahExtra);
  const bonusPoints = roundPts(result.bonusPoints);

  return {
    placementPoints,
    killPoints,
    bonusPoints,
    totalPoints: roundPts(placementPoints + killPoints + bonusPoints),
    isBooyah,
  };
}

function compareCriterion(
  a: TeamStanding,
  b: TeamStanding,
  criterion: TiebreakerCriterion
): number {
  switch (criterion) {
    case 'booyahs':
      return b.booyahs - a.booyahs;
    case 'placementPoints':
      return b.placementPoints - a.placementPoints;
    case 'killPoints':
      return b.killPoints - a.killPoints;
    case 'bestMatchRank': {
      const rankA = a.bestPlacement ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.bestPlacement ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    }
    case 'teamName':
      return a.team.name.localeCompare(b.team.name);
    default:
      return 0;
  }
}

export function sortStandings(
  standings: TeamStanding[],
  tiebreakers: TiebreakerCriterion[]
): TeamStanding[] {
  const sorted = [...standings].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    for (const criterion of tiebreakers) {
      const diff = compareCriterion(a, b, criterion);
      if (diff !== 0) {
        return diff;
      }
    }
    return a.team.name.localeCompare(b.team.name);
  });

  return sorted.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

function computeRawStandings(
  teams: Team[],
  matches: MatchRecord[],
  rules: ScoringRules
): TeamStanding[] {
  const orderedMatches = [...matches].sort((a, b) => a.matchNumber - b.matchNumber);
  const lastMatch = orderedMatches.length > 0 ? orderedMatches[orderedMatches.length - 1] : null;

  const list: TeamStanding[] = teams.map((team) => {
    let matchesPlayed = 0;
    let booyahs = 0;
    let placementPoints = 0;
    let killPoints = 0;
    let kills = 0;
    let bonusPoints = 0;
    let totalPoints = 0;
    let bestPlacement: number | null = null;
    let lastMatchPoints: number | null = null;

    for (const match of orderedMatches) {
      const res = match.results.find((r) => r.teamId === team.id);
      if (!res) {
        continue;
      }
      const participated = res.placement !== null;
      if (participated) {
        matchesPlayed += 1;
        if (bestPlacement === null || (res.placement !== null && res.placement < bestPlacement)) {
          bestPlacement = res.placement;
        }
      }

      const pts = calculateMatchTeamPoints(res, rules);
      if (pts.isBooyah) {
        booyahs += 1;
      }
      placementPoints = roundPts(placementPoints + pts.placementPoints);
      killPoints = roundPts(killPoints + pts.killPoints);
      kills += Math.max(0, res.kills);
      bonusPoints = roundPts(bonusPoints + pts.bonusPoints);
      totalPoints = roundPts(totalPoints + pts.totalPoints);

      if (lastMatch && match.id === lastMatch.id && (participated || pts.totalPoints !== 0)) {
        lastMatchPoints = pts.totalPoints;
      }
    }

    return {
      rank: 0,
      previousRank: null,
      rankDelta: null,
      team,
      matchesPlayed,
      booyahs,
      placementPoints,
      killPoints,
      kills,
      bonusPoints,
      totalPoints,
      averagePoints: matchesPlayed > 0 ? roundPts(totalPoints / matchesPlayed) : 0,
      bestPlacement,
      lastMatchPoints,
    };
  });

  return sortStandings(list, rules.tiebreakers);
}

export function calculateLeaderboard(tournament: Tournament): LeaderboardResult {
  const orderedMatches = [...tournament.matches].sort((a, b) => a.matchNumber - b.matchNumber);
  const current = computeRawStandings(tournament.teams, orderedMatches, tournament.scoringRules);

  let previousRankByTeamId = new Map<string, number>();
  if (orderedMatches.length >= 2) {
    const prevStandings = computeRawStandings(
      tournament.teams,
      orderedMatches.slice(0, -1),
      tournament.scoringRules
    );
    previousRankByTeamId = new Map(prevStandings.map((s) => [s.team.id, s.rank]));
  }

  const standings: TeamStanding[] = current.map((entry) => {
    const prevRank = previousRankByTeamId.get(entry.team.id) ?? null;
    const rankDelta = prevRank !== null ? prevRank - entry.rank : null;
    return {
      ...entry,
      previousRank: prevRank,
      rankDelta,
    };
  });

  const totalEliminations = standings.reduce((acc, s) => acc + s.kills, 0);
  const leader = standings.length > 0 && orderedMatches.length > 0 ? standings[0] : null;

  let topEliminator: TeamStanding | null = null;
  if (standings.length > 0 && totalEliminations > 0) {
    topEliminator = [...standings].sort((a, b) => b.kills - a.kills || a.rank - b.rank)[0];
  }

  return {
    standings,
    totalMatches: orderedMatches.length,
    totalTeams: tournament.teams.length,
    totalEliminations,
    leader,
    topEliminator,
  };
}

export function validateMatchResults(
  results: MatchTeamResult[],
  teams: Team[],
  maxTeamsPerLobby: number
): MatchValidationError[] {
  const errors: MatchValidationError[] = [];
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const seenPlacements = new Map<number, string[]>();
  let anyPlaced = false;

  for (const res of results) {
    const teamName = teamMap.get(res.teamId)?.name ?? res.teamId;

    if (res.kills < 0 || !Number.isInteger(res.kills)) {
      errors.push({
        field: `kills-${res.teamId}`,
        message: `${teamName}: kills must be a whole number 0 or higher.`,
      });
    }

    if (res.placement !== null) {
      anyPlaced = true;
      if (!Number.isInteger(res.placement) || res.placement < 1 || res.placement > maxTeamsPerLobby) {
        errors.push({
          field: `placement-${res.teamId}`,
          message: `${teamName}: placement must be between 1 and ${maxTeamsPerLobby}.`,
        });
      } else {
        const existing = seenPlacements.get(res.placement) ?? [];
        existing.push(teamName);
        seenPlacements.set(res.placement, existing);
      }
    }
  }

  for (const [rank, squadNames] of seenPlacements.entries()) {
    if (squadNames.length > 1) {
      errors.push({
        field: `duplicate-rank-${rank}`,
        message: `Rank #${rank} is assigned to multiple teams: ${squadNames.join(', ')}.`,
      });
    }
  }

  if (!anyPlaced) {
    errors.push({
      field: 'match-empty',
      message: 'Assign a placement rank to at least one team before saving the match.',
    });
  }

  return errors;
}

export function formatStandingsShareText(
  tournament: Tournament,
  leaderboard: LeaderboardResult
): string {
  const lines: string[] = [
    `${tournament.organizationName} — ${tournament.name}`,
    `${tournament.subtitle} (${leaderboard.totalMatches} ${leaderboard.totalMatches === 1 ? 'Match' : 'Matches'})`,
    '',
    'RANK | TEAM | BOOYAH | PLACE | KILLS | TOTAL',
  ];

  for (const row of leaderboard.standings) {
    const rankStr = String(row.rank).padStart(2, '0');
    const tagPart = row.team.tag ? `[${row.team.tag}] ` : '';
    lines.push(
      `#${rankStr} | ${tagPart}${row.team.name} | ${row.booyahs} | ${formatPts(row.placementPoints)} | ${formatPts(row.killPoints)} | ${formatPts(row.totalPoints)} pts`
    );
  }

  return lines.join('\n');
}

export function parseBulkTeamsInput(raw: string): Array<{ name: string; tag: string }> {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    // Supports "TAG, Team Name" or "Team Name, TAG" or "TAG | Team Name" or "Team Name | TAG"
    const separator = line.includes('|') ? '|' : line.includes(',') ? ',' : null;
    if (separator) {
      const [first, second] = line.split(separator).map((s) => s.trim());
      if (first && second) {
        if (first.length <= 5 && second.length > first.length) {
          return { name: second, tag: first.toUpperCase() };
        }
        return { name: first, tag: second.slice(0, 5).toUpperCase() };
      }
    }
    const words = line.split(/\s+/);
    const autoTag =
      words.length >= 2
        ? words
            .slice(0, 3)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
        : line.slice(0, 3).toUpperCase();
    return { name: line, tag: autoTag };
  });
}
