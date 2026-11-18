import React, { useRef, useState } from 'react';
import { Check, Copy, Download, FileJson, Upload } from 'lucide-react';
import { ORG_ACCENT_OPTIONS } from '../data/presets';
import { BroadcastConfig, BroadcastTheme, LeaderboardResult, Tournament } from '../types/tournament';
import { exportPointsTablePng } from '../utils/canvasExport';
import { formatPts, formatStandingsShareText } from '../utils/scoring';
import { isValidTournamentPayload } from '../utils/storage';

interface PointsTableStudioViewProps {
  tournament: Tournament;
  leaderboard: LeaderboardResult;
  onUpdateTournamentMeta: (patch: Partial<Tournament>) => void;
  onImportTournament: (imported: Tournament) => void;
}

export const PointsTableStudioView: React.FC<PointsTableStudioViewProps> = ({
  tournament,
  leaderboard,
  onUpdateTournamentMeta,
  onImportTournament,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { broadcastConfig } = tournament;

  const updateBroadcast = (patch: Partial<BroadcastConfig>) => {
    onUpdateTournamentMeta({
      broadcastConfig: {
        ...broadcastConfig,
        ...patch,
      },
    });
  };

  const handleCopyShareText = async () => {
    const text = formatStandingsShareText(tournament, leaderboard);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Fallback copy via textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(tournament, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `${slug || 'tournament'}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isValidTournamentPayload(parsed)) {
          setImportError('Invalid tournament JSON format.');
          return;
        }
        setImportError('');
        onImportTournament({
          ...parsed,
          id: `tourney-${Date.now()}`,
        });
      } catch {
        setImportError('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cardPalette =
    broadcastConfig.theme === 'paper'
      ? {
          bg: 'bg-white text-slate-900 border-slate-200',
          headerBg: 'bg-slate-900 text-white',
          rowAlt: 'bg-slate-50',
          muted: 'text-slate-500',
          border: 'border-slate-200',
        }
      : broadcastConfig.theme === 'slate'
        ? {
            bg: 'bg-slate-900 text-slate-100 border-slate-700',
            headerBg: 'bg-slate-950 text-slate-200',
            rowAlt: 'bg-slate-800/40',
            muted: 'text-slate-400',
            border: 'border-slate-800',
          }
        : {
            bg: 'bg-zinc-950 text-zinc-100 border-zinc-800',
            headerBg: 'bg-zinc-900 text-zinc-200',
            rowAlt: 'bg-zinc-900/50',
            muted: 'text-zinc-400',
            border: 'border-zinc-800',
          };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Studio Customization Controls */}
      <div className="xl:col-span-4 space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Organization Branding
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tailor the tournament header and export card for your organization.
            </p>
          </div>

          <div>
            <label
              htmlFor="org-name-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Organization Name
            </label>
            <input
              id="org-name-input"
              type="text"
              value={tournament.organizationName}
              onChange={(e) => onUpdateTournamentMeta({ organizationName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="tourney-title-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Tournament Title
            </label>
            <input
              id="tourney-title-input"
              type="text"
              value={tournament.name}
              onChange={(e) => onUpdateTournamentMeta({ name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="tourney-subtitle-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Stage / Group Subtitle
            </label>
            <input
              id="tourney-subtitle-input"
              type="text"
              value={tournament.subtitle}
              onChange={(e) => onUpdateTournamentMeta({ subtitle: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
              Brand Accent Color
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ORG_ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateTournamentMeta({ accentColor: opt.hex })}
                  aria-label={`Select ${opt.name} accent color`}
                  className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                    tournament.accentColor === opt.hex
                      ? 'border-slate-900 dark:border-white scale-105'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: opt.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Table Layout & Columns
          </h3>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
              Card Theme
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['obsidian', 'slate', 'paper'] as BroadcastTheme[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateBroadcast({ theme: mode })}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold capitalize transition-colors ${
                    broadcastConfig.theme === mode
                      ? 'border-orange-600 bg-orange-50 text-orange-700 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Visible Columns
            </span>
            {[
              { key: 'showMatchesPlayed', label: 'Matches Played (MP)' },
              { key: 'showBooyahs', label: 'Booyah Count' },
              { key: 'showPlacementPts', label: 'Placement Points' },
              { key: 'showKillPts', label: 'Kill Points' },
              { key: 'showBonusPts', label: 'Bonus / Penalty Points' },
              { key: 'showAvgPts', label: 'Average Points per Match' },
            ].map((col) => {
              const checked = Boolean(broadcastConfig[col.key as keyof BroadcastConfig]);
              return (
                <label
                  key={col.key}
                  className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer py-1"
                >
                  <span>{col.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      updateBroadcast({ [col.key]: e.target.checked } as Partial<BroadcastConfig>)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                </label>
              );
            })}
          </div>

          <div>
            <label
              htmlFor="broadcast-footer-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Footer Note
            </label>
            <input
              id="broadcast-footer-input"
              type="text"
              value={broadcastConfig.footerNote}
              onChange={(e) => updateBroadcast({ footerNote: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Backup / Restore JSON */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Tournament Data Ownership
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <FileJson className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" />
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              className="hidden"
              aria-label="Import tournament JSON file"
            />
          </div>
          {importError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {importError}
            </p>
          )}
        </div>
      </div>

      {/* Live Broadcast Card Preview & Export Actions */}
      <div className="xl:col-span-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Live 16:9 Broadcast Preview · Updates automatically with every match
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareText}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedText ? 'Copied Summary' : 'Copy WhatsApp / Discord Text'}
            </button>
            <button
              type="button"
              onClick={() => exportPointsTablePng(tournament, leaderboard)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Download 1080p PNG
            </button>
          </div>
        </div>

        {/* Rendered Points Table Card */}
        <div
          data-testid="broadcast-preview-card"
          className={`rounded-xl border overflow-hidden ${cardPalette.bg}`}
        >
          <div className="h-2 w-full" style={{ backgroundColor: tournament.accentColor }} />
          <div className="p-6 space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className="font-display text-xs font-bold tracking-wider uppercase"
                  style={{ color: tournament.accentColor }}
                >
                  {tournament.organizationName}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">
                  {tournament.name}
                </h3>
                <p className={`mt-0.5 text-xs ${cardPalette.muted}`}>
                  {tournament.subtitle} · {leaderboard.totalMatches}{' '}
                  {leaderboard.totalMatches === 1 ? 'Match' : 'Matches'} · Overall Standings
                </p>
              </div>
              <div className={`font-mono text-xs ${cardPalette.muted}`}>
                1st: {formatPts(tournament.scoringRules.placementPoints[1] ?? 0)} pts | Kill:{' '}
                {formatPts(tournament.scoringRules.pointsPerKill)} pt
              </div>
            </div>

            <div className={`rounded-lg border overflow-x-auto ${cardPalette.border}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`font-mono text-[11px] font-semibold ${cardPalette.headerBg}`}>
                    <th className="py-2.5 pl-4 pr-2">RANK</th>
                    <th className="py-2.5 px-3">TEAM</th>
                    {broadcastConfig.showMatchesPlayed && (
                      <th className="py-2.5 px-3 text-right">MP</th>
                    )}
                    {broadcastConfig.showBooyahs && (
                      <th className="py-2.5 px-3 text-right">BOOYAH</th>
                    )}
                    {broadcastConfig.showPlacementPts && (
                      <th className="py-2.5 px-3 text-right">PLACE</th>
                    )}
                    {broadcastConfig.showKillPts && (
                      <th className="py-2.5 px-3 text-right">KILL PTS</th>
                    )}
                    {broadcastConfig.showBonusPts && (
                      <th className="py-2.5 px-3 text-right">BONUS</th>
                    )}
                    {broadcastConfig.showAvgPts && (
                      <th className="py-2.5 px-3 text-right">AVG</th>
                    )}
                    <th className="py-2.5 pl-3 pr-4 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${cardPalette.border}`}>
                  {leaderboard.standings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className={`py-8 text-center ${cardPalette.muted}`}>
                        Add teams and matches to preview your points table.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.standings.map((row, idx) => (
                      <tr key={row.team.id} className={idx % 2 === 1 ? cardPalette.rowAlt : ''}>
                        <td
                          className="py-2.5 pl-4 pr-2 font-mono font-bold"
                          style={row.rank === 1 ? { color: tournament.accentColor } : undefined}
                        >
                          #{String(row.rank).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-mono mr-2 ${cardPalette.muted}`}>
                            [{row.team.tag}]
                          </span>
                          <span className="font-semibold">{row.team.name}</span>
                        </td>
                        {broadcastConfig.showMatchesPlayed && (
                          <td className={`py-2.5 px-3 text-right font-mono ${cardPalette.muted}`}>
                            {row.matchesPlayed}
                          </td>
                        )}
                        {broadcastConfig.showBooyahs && (
                          <td
                            className="py-2.5 px-3 text-right font-mono font-semibold"
                            style={
                              row.booyahs > 0 ? { color: tournament.accentColor } : undefined
                            }
                          >
                            {row.booyahs}
                          </td>
                        )}
                        {broadcastConfig.showPlacementPts && (
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatPts(row.placementPoints)}
                          </td>
                        )}
                        {broadcastConfig.showKillPts && (
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatPts(row.killPoints)}
                          </td>
                        )}
                        {broadcastConfig.showBonusPts && (
                          <td className={`py-2.5 px-3 text-right font-mono ${cardPalette.muted}`}>
                            {formatPts(row.bonusPoints)}
                          </td>
                        )}
                        {broadcastConfig.showAvgPts && (
                          <td className={`py-2.5 px-3 text-right font-mono ${cardPalette.muted}`}>
                            {formatPts(row.averagePoints)}
                          </td>
                        )}
                        <td
                          className="py-2.5 pl-3 pr-4 text-right font-mono text-sm font-bold"
                          style={row.rank === 1 ? { color: tournament.accentColor } : undefined}
                        >
                          {formatPts(row.totalPoints)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={`flex items-center justify-between text-xs ${cardPalette.muted}`}>
              <span>{broadcastConfig.footerNote}</span>
              <span className="font-mono">{tournament.organizationName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
