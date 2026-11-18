import { LeaderboardResult, Tournament } from '../types/tournament';
import { formatPts } from './scoring';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function exportPointsTablePng(tournament: Tournament, leaderboard: LeaderboardResult): void {
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { broadcastConfig, accentColor } = tournament;
  const theme = broadcastConfig.theme;

  const palette =
    theme === 'paper'
      ? {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          rowAlt: '#F1F5F9',
          border: '#E2E8F0',
          textPrimary: '#0F172A',
          textMuted: '#64748B',
          headerRow: '#0F172A',
          headerRowText: '#F8FAFC',
        }
      : theme === 'slate'
        ? {
            bg: '#0F172A',
            surface: '#1E293B',
            rowAlt: '#172133',
            border: '#334155',
            textPrimary: '#F8FAFC',
            textMuted: '#94A3B8',
            headerRow: '#0B1120',
            headerRowText: '#E2E8F0',
          }
        : {
            bg: '#09090B',
            surface: '#141418',
            rowAlt: '#1B1B21',
            border: '#27272A',
            textPrimary: '#FAFAFA',
            textMuted: '#A1A1AA',
            headerRow: '#18181B',
            headerRowText: '#E4E4E7',
          };

  // Canvas background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  // Top accent bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, width, 10);

  // Header area
  const padX = 88;
  ctx.fillStyle = accentColor;
  ctx.font = '600 22px "Outfit", system-ui, sans-serif';
  ctx.fillText(tournament.organizationName.toUpperCase(), padX, 74);

  ctx.fillStyle = palette.textPrimary;
  ctx.font = '700 46px "Outfit", system-ui, sans-serif';
  ctx.fillText(tournament.name, padX, 128);

  ctx.fillStyle = palette.textMuted;
  ctx.font = '500 22px "Plus Jakarta Sans", system-ui, sans-serif';
  const metaLine = `${tournament.subtitle}  ·  ${leaderboard.totalMatches} ${
    leaderboard.totalMatches === 1 ? 'Match' : 'Matches'
  } Played  ·  Overall Standings`;
  ctx.fillText(metaLine, padX, 166);

  // Right-aligned format summary
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.textMuted;
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillText(
    `1st: ${tournament.scoringRules.placementPoints[1] ?? 0} pts  |  Kill: ${formatPts(
      tournament.scoringRules.pointsPerKill
    )} pt`,
    width - padX,
    126
  );
  ctx.textAlign = 'left';

  // Table container
  const tableX = padX;
  const tableY = 204;
  const tableW = width - padX * 2;
  const visibleRows = leaderboard.standings.slice(0, 16);
  const headerH = 54;
  const rowH = visibleRows.length > 0 ? Math.min(60, Math.floor((760 - headerH) / visibleRows.length)) : 60;
  const tableH = headerH + Math.max(1, visibleRows.length) * rowH;

  ctx.fillStyle = palette.surface;
  drawRoundedRect(ctx, tableX, tableY, tableW, tableH, 12);
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Table column definitions
  const cols: Array<{ key: string; label: string; width: number; align: 'left' | 'right' }> = [
    { key: 'rank', label: 'RANK', width: 110, align: 'left' },
    { key: 'team', label: 'TEAM', width: 520, align: 'left' },
  ];
  if (broadcastConfig.showMatchesPlayed) {
    cols.push({ key: 'mp', label: 'MP', width: 110, align: 'right' });
  }
  if (broadcastConfig.showBooyahs) {
    cols.push({ key: 'booyah', label: 'BOOYAH', width: 140, align: 'right' });
  }
  if (broadcastConfig.showPlacementPts) {
    cols.push({ key: 'place', label: 'PLACE PTS', width: 160, align: 'right' });
  }
  if (broadcastConfig.showKillPts) {
    cols.push({ key: 'kill', label: 'KILL PTS', width: 150, align: 'right' });
  }
  if (broadcastConfig.showBonusPts) {
    cols.push({ key: 'bonus', label: 'BONUS', width: 130, align: 'right' });
  }
  if (broadcastConfig.showAvgPts) {
    cols.push({ key: 'avg', label: 'AVG', width: 120, align: 'right' });
  }
  cols.push({ key: 'total', label: 'TOTAL PTS', width: 200, align: 'right' });

  // Stretch team column to fill available table width cleanly
  const fixedSum = cols.reduce((acc, c) => (c.key === 'team' ? acc : acc + c.width), 0);
  const teamCol = cols.find((c) => c.key === 'team');
  if (teamCol) {
    teamCol.width = Math.max(340, tableW - fixedSum - 64);
  }

  // Table header background
  ctx.fillStyle = palette.headerRow;
  ctx.fillRect(tableX + 2, tableY + 2, tableW - 4, headerH - 2);

  // Header text
  ctx.fillStyle = palette.headerRowText;
  ctx.font = '600 18px "JetBrains Mono", monospace';
  let curX = tableX + 32;
  for (const col of cols) {
    ctx.textAlign = col.align;
    const drawX = col.align === 'right' ? curX + col.width : curX;
    ctx.fillText(col.label, drawX, tableY + 34);
    curX += col.width;
  }

  // Rows
  visibleRows.forEach((row, idx) => {
    const ry = tableY + headerH + idx * rowH;
    if (idx % 2 === 1) {
      ctx.fillStyle = palette.rowAlt;
      ctx.fillRect(tableX + 2, ry, tableW - 4, rowH);
    }

    // Highlight #1 rank subtly
    if (row.rank === 1) {
      ctx.fillStyle = `${accentColor}1F`;
      ctx.fillRect(tableX + 2, ry, tableW - 4, rowH);
    }

    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX + 2, ry);
    ctx.lineTo(tableX + tableW - 2, ry);
    ctx.stroke();

    let cellX = tableX + 32;
    const textY = ry + Math.round(rowH / 2) + 7;

    for (const col of cols) {
      ctx.textAlign = col.align;
      const drawX = col.align === 'right' ? cellX + col.width : cellX;

      if (col.key === 'rank') {
        ctx.fillStyle = row.rank === 1 ? accentColor : palette.textPrimary;
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillText(`#${String(row.rank).padStart(2, '0')}`, drawX, textY);
      } else if (col.key === 'team') {
        ctx.fillStyle = palette.textMuted;
        ctx.font = '600 18px "JetBrains Mono", monospace';
        const tagText = row.team.tag ? `[${row.team.tag}]` : '';
        ctx.fillText(tagText, drawX, textY);
        const tagWidth = tagText ? ctx.measureText(tagText).width + 16 : 0;

        ctx.fillStyle = palette.textPrimary;
        ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(row.team.name, drawX + tagWidth, textY);
      } else if (col.key === 'mp') {
        ctx.fillStyle = palette.textMuted;
        ctx.font = '500 21px "JetBrains Mono", monospace';
        ctx.fillText(String(row.matchesPlayed), drawX, textY);
      } else if (col.key === 'booyah') {
        ctx.fillStyle = row.booyahs > 0 ? accentColor : palette.textMuted;
        ctx.font = '600 21px "JetBrains Mono", monospace';
        ctx.fillText(String(row.booyahs), drawX, textY);
      } else if (col.key === 'place') {
        ctx.fillStyle = palette.textPrimary;
        ctx.font = '500 21px "JetBrains Mono", monospace';
        ctx.fillText(formatPts(row.placementPoints), drawX, textY);
      } else if (col.key === 'kill') {
        ctx.fillStyle = palette.textPrimary;
        ctx.font = '500 21px "JetBrains Mono", monospace';
        ctx.fillText(formatPts(row.killPoints), drawX, textY);
      } else if (col.key === 'bonus') {
        ctx.fillStyle = palette.textMuted;
        ctx.font = '500 21px "JetBrains Mono", monospace';
        ctx.fillText(formatPts(row.bonusPoints), drawX, textY);
      } else if (col.key === 'avg') {
        ctx.fillStyle = palette.textMuted;
        ctx.font = '500 21px "JetBrains Mono", monospace';
        ctx.fillText(formatPts(row.averagePoints), drawX, textY);
      } else if (col.key === 'total') {
        ctx.fillStyle = row.rank === 1 ? accentColor : palette.textPrimary;
        ctx.font = '700 25px "JetBrains Mono", monospace';
        ctx.fillText(formatPts(row.totalPoints), drawX, textY);
      }
      cellX += col.width;
    }
  });

  // Footer note
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.textMuted;
  ctx.font = '500 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    broadcastConfig.footerNote || `${tournament.organizationName} · Official Tournament Points Table`,
    padX,
    1024
  );

  ctx.textAlign = 'right';
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText(`Updated ${new Date().toLocaleDateString()}`, width - padX, 1024);

  // Trigger download
  const slug = tournament.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const link = document.createElement('a');
  link.download = `${slug || 'tournament'}-points-table.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
