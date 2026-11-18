import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewTournamentModalProps {
  open: boolean;
  defaultOrgName: string;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    organizationName: string;
    subtitle: string;
    seedDemoTeams: boolean;
  }) => void;
}

export const NewTournamentModal: React.FC<NewTournamentModalProps> = ({
  open,
  defaultOrgName,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState(defaultOrgName);
  const [subtitle, setSubtitle] = useState('Group A · 12-Team Lobby');
  const [seedDemoTeams, setSeedDemoTeams] = useState(true);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a tournament name.');
      return;
    }
    if (!organizationName.trim()) {
      setError('Enter your organization name.');
      return;
    }
    onCreate({
      name: name.trim(),
      organizationName: organizationName.trim(),
      subtitle: subtitle.trim() || 'Official Lobby',
      seedDemoTeams,
    });
    setName('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-tournament-heading"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="new-tournament-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Create Tournament
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create tournament dialog"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="modal-org-name"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Organization Name
            </label>
            <input
              id="modal-org-name"
              type="text"
              value={organizationName}
              onChange={(e) => {
                setOrganizationName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Vanguard Esports"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="modal-tourney-name"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Tournament Name
            </label>
            <input
              id="modal-tourney-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Winter Clash Community Cup"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="modal-tourney-subtitle"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Stage / Group Label
            </label>
            <input
              id="modal-tourney-subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={seedDemoTeams}
              onChange={(e) => setSeedDemoTeams(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <span>Pre-fill 12 sample lobby slots (Slot 1–12) so I can log matches right away</span>
          </label>

          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
            >
              Create Tournament
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
