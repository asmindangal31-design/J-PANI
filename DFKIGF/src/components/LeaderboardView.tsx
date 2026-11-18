import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ClipboardPlus,
  Minus,
  Pencil,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react';
import { LeaderboardResult, MatchRecord, Tournament } from '../types/tournament';
import { calculateMatchTeamPoints, formatPts } from '../utils/scoring';

interface LeaderboardViewProps {
  tournament: Tournament;
  leaderboard: LeaderboardResult;
  onLogMatch: () => void;
  onEditMatch: (matchId: string) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenTeams: () => void;
  onOpenStudio: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  tournament,
  leaderboard,
  onLogMatch,
  onEditMatch,
  onDeleteMatch,
  onOpenTeams,
  onOpenStudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('overall');

  const orderedMatches = useMemo(
    () => [...tournament.matches].sort((a, b) => a.matchNumber - b.matchNumber),
    [tournament.matches]
  );

  const selectedMatch: MatchRecord | undefined = useMemo(
    () => orderedMatches.find((m) => m.id === selectedMatchId),
    [orderedMatches, selectedMatchId]
  );

  const filteredOverall = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leaderboard.standings;
    return leaderboard.standings.filter(
      (s) =>
        s.team.name.toLowerCase().includes(q) ||
        s.team.tag.toLowerCase().includes(q) ||
        (s.team.captain && s.team.captain.toLowerCase().includes(q))
    );
  }, [leaderboard.standings, searchQuery]);

  const singleMatchRows = useMemo(() => {
    if (!selectedMatch) return [];
    const teamMap = new Map(tournament.teams.map((t) => [t.id, t]));
    const q = searchQuery.trim().toLowerCase();

    return selectedMatch.results
      .map((res) => {
        const team = teamMap.get(res.teamId);
        if (!team) return null;
        const pts = calculateMatchTeamPoints(res, tournament.scoringRules);
        return {
          team,
          placement: res.placement,
          kills: res.kills,
          ...pts,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => {
        if (!q) return true;
        return (
          item.team.name.toLowerCase().includes(q) || item.team.tag.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.placement === null && b.placement === null) return b.totalPoints - a.totalPoints;
        if (a.placement === null) return 1;
        if (b.placement === null) return -1;
        return a.placement - b.placement;
      });
  }, [selectedMatch, tournament.teams, tournament.scoringRules, searchQuery]);

  if (tournament.teams.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
        <Trophy className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" />
        <h2 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
          Add teams to begin tracking points
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Register your lobby squads individually or paste a full 12-team roster, then log match
          results to automate the leaderboard.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenTeams}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            Add Teams to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Leader</p>
          <p className="mt-1.5 font-display text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
            {leaderboard.leader ? leaderboard.leader.team.name : 'No matches yet'}
          </p>
          <p className="mt-0.5 font-mono text-xs text-orange-600 dark:text-orange-400">
            {leaderboard.leader
              ? `${formatPts(leaderboard.leader.totalPoints)} pts · ${leaderboard.leader.booyahs} Booyah`
              : 'Log match 1 to rank'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Matches Completed</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
            {leaderboard.totalMatches}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {leaderboard.totalTeams} registered squads
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Top Eliminations</p>
          <p className="mt-1.5 font-display text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
            {leaderboard.topEliminator ? leaderboard.topEliminator.team.name : '—'}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
            {leaderboard.topEliminator
              ? `${leaderboard.topEliminator.kills} kills (${leaderboard.totalEliminations} lobby total)`
              : '0 eliminations recorded'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Scoring</p>
          <p className="mt-1.5 font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatPts(tournament.scoringRules.placementPoints[1] ?? 0)} /{' '}
            {formatPts(tournament.scoringRules.pointsPerKill)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            1st place pts / pts per kill
          </p>
        </div>
      </div>

      {/* Filter & Match Scope Bar */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 p-4 border-b border-slate-200 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedMatchId('overall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selectedMatchId === 'overall'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              Overall Standings
            </button>
            {orderedMatches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMatchId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedMatchId === m.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                M{m.matchNumber} · {m.map}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Filter teams by name or tag"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team or tag..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={onOpenStudio}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Export Table
            </button>
          </div>
        </div>

        {/* Overall Leaderboard Table */}
        {selectedMatchId === 'overall' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="leaderboard-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="py-3 pl-4 pr-2 w-20">Rank</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3 text-right">MP</th>
                  <th className="py-3 px-3 text-right">Booyah</th>
                  <th className="py-3 px-3 text-right">Place Pts</th>
                  <th className="py-3 px-3 text-right">Kills</th>
                  <th className="py-3 px-3 text-right">Kill Pts</th>
                  <th className="py-3 px-3 text-right">Bonus</th>
                  <th className="py-3 px-3 text-right">Avg</th>
                  <th className="py-3 pl-3 pr-4 text-right">Total Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredOverall.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No teams match "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredOverall.map((row) => (
                    <tr
                      key={row.team.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              row.rank === 1
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }
                          >
                            #{String(row.rank).padStart(2, '0')}
                          </span>
                          {row.rankDelta !== null && row.rankDelta > 0 && (
                            <span
                              title={`Moved up ${row.rankDelta}`}
                              className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400"
                            >
                              <ArrowUp className="h-3 w-3" />
                              {row.rankDelta}
                            </span>
                          )}
                          {row.rankDelta !== null && row.rankDelta < 0 && (
                            <span
                              title={`Moved down ${Math.abs(row.rankDelta)}`}
                              className="inline-flex items-center text-xs text-red-600 dark:text-red-400"
                            >
                              <ArrowDown className="h-3 w-3" />
                              {Math.abs(row.rankDelta)}
                            </span>
                          )}
                          {row.rankDelta === 0 && (
                            <span
                              title="Rank unchanged"
                              className="inline-flex items-center text-xs text-slate-400"
                            >
                              <Minus className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-[140px]">
                          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {row.team.tag}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.team.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {row.matchesPlayed}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {row.booyahs}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-200">
                        {formatPts(row.placementPoints)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {row.kills}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-200">
                        {formatPts(row.killPoints)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                        {row.bonusPoints === 0 ? '—' : formatPts(row.bonusPoints)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                        {formatPts(row.averagePoints)}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                        {formatPts(row.totalPoints)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Single Match Breakdown Table */
          <div className="overflow-x-auto">
            {selectedMatch && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-200 dark:bg-slate-800/30 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Match {selectedMatch.matchNumber} · {selectedMatch.map}
                  </span>
                  {selectedMatch.notes && (
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      — {selectedMatch.notes}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onEditMatch(selectedMatch.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 whitespace-nowrap"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Match
                </button>
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="py-3 pl-4 pr-2 w-24">Finish</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3 text-right">Place Pts</th>
                  <th className="py-3 px-3 text-right">Kills</th>
                  <th className="py-3 px-3 text-right">Kill Pts</th>
                  <th className="py-3 px-3 text-right">Bonus</th>
                  <th className="py-3 pl-3 pr-4 text-right">Match Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {singleMatchRows.map((row) => (
                  <tr
                    key={row.team.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 pl-4 pr-2 font-mono font-semibold">
                      {row.placement === null ? (
                        <span className="text-slate-400">DNP</span>
                      ) : row.placement === 1 ? (
                        <span className="text-orange-600 dark:text-orange-400">#01 Booyah</span>
                      ) : (
                        <span className="text-slate-900 dark:text-slate-100">
                          #{String(row.placement).padStart(2, '0')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {row.team.tag}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {row.team.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-200">
                      {formatPts(row.placementPoints)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {row.kills}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-200">
                      {formatPts(row.killPoints)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {row.bonusPoints === 0 ? '—' : formatPts(row.bonusPoints)}
                    </td>
                    <td className="py-2.5 pl-3 pr-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatPts(row.totalPoints)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Match Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Logged Matches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Editing or deleting any match recalculates the overall table immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogMatch}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0"
          >
            <ClipboardPlus className="h-3.5 w-3.5" />
            Log Match {orderedMatches.length + 1}
          </button>
        </div>

        {orderedMatches.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No matches logged yet. Click "Log Match 1" to record placements and kills.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {orderedMatches.map((match) => {
              const winnerRes = match.results.find((r) => r.placement === 1);
              const winnerTeam = tournament.teams.find((t) => t.id === winnerRes?.teamId);
              const totalKills = match.results.reduce((acc, r) => acc + r.kills, 0);

              return (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <span className="font-mono">Match {match.matchNumber}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span>{match.map}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span className="font-normal text-slate-600 dark:text-slate-300 truncate">
                        Booyah: {winnerTeam ? `${winnerTeam.name} (${winnerRes?.kills ?? 0} kills)` : '—'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {totalKills} total eliminations
                      {match.notes ? ` · ${match.notes}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditMatch(match.id)}
                      aria-label={`Edit Match ${match.matchNumber}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMatchId === match.id) {
                          setSelectedMatchId('overall');
                        }
                        onDeleteMatch(match.id);
                      }}
                      aria-label={`Delete Match ${match.matchNumber}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
