import { useEffect, useMemo, useState } from 'react';
import { ClipboardPlus, Menu, RotateCcw } from 'lucide-react';
import { LeaderboardView } from './components/LeaderboardView';
import { MatchEntryView } from './components/MatchEntryView';
import { NewTournamentModal } from './components/NewTournamentModal';
import { PointsTableStudioView } from './components/PointsTableStudioView';
import { ScoringRulesView } from './components/ScoringRulesView';
import { Sidebar, WorkspaceTab } from './components/Sidebar';
import { TeamsRosterView } from './components/TeamsRosterView';
import { createBlankTournament, createDemoTournament } from './data/presets';
import { FreeFireMap, MatchRecord, MatchTeamResult, ScoringRules, Team, Tournament } from './types/tournament';
import { calculateLeaderboard } from './utils/scoring';
import {
  loadThemePreference,
  loadWorkspace,
  saveThemePreference,
  saveWorkspace,
} from './utils/storage';

const SECTION_TITLES: Record<WorkspaceTab, string> = {
  leaderboard: 'Live Standings',
  'match-entry': 'Match Scorecard',
  'scoring-rules': 'Scoring Rules',
  teams: 'Teams & Roster',
  studio: 'Points Table Studio',
};

export default function App() {
  const initialWorkspace = useMemo(() => loadWorkspace(), []);
  const [tournaments, setTournaments] = useState<Tournament[]>(initialWorkspace.tournaments);
  const [activeTournamentId, setActiveTournamentId] = useState<string>(
    initialWorkspace.activeTournamentId
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('leaderboard');
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadThemePreference());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    saveWorkspace(tournaments, activeTournamentId);
  }, [tournaments, activeTournamentId]);

  const activeTournament = useMemo(() => {
    return tournaments.find((t) => t.id === activeTournamentId) ?? tournaments[0];
  }, [tournaments, activeTournamentId]);

  const leaderboard = useMemo(
    () => calculateLeaderboard(activeTournament),
    [activeTournament]
  );

  const editingMatch: MatchRecord | null = useMemo(() => {
    if (!editingMatchId) return null;
    return activeTournament.matches.find((m) => m.id === editingMatchId) ?? null;
  }, [activeTournament.matches, editingMatchId]);

  const updateActiveTournament = (updater: (prev: Tournament) => Tournament) => {
    setTournaments((prevList) =>
      prevList.map((t) =>
        t.id === activeTournament.id
          ? { ...updater(t), updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const handleSaveMatch = (payload: {
    id?: string;
    matchNumber: number;
    map: FreeFireMap;
    notes: string;
    results: MatchTeamResult[];
  }) => {
    updateActiveTournament((prev) => {
      if (payload.id) {
        return {
          ...prev,
          matches: prev.matches.map((m) =>
            m.id === payload.id
              ? {
                  ...m,
                  matchNumber: payload.matchNumber,
                  map: payload.map,
                  notes: payload.notes,
                  results: payload.results,
                }
              : m
          ),
        };
      }
      const newMatch: MatchRecord = {
        id: `match-${Date.now()}`,
        matchNumber: payload.matchNumber,
        map: payload.map,
        playedAt: new Date().toISOString(),
        notes: payload.notes,
        results: payload.results,
      };
      return {
        ...prev,
        matches: [...prev.matches, newMatch],
      };
    });
    setEditingMatchId(null);
    setActiveTab('leaderboard');
  };

  const handleDeleteMatch = (matchId: string) => {
    updateActiveTournament((prev) => ({
      ...prev,
      matches: prev.matches.filter((m) => m.id !== matchId),
    }));
  };

  const handleChangeRules = (nextRules: ScoringRules) => {
    updateActiveTournament((prev) => ({
      ...prev,
      scoringRules: nextRules,
    }));
  };

  const handleAddTeam = (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    updateActiveTournament((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }));
  };

  const handleBulkAddTeams = (items: Array<Omit<Team, 'id'>>) => {
    const created: Team[] = items.map((item, idx) => ({
      ...item,
      id: `team-${Date.now()}-${idx}`,
    }));
    updateActiveTournament((prev) => ({
      ...prev,
      teams: [...prev.teams, ...created],
    }));
  };

  const handleUpdateTeam = (updated: Team) => {
    updateActiveTournament((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === updated.id ? updated : t)),
    }));
  };

  const handleRemoveTeam = (teamId: string) => {
    updateActiveTournament((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => t.id !== teamId),
      matches: prev.matches.map((m) => ({
        ...m,
        results: m.results.filter((r) => r.teamId !== teamId),
      })),
    }));
  };

  const handleCreateTournament = (payload: {
    name: string;
    organizationName: string;
    subtitle: string;
    seedDemoTeams: boolean;
  }) => {
    const created = createBlankTournament(
      payload.name,
      payload.organizationName,
      payload.subtitle
    );
    if (payload.seedDemoTeams) {
      created.teams = Array.from({ length: 12 }, (_, idx) => ({
        id: `slot-${Date.now()}-${idx + 1}`,
        name: `Squad Slot ${idx + 1}`,
        tag: `S${String(idx + 1).padStart(2, '0')}`,
      }));
    }
    setTournaments((prev) => [created, ...prev]);
    setActiveTournamentId(created.id);
    setEditingMatchId(null);
    setActiveTab(payload.seedDemoTeams ? 'leaderboard' : 'teams');
  };

  const handleImportTournament = (imported: Tournament) => {
    setTournaments((prev) => [imported, ...prev]);
    setActiveTournamentId(imported.id);
    setEditingMatchId(null);
    setActiveTab('leaderboard');
  };

  const handleResetDemo = () => {
    const demo = createDemoTournament();
    setTournaments((prev) => {
      const rest = prev.filter((t) => t.id !== demo.id);
      return [demo, ...rest];
    });
    setActiveTournamentId(demo.id);
    setEditingMatchId(null);
    setActiveTab('leaderboard');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        tournaments={tournaments}
        activeTournament={activeTournament}
        activeTab={activeTab}
        theme={theme}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectTournament={(id) => {
          setActiveTournamentId(id);
          setEditingMatchId(null);
        }}
        onSelectTab={(tab) => {
          if (tab !== 'match-entry') {
            setEditingMatchId(null);
          }
          setActiveTab(tab);
        }}
        onOpenNewTournament={() => setNewModalOpen(true)}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, 1 primary action on right */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-6 h-16 px-4 sm:px-6 bg-white/95 backdrop-blur border-b border-slate-200 dark:bg-slate-900/95 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                {activeTournament.organizationName}
              </span>
              <span
                aria-hidden="true"
                className="hidden sm:inline text-slate-300 dark:text-slate-600"
              >
                /
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                {activeTournament.name}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                /
              </span>
              <h1 className="font-display font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {activeTab === 'match-entry' && editingMatch
                  ? `Edit Match ${editingMatch.matchNumber}`
                  : SECTION_TITLES[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingMatchId(null);
                setActiveTab('match-entry');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0"
            >
              <ClipboardPlus className="h-4 w-4" />
              <span>Log Match</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'leaderboard' && (
            <LeaderboardView
              tournament={activeTournament}
              leaderboard={leaderboard}
              onLogMatch={() => {
                setEditingMatchId(null);
                setActiveTab('match-entry');
              }}
              onEditMatch={(matchId) => {
                setEditingMatchId(matchId);
                setActiveTab('match-entry');
              }}
              onDeleteMatch={handleDeleteMatch}
              onOpenTeams={() => setActiveTab('teams')}
              onOpenStudio={() => setActiveTab('studio')}
            />
          )}

          {activeTab === 'match-entry' && (
            <MatchEntryView
              tournament={activeTournament}
              editingMatch={editingMatch}
              onSaveMatch={handleSaveMatch}
              onCancel={() => {
                setEditingMatchId(null);
                setActiveTab('leaderboard');
              }}
              onOpenTeams={() => setActiveTab('teams')}
            />
          )}

          {activeTab === 'scoring-rules' && (
            <ScoringRulesView
              rules={activeTournament.scoringRules}
              onChangeRules={handleChangeRules}
            />
          )}

          {activeTab === 'teams' && (
            <TeamsRosterView
              teams={activeTournament.teams}
              onAddTeam={handleAddTeam}
              onBulkAddTeams={handleBulkAddTeams}
              onUpdateTeam={handleUpdateTeam}
              onRemoveTeam={handleRemoveTeam}
            />
          )}

          {activeTab === 'studio' && (
            <PointsTableStudioView
              tournament={activeTournament}
              leaderboard={leaderboard}
              onUpdateTournamentMeta={(patch) =>
                updateActiveTournament((prev) => ({
                  ...prev,
                  ...patch,
                }))
              }
              onImportTournament={handleImportTournament}
            />
          )}
        </main>

        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {activeTournament.organizationName} · Free Fire Tournament Points & Standings Manager
          </span>
          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Demo Tournament
          </button>
        </footer>
      </div>

      <NewTournamentModal
        open={newModalOpen}
        defaultOrgName={activeTournament.organizationName}
        onClose={() => setNewModalOpen(false)}
        onCreate={handleCreateTournament}
      />
    </div>
  );
}
