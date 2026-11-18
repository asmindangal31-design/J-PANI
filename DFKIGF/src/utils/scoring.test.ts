import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLeaderboard,
  calculateMatchTeamPoints,
  formatStandingsShareText,
  parseBulkTeamsInput,
  validateMatchResults,
} from './scoring';
import { createDemoTournament, SCORING_PRESETS } from '../data/presets';
import { Tournament } from '../types/tournament';

test('calculates official FFWS match points accurately for Booyah and non-scoring placements', () => {
  const rules = SCORING_PRESETS[0].rules;
  const booyah = calculateMatchTeamPoints(
    { teamId: 't1', placement: 1, kills: 11, bonusPoints: 0 },
    rules
  );
  assert.equal(booyah.placementPoints, 12);
  assert.equal(booyah.killPoints, 11);
  assert.equal(booyah.totalPoints, 23);
  assert.equal(booyah.isBooyah, true);

  const twelfth = calculateMatchTeamPoints(
    { teamId: 't12', placement: 12, kills: 2, bonusPoints: 0 },
    rules
  );
  assert.equal(twelfth.placementPoints, 0);
  assert.equal(twelfth.killPoints, 2);
  assert.equal(twelfth.totalPoints, 2);
  assert.equal(twelfth.isBooyah, false);

  const dnp = calculateMatchTeamPoints(
    { teamId: 't13', placement: null, kills: 0, bonusPoints: -2 },
    rules
  );
  assert.equal(dnp.placementPoints, 0);
  assert.equal(dnp.totalPoints, -2);
});

test('supports custom kill multipliers, decimal kill points, and booyah bonus', () => {
  const customRules = {
    ...SCORING_PRESETS[0].rules,
    presetId: 'custom' as const,
    pointsPerKill: 1.5,
    booyahBonus: 3,
    placementPoints: {
      ...SCORING_PRESETS[0].rules.placementPoints,
      1: 15,
    },
  };

  const res = calculateMatchTeamPoints(
    { teamId: 't1', placement: 1, kills: 5, bonusPoints: 1 },
    customRules
  );
  assert.equal(res.placementPoints, 18);
  assert.equal(res.killPoints, 7.5);
  assert.equal(res.totalPoints, 26.5);
});

test('applies tiebreaker order deterministically when total points are equal', () => {
  const base = createDemoTournament();
  const tiedTournament: Tournament = {
    ...base,
    teams: [
      { id: 'a', name: 'Alpha', tag: 'ALP' },
      { id: 'b', name: 'Bravo', tag: 'BRV' },
      { id: 'c', name: 'Charlie', tag: 'CHR' },
    ],
    matches: [
      {
        id: 'm1',
        matchNumber: 1,
        map: 'Bermuda',
        playedAt: '2026-11-18T10:00:00.000Z',
        results: [
          // Alpha: 1st (12) + 0 kills = 12 pts, 1 Booyah
          { teamId: 'a', placement: 1, kills: 0, bonusPoints: 0 },
          // Bravo: 2nd (9) + 3 kills = 12 pts, 0 Booyah
          { teamId: 'b', placement: 2, kills: 3, bonusPoints: 0 },
          // Charlie: 3rd (8) + 4 kills = 12 pts, 0 Booyah, fewer placement pts than Bravo
          { teamId: 'c', placement: 3, kills: 4, bonusPoints: 0 },
        ],
      },
    ],
  };

  const lb = calculateLeaderboard(tiedTournament);
  assert.deepEqual(
    lb.standings.map((s) => s.team.id),
    ['a', 'b', 'c']
  );

  // Now switch tiebreaker to killPoints first -> Charlie (4 kills) > Bravo (3 kills) > Alpha (0 kills)
  tiedTournament.scoringRules.tiebreakers = [
    'killPoints',
    'booyahs',
    'placementPoints',
    'bestMatchRank',
    'teamName',
  ];
  const lbKillFirst = calculateLeaderboard(tiedTournament);
  assert.deepEqual(
    lbKillFirst.standings.map((s) => s.team.id),
    ['c', 'b', 'a']
  );
});

test('computes rank delta from previous match accurately', () => {
  const demo = createDemoTournament();
  const lb = calculateLeaderboard(demo);
  // After match 3 (SSM got Booyah + 12 kills = 24 pts), SSM should be #1
  assert.equal(lb.standings[0].team.tag, 'SSM');
  assert.equal(lb.standings[0].rank, 1);
  assert.ok(lb.standings[0].rankDelta !== null && lb.standings[0].rankDelta > 0);
});

test('validates duplicate placements and empty matches cleanly', () => {
  const demo = createDemoTournament();
  const duplicateErrors = validateMatchResults(
    [
      { teamId: 't1', placement: 1, kills: 5, bonusPoints: 0 },
      { teamId: 't2', placement: 1, kills: 3, bonusPoints: 0 },
    ],
    demo.teams,
    12
  );
  assert.equal(duplicateErrors.length, 1);
  assert.match(duplicateErrors[0].message, /Rank #1/);

  const emptyErrors = validateMatchResults(
    [{ teamId: 't1', placement: null, kills: 0, bonusPoints: 0 }],
    demo.teams,
    12
  );
  assert.equal(emptyErrors.length, 1);
});

test('formats shareable text summary and parses bulk team lines', () => {
  const demo = createDemoTournament();
  const lb = calculateLeaderboard(demo);
  const text = formatStandingsShareText(demo, lb);
  assert.match(text, /Vanguard Esports — South Asia Open Scrims/);
  assert.match(text, /\[SSM\] Siam Strikers/);

  const parsed = parseBulkTeamsInput('NOVA | Nova Esports\nGRD, Garuda Five\nShadow Wolf');
  assert.deepEqual(parsed, [
    { name: 'Nova Esports', tag: 'NOVA' },
    { name: 'Garuda Five', tag: 'GRD' },
    { name: 'Shadow Wolf', tag: 'SW' },
  ]);
});
