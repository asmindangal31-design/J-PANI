import React from 'react';
import {
  Award,
  Calculator,
  ClipboardPlus,
  LayoutGrid,
  Moon,
  Plus,
  Sun,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { Tournament } from '../types/tournament';

export type WorkspaceTab =
  | 'leaderboard'
  | 'match-entry'
  | 'scoring-rules'
  | 'teams'
  | 'studio';

interface SidebarProps {
  tournaments: Tournament[];
  activeTournament: Tournament;
  activeTab: WorkspaceTab;
  theme: 'light' | 'dark';
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectTournament: (id: string) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenNewTournament: () => void;
  onToggleTheme: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'match-entry', label: 'Log Match', icon: ClipboardPlus },
  { id: 'scoring-rules', label: 'Scoring Rules', icon: Calculator },
  { id: 'teams', label: 'Teams & Roster', icon: Users },
  { id: 'studio', label: 'Points Table Studio', icon: LayoutGrid },
];

export const Sidebar: React.FC<SidebarProps> = ({
  tournaments,
  activeTournament,
  activeTab,
  theme,
  mobileOpen,
  onCloseMobile,
  onSelectTournament,
  onSelectTab,
  onOpenNewTournament,
  onToggleTheme,
}) => {
  const content = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: activeTournament.accentColor }}
              aria-hidden="true"
            >
              <Award className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
              BooyahDesk
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="tournament-switcher"
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Active Tournament
            </label>
            <button
              type="button"
              onClick={onOpenNewTournament}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          <select
            id="tournament-switcher"
            value={activeTournament.id}
            onChange={(e) => onSelectTournament(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            {activeTournament.organizationName} · {activeTournament.teams.length} teams
          </p>
        </div>

        <nav aria-label="Workspace sections" className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={theme === 'dark'}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>Dark Mode</span>
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? 'On' : 'Off'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen w-64 shrink-0">{content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">{content}</aside>
        </div>
      )}
    </>
  );
};
