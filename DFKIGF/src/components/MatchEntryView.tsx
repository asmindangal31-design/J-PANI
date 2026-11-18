import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, RotateCcw, Wand2 } from 'lucide-react';
import { FREE_FIRE_MAPS } from '../data/presets';
import { FreeFireMap, MatchRecord, MatchTeamResult, Tournament } from '../types/tournament';
import { calculateMatchTeamPoints, formatPts, validateMatchResults } from '../utils/scoring';

interface MatchEntryViewProps {
  tournament: Tournament;
  editingMatch: MatchRecord | null;
  onSaveMatch: (matchData: {
    id?: string;
    matchNumber: number;
    map: FreeFireMap;
    notes: string;
    results: MatchTeamResult[];
  }) => void;
  onCancel: () => void;
  onOpenTeams: () => void;
}

export const MatchEntryView: React.FC<MatchEntryViewProps> = ({
  tournament,
  editingMatch,
  onSaveMatch,
  onCancel,
  onOpenTeams,
}) => {
  const defaultMatchNumber = useMemo(() => {
    if (editingMatch) return editingMatch.matchNumber;
    const maxNum = tournament.matches.reduce((m, cur) => Math.max(m, cur.matchNumber), 0);
    return maxNum + 1;
  }, [editingMatch, tournament.matches]);

  const [matchNumber, setMatchNumber] = useState<number>(defaultMatchNumber);
  const [map, setMap] = useState<FreeFireMap>(editingMatch?.map ?? 'Bermuda');
  const [notes, setNotes] = useState<string>(editingMatch?.notes ?? '');
  const [results, setResults] = useState<MatchTeamResult[]>([]);
  const [submittedAttempt, setSubmittedAttempt] = useState(false);

  useEffect(() => {
    setMatchNumber(defaultMatchNumber);
    setMap(editingMatch?.map ?? 'Bermuda');
    setNotes(editingMatch?.notes ?? '');
    setSubmittedAttempt(false);

    const initial: MatchTeamResult[] = tournament.teams.map((team) => {
      const existing = editingMatch?.results.find((r) => r.teamId === team.id);
      return existing
        ? { ...existing }
        : {
            teamId: team.id,
            placement: null,
            kills: 0,
            bonusPoints: 0,
          };
    });
    setResults(initial);
  }, [editingMatch, tournament.teams, defaultMatchNumber]);

  const maxSlots = Math.max(tournament.scoringRules.maxTeamsPerLobby, tournament.teams.length);

  const validationErrors = useMemo(
    () => validateMatchResults(results, tournament.teams, maxSlots),
    [results, tournament.teams, maxSlots]
  );

  const duplicateRankSet = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of results) {
      if (r.placement !== null) {
        counts.set(r.placement, (counts.get(r.placement) ?? 0) + 1);
      }
    }
    const dups = new Set<number>();
    for (const [rank, count] of counts.entries()) {
      if (count > 1) dups.add(rank);
    }
    return dups;
  }, [results]);

  const updateRow = (teamId: string, patch: Partial<MatchTeamResult>) => {
    setResults((prev) =>
      prev.map((row) => (row.teamId === teamId ? { ...row, ...patch } : row))
    );
  };

  const handleAutoAssignRemaining = () => {
    const usedRanks = new Set<number>();
    for (const r of results) {
      if (r.placement !== null) usedRanks.add(r.placement);
    }
    let nextRank = 1;
    setResults((prev) =>
      prev.map((row) => {
        if (row.placement !== null) return row;
        while (usedRanks.has(nextRank) && nextRank <= maxSlots) {
          nextRank += 1;
        }
        if (nextRank <= maxSlots) {
          const assigned = nextRank;
          usedRanks.add(assigned);
          nextRank += 1;
          return { ...row, placement: assigned };
        }
        return row;
      })
    );
  };

  const handleResetScores = () => {
    setResults(
      tournament.teams.map((t) => ({
        teamId: t.id,
        placement: null,
        kills: 0,
        bonusPoints: 0,
      }))
    );
    setSubmittedAttempt(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedAttempt(true);
    if (validationErrors.length > 0) {
      return;
    }
    onSaveMatch({
      id: editingMatch?.id,
      matchNumber,
      map,
      notes: notes.trim(),
      results,
    });
  };

  if (tournament.teams.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
          No teams registered yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Add teams to your tournament roster before logging match placements and eliminations.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenTeams}
            className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            Go to Teams & Roster
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {editingMatch ? `Edit Match ${editingMatch.matchNumber}` : `Log Match ${matchNumber}`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter placement rank and kills for each squad. Points calculate live using your active
              ruleset.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoAssignRemaining}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Fill Remaining Ranks
            </button>
            <button
              type="button"
              onClick={handleResetScores}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Inputs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div>
            <label
              htmlFor="match-number-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              Match Number
            </label>
            <input
              id="match-number-input"
              type="number"
              min={1}
              max={99}
              value={matchNumber}
              onChange={(e) => setMatchNumber(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="match-map-select"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              Battle Royale Map
            </label>
            <select
              id="match-map-select"
              value={map}
              onChange={(e) => setMap(e.target.value as FreeFireMap)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {FREE_FIRE_MAPS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="match-notes-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              Match Notes (Optional)
            </label>
            <input
              id="match-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Final zone at Clock Tower"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {(submittedAttempt || duplicateRankSet.size > 0) && validationErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Fix the following before saving:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-xs">
                {validationErrors.map((err) => (
                  <li key={err.field}>{err.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="py-3 pl-4 pr-3">Squad</th>
                <th className="py-3 px-3 w-36">Placement</th>
                <th className="py-3 px-3 w-32">Kills</th>
                <th className="py-3 px-3 w-32">Bonus / Pen</th>
                <th className="py-3 px-3 text-right">Place Pts</th>
                <th className="py-3 px-3 text-right">Kill Pts</th>
                <th className="py-3 pl-3 pr-4 text-right">Match Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {tournament.teams.map((team) => {
                const row = results.find((r) => r.teamId === team.id) ?? {
                  teamId: team.id,
                  placement: null,
                  kills: 0,
                  bonusPoints: 0,
                };
                const computed = calculateMatchTeamPoints(row, tournament.scoringRules);
                const isDuplicate = row.placement !== null && duplicateRankSet.has(row.placement);

                return (
                  <tr
                    key={team.id}
                    className={
                      isDuplicate
                        ? 'bg-red-50/70 dark:bg-red-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }
                  >
                    <td className="py-2.5 pl-4 pr-3">
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {team.tag}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        aria-label={`Placement for ${team.name}`}
                        value={row.placement === null ? '' : String(row.placement)}
                        onChange={(e) =>
                          updateRow(team.id, {
                            placement: e.target.value === '' ? null : parseInt(e.target.value, 10),
                          })
                        }
                        className={`w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs font-medium focus:outline-none ${
                          isDuplicate
                            ? 'border-red-400 bg-white text-red-700 dark:border-red-700 dark:bg-slate-900 dark:text-red-300'
                            : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <option value="">DNP</option>
                        {Array.from({ length: maxSlots }, (_, i) => i + 1).map((rank) => (
                          <option key={rank} value={rank}>
                            #{rank} {rank === 1 ? '(Booyah)' : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        max={99}
                        aria-label={`Kills for ${team.name}`}
                        value={row.kills}
                        onChange={(e) =>
                          updateRow(team.id, {
                            kills: Math.max(0, parseInt(e.target.value || '0', 10)),
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.5"
                        aria-label={`Bonus or penalty points for ${team.name}`}
                        value={row.bonusPoints}
                        onChange={(e) =>
                          updateRow(team.id, {
                            bonusPoints: parseFloat(e.target.value || '0') || 0,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-200">
                      {formatPts(computed.placementPoints)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-200">
                      {formatPts(computed.killPoints)}
                    </td>
                    <td className="py-2.5 pl-3 pr-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatPts(computed.totalPoints)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 px-4 py-3.5 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            <Check className="h-4 w-4" />
            Save & Update Leaderboard
          </button>
        </div>
      </div>
    </form>
  );
};
