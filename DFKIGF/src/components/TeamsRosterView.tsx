import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { Team } from '../types/tournament';
import { parseBulkTeamsInput } from '../utils/scoring';

interface TeamsRosterViewProps {
  teams: Team[];
  onAddTeam: (team: Omit<Team, 'id'>) => void;
  onBulkAddTeams: (teams: Array<Omit<Team, 'id'>>) => void;
  onUpdateTeam: (team: Team) => void;
  onRemoveTeam: (teamId: string) => void;
}

export const TeamsRosterView: React.FC<TeamsRosterViewProps> = ({
  teams,
  onAddTeam,
  onBulkAddTeams,
  onUpdateTeam,
  onRemoveTeam,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [captain, setCaptain] = useState('');
  const [formError, setFormError] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editCaptain, setEditCaptain] = useState('');

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('Enter a team name before adding.');
      return;
    }
    const cleanTag =
      tag.trim().toUpperCase().slice(0, 5) ||
      cleanName
        .split(/\s+/)
        .slice(0, 3)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    onAddTeam({
      name: cleanName,
      tag: cleanTag,
      captain: captain.trim() || undefined,
    });
    setName('');
    setTag('');
    setCaptain('');
    setFormError('');
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseBulkTeamsInput(bulkText);
    if (parsed.length === 0) return;
    onBulkAddTeams(parsed);
    setBulkText('');
    setShowBulk(false);
  };

  const startEdit = (team: Team) => {
    setEditingId(team.id);
    setEditName(team.name);
    setEditTag(team.tag);
    setEditCaptain(team.captain ?? '');
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdateTeam({
      id: editingId,
      name: editName.trim(),
      tag: editTag.trim().toUpperCase().slice(0, 5),
      captain: editCaptain.trim() || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Team Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Register Squads ({teams.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add teams one by one or paste a full lobby list in bulk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBulk((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            {showBulk ? 'Hide Bulk Import' : 'Bulk Paste Teams'}
          </button>
        </div>

        {showBulk ? (
          <form onSubmit={handleBulkSubmit} className="pt-4 space-y-3">
            <div>
              <label
                htmlFor="bulk-teams-textarea"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                One team per line (supports "TAG | Team Name", "Team Name, TAG", or "Team Name")
              </label>
              <textarea
                id="bulk-teams-textarea"
                rows={5}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'NOVA | Nova Esports\nGRD | Garuda Five\nShadow Strikers'}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulk(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
              >
                Import Teams
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddSingle} className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label
                  htmlFor="new-team-name"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                >
                  Team Name
                </label>
                <input
                  id="new-team-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. Nova Esports"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="new-team-tag"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                >
                  Tag
                </label>
                <input
                  id="new-team-tag"
                  type="text"
                  maxLength={5}
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  placeholder="NOVA"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="new-team-captain"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                >
                  IGL / Captain (Optional)
                </label>
                <input
                  id="new-team-captain"
                  type="text"
                  value={captain}
                  onChange={(e) => setCaptain(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Add Team
                </button>
              </div>
            </div>
            {formError && (
              <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}
          </form>
        )}
      </div>

      {/* Team List */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {teams.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your roster is empty. Add teams above to start logging Free Fire matches.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="py-3 pl-4 pr-2 w-16">#</th>
                  <th className="py-3 px-3 w-24">Tag</th>
                  <th className="py-3 px-3">Team Name</th>
                  <th className="py-3 px-3">IGL / Captain</th>
                  <th className="py-3 pl-3 pr-4 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {teams.map((team, idx) => {
                  const isEditing = editingId === team.id;
                  return (
                    <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 pl-4 pr-2 font-mono text-xs text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {isEditing ? (
                          <input
                            type="text"
                            maxLength={5}
                            aria-label="Edit team tag"
                            value={editTag}
                            onChange={(e) => setEditTag(e.target.value.toUpperCase())}
                            className="w-20 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs uppercase dark:border-slate-600 dark:bg-slate-800"
                          />
                        ) : (
                          team.tag
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {isEditing ? (
                          <input
                            type="text"
                            aria-label="Edit team name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full max-w-xs rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                          />
                        ) : (
                          team.name
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {isEditing ? (
                          <input
                            type="text"
                            aria-label="Edit captain name"
                            value={editCaptain}
                            onChange={(e) => setEditCaptain(e.target.value)}
                            className="w-full max-w-[160px] rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                          />
                        ) : (
                          team.captain || '—'
                        )}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={saveEdit}
                              aria-label={`Save ${team.name}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel edit"
                              className="inline-flex items-center rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(team)}
                              aria-label={`Edit ${team.name}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveTeam(team.id)}
                              aria-label={`Remove ${team.name}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
