import React from 'react';
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import {
  cloneScoringRules,
  SCORING_PRESETS,
  TIEBREAKER_LABELS,
} from '../data/presets';
import { ScoringRules, TiebreakerCriterion } from '../types/tournament';
import { formatPts } from '../utils/scoring';

interface ScoringRulesViewProps {
  rules: ScoringRules;
  onChangeRules: (nextRules: ScoringRules) => void;
}

export const ScoringRulesView: React.FC<ScoringRulesViewProps> = ({
  rules,
  onChangeRules,
}) => {
  const applyPreset = (presetId: string) => {
    const found = SCORING_PRESETS.find((p) => p.id === presetId);
    if (found) {
      onChangeRules(cloneScoringRules(found.rules));
    }
  };

  const updatePlacementPoint = (rank: number, value: number) => {
    onChangeRules({
      ...rules,
      presetId: 'custom',
      placementPoints: {
        ...rules.placementPoints,
        [rank]: Number.isFinite(value) ? value : 0,
      },
    });
  };

  const moveTiebreaker = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rules.tiebreakers.length) return;
    const next = [...rules.tiebreakers];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChangeRules({
      ...rules,
      presetId: 'custom',
      tiebreakers: next,
    });
  };

  const handleLinearFill = () => {
    const nextMap: Record<number, number> = { ...rules.placementPoints };
    const topPts = nextMap[1] ?? 12;
    for (let rank = 1; rank <= rules.maxTeamsPerLobby; rank += 1) {
      nextMap[rank] = Math.max(0, topPts - (rank - 1));
    }
    onChangeRules({
      ...rules,
      presetId: 'custom',
      placementPoints: nextMap,
    });
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Scoring Presets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Start from a standard Free Fire tournament format or customize every placement and
            elimination rule below. Changes recalculate your leaderboard automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {SCORING_PRESETS.map((preset) => {
            const isSelected = rules.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  isSelected
                    ? 'border-orange-600 bg-orange-50/60 dark:border-orange-500 dark:bg-orange-950/20'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {preset.summary}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multipliers & Lobby Size */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                Placement & Elimination Points
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure exact points for each match rank and per elimination.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLinearFill}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                Auto-Step (-1 per rank)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ffws-standard')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset FFWS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <label
                htmlFor="points-per-kill-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Points per Kill
              </label>
              <input
                id="points-per-kill-input"
                type="number"
                step="0.5"
                min={0}
                max={20}
                value={rules.pointsPerKill}
                onChange={(e) =>
                  onChangeRules({
                    ...rules,
                    presetId: 'custom',
                    pointsPerKill: Math.max(0, parseFloat(e.target.value || '0') || 0),
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="booyah-bonus-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Extra Booyah Bonus
              </label>
              <input
                id="booyah-bonus-input"
                type="number"
                step="0.5"
                min={0}
                max={50}
                value={rules.booyahBonus}
                onChange={(e) =>
                  onChangeRules({
                    ...rules,
                    presetId: 'custom',
                    booyahBonus: Math.max(0, parseFloat(e.target.value || '0') || 0),
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="max-lobby-teams-select"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Lobby Slots (Ranks)
              </label>
              <select
                id="max-lobby-teams-select"
                value={rules.maxTeamsPerLobby}
                onChange={(e) =>
                  onChangeRules({
                    ...rules,
                    presetId: 'custom',
                    maxTeamsPerLobby: parseInt(e.target.value, 10),
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {[8, 10, 12, 14, 16].map((n) => (
                  <option key={n} value={n}>
                    {n} Teams
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: rules.maxTeamsPerLobby }, (_, idx) => idx + 1).map((rank) => (
              <div
                key={rank}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <label
                  htmlFor={`rank-pts-${rank}`}
                  className={`font-mono text-xs font-semibold ${
                    rank === 1
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  #{String(rank).padStart(2, '0')} {rank === 1 ? 'Booyah' : ''}
                </label>
                <input
                  id={`rank-pts-${rank}`}
                  type="number"
                  step="0.5"
                  min={0}
                  max={100}
                  value={rules.placementPoints[rank] ?? 0}
                  onChange={(e) =>
                    updatePlacementPoint(rank, parseFloat(e.target.value || '0') || 0)
                  }
                  className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Example: A Booyah (#1) with 8 kills awards{' '}
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {formatPts(
                (rules.placementPoints[1] ?? 0) + rules.booyahBonus + 8 * rules.pointsPerKill
              )}{' '}
              pts
            </span>{' '}
            ({formatPts((rules.placementPoints[1] ?? 0) + rules.booyahBonus)} placement +{' '}
            {formatPts(8 * rules.pointsPerKill)} kills).
          </p>
        </div>

        {/* Tiebreaker Priority */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Tiebreaker Order
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              When two squads share identical total points, ranks break in this top-to-bottom order.
            </p>
          </div>

          <ol className="mt-4 space-y-2">
            {rules.tiebreakers.map((criterion: TiebreakerCriterion, idx: number) => (
              <li
                key={criterion}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-semibold text-slate-400">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {TIEBREAKER_LABELS[criterion]}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveTiebreaker(idx, -1)}
                    aria-label={`Move ${TIEBREAKER_LABELS[criterion]} up`}
                    className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === rules.tiebreakers.length - 1}
                    onClick={() => moveTiebreaker(idx, 1)}
                    aria-label={`Move ${TIEBREAKER_LABELS[criterion]} down`}
                    className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
