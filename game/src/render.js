// Drawing only: the world's state and the current screen in, pixels out. Flat canvas
// shapes in the gallery's night palette — brass and stone for the house, amber cones
// for the wardens, red sweeps for the cameras, teal for the thief — so safe floor,
// danger and loot read at a glance, even shrunk to the judge's contact sheet. The HUD
// strip carries the loot total, the alarm meter, the decoy coins and the clock; the
// menu screens are panels drawn over the live room.

import { ALARM, FIELD, FONT, PALETTE, VISION } from './config.js';
import { ROOM, buildLevel } from './level.js';
import { conePolygon } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_WIN = 'win';

const LOOT_KINDS = buildLevel().loots.map((l) => l.id);

function money(n) {
  return `$${n.toLocaleString('en-US')}`;
}

function fmtTime(seconds) {
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, watcher, halfAngle, range, blockers, sees) {
  const points = conePolygon(watcher.x, watcher.y, watcher.angle, halfAngle, range, blockers);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = sees ? PALETTE.alertCone : watcher.coneFill;
  ctx.fill();
  ctx.strokeStyle = sees ? PALETTE.alertConeEdge : watcher.coneEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLootIcon(ctx, loot, time, sparklePhase) {
  const { x, y } = loot;
  ctx.save();
  if (loot.taken) ctx.globalAlpha = 0.22;
  // The plinth every piece stands on.
  ctx.fillStyle = '#39415e';
  roundRect(ctx, x - 17, y + 8, 34, 9, 3);
  ctx.fill();
  if (loot.kind === 'diamond') {
    // A glass dome over the gem.
    ctx.strokeStyle = 'rgba(190, 225, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 8, 24, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 24, y + 8);
    ctx.lineTo(x + 24, y + 8);
    ctx.stroke();
    ctx.fillStyle = PALETTE.diamond;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 10, y - 3);
    ctx.lineTo(x + 5, y + 8);
    ctx.lineTo(x - 5, y + 8);
    ctx.lineTo(x - 10, y - 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (loot.kind === 'painting') {
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(x - 21, y - 16, 42, 32);
    ctx.fillStyle = '#e8875a';
    ctx.fillRect(x - 17, y - 12, 34, 15);
    ctx.fillStyle = '#7a4a7e';
    ctx.fillRect(x - 17, y + 3, 34, 9);
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(x + 6, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (loot.kind === 'gold') {
    ctx.fillStyle = PALETTE.gold;
    roundRect(ctx, x - 15, y + 1, 30, 9, 2);
    ctx.fill();
    roundRect(ctx, x - 15, y - 8, 30, 9, 2);
    ctx.fill();
    roundRect(ctx, x - 8, y - 17, 16, 9, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 84, 10, 0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, x - 15, y - 8, 30, 9, 2);
    ctx.stroke();
  } else if (loot.kind === 'emerald') {
    ctx.fillStyle = PALETTE.emerald;
    ctx.beginPath();
    ctx.moveTo(x, y - 13);
    ctx.lineTo(x + 10, y - 4);
    ctx.lineTo(x + 6, y + 9);
    ctx.lineTo(x - 6, y + 9);
    ctx.lineTo(x - 10, y - 4);
    ctx.closePath();
    ctx.fill();
  } else if (loot.kind === 'pearl') {
    ctx.fillStyle = PALETTE.pearl;
    for (let i = 0; i < 5; i += 1) {
      const px = x - 14 + i * 7;
      const py = y - 4 + Math.sin((i / 4) * Math.PI) * 8;
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // cash
    ctx.fillStyle = PALETTE.cash;
    roundRect(ctx, x - 14, y - 9, 28, 18, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20, 60, 20, 0.55)';
    ctx.fillRect(x - 3, y - 9, 6, 18);
  }
  ctx.restore();
  if (!loot.taken) {
    // A slow sparkle so the eye finds the treasure.
    const a = 0.35 + 0.3 * Math.sin(time * 2.6 + sparklePhase);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    const sx = x + 13;
    const sy = y - 13;
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy);
    ctx.lineTo(sx + 5, sy);
    ctx.moveTo(sx, sy - 5);
    ctx.lineTo(sx, sy + 5);
    ctx.stroke();
    ctx.restore();
  }
}

export function createRenderer(canvas, rng) {
  const ctx = canvas.getContext('2d');
  const level = buildLevel();
  const sparklePhases = {};
  for (const id of LOOT_KINDS) sparklePhases[id] = rng ? rng.range(0, Math.PI * 2) : 0;

  const alarmGradient = ctx.createLinearGradient(470, 0, 790, 0);
  alarmGradient.addColorStop(0, '#39e08a');
  alarmGradient.addColorStop(0.55, '#ffd257');
  alarmGradient.addColorStop(1, '#ff5a4e');

  function drawRoom(state) {
    // Floor: two-tone checkerboard under everything.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(ROOM.left, ROOM.top, ROOM.right - ROOM.left, ROOM.bottom - ROOM.top);
    ctx.fillStyle = PALETTE.floorAlt;
    const tile = 41;
    for (let ty = ROOM.top; ty < ROOM.bottom; ty += tile) {
      for (let tx = ROOM.left; tx < ROOM.right; tx += tile) {
        if ((((tx - ROOM.left) / tile) | 0) % 2 === (((ty - ROOM.top) / tile) | 0) % 2) {
          ctx.fillRect(tx, ty, Math.min(tile, ROOM.right - tx), Math.min(tile, ROOM.bottom - ty));
        }
      }
    }
    // Rugs in the vault wing and the entry hall.
    ctx.fillStyle = PALETTE.rug;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(478, 116, 742, 272);
    ctx.fillRect(56, 116, 336, 250);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = PALETTE.brass;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.strokeRect(478, 116, 742, 272);
    ctx.strokeRect(56, 116, 336, 250);
    ctx.globalAlpha = 1;
    // The house's name, woven into the hall carpet.
    ctx.fillStyle = 'rgba(238, 241, 248, 0.13)';
    ctx.font = '30px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('M E R I D I A N', 224, 486);

    // The exit door in the west wall.
    const e = state.exit;
    ctx.fillStyle = state.hasDiamond ? '#14532d' : '#2a3247';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = state.hasDiamond ? PALETTE.exit : '#4a5468';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
    ctx.fillStyle = state.hasDiamond ? PALETTE.exit : PALETTE.textDim;
    ctx.font = FONT.label;
    ctx.fillText('EXIT', e.x + e.w / 2, e.y + 30);
    ctx.fillStyle = state.hasDiamond ? PALETTE.exit : PALETTE.danger;
    ctx.fillText(state.hasDiamond ? 'OPEN' : 'LOCKED', e.x + e.w / 2, e.y + 48);

    // Loot on its plinths.
    for (const loot of state.loots) drawLootIcon(ctx, loot, state.time, sparklePhases[loot.id]);
    ctx.fillStyle = PALETTE.diamond;
    ctx.font = FONT.label;
    ctx.textAlign = 'center';
    const diamond = state.loots.find((l) => l.kind === 'diamond');
    if (diamond && !diamond.taken) {
      ctx.fillText('AURORA DIAMOND', diamond.x, diamond.y - 34);
      ctx.fillStyle = PALETTE.textDim;
      ctx.fillText('$50,000', diamond.x, diamond.y + 34);
    }

    // Display cases and pillars: the cover.
    for (const c of level.covers) {
      ctx.fillStyle = PALETTE.caseWood;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = PALETTE.caseGlass;
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
      ctx.strokeStyle = 'rgba(230, 238, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(c.x + 6.5, c.y + 6.5, c.w - 13, c.h - 13);
    }

    // Walls over the floor, brass-capped.
    for (const w of level.walls) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(w.x, w.y, w.w, Math.min(4, w.h));
    }

    // A tossed coin, pinging.
    if (state.coin.active) {
      const remain = Math.max(0, state.coin.t);
      const ringR = 8 + (1 - remain / 2.6) * 30;
      ctx.strokeStyle = `rgba(255, 210, 87, ${0.25 + remain / 2.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.coin.x, state.coin.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(state.coin.x, state.coin.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sight: camera sweeps in red, warden cones in amber, all of them clipped by the
    // walls and cases the way real sight is.
    for (const c of state.cameras) {
      drawCone(
        ctx,
        { x: c.x, y: c.y, angle: c.angle, coneFill: PALETTE.cameraCone, coneEdge: PALETTE.cameraConeEdge },
        VISION.cameraHalfAngle,
        VISION.cameraRange,
        state.blockers,
        c.sees,
      );
    }
    for (const g of state.guards) {
      drawCone(
        ctx,
        { x: g.x, y: g.y, angle: g.angle, coneFill: PALETTE.guardCone, coneEdge: PALETTE.guardConeEdge },
        VISION.guardHalfAngle,
        VISION.guardRange,
        state.blockers,
        g.sees,
      );
    }

    // The cameras themselves: a stalk, a body, a watching lens.
    for (const c of state.cameras) {
      ctx.strokeStyle = '#39415e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(c.angle + Math.PI) * 10, c.y + Math.sin(c.angle + Math.PI) * 10);
      ctx.stroke();
      ctx.fillStyle = '#22293c';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.sees ? '#ffffff' : PALETTE.danger;
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(c.angle) * 4, c.y + Math.sin(c.angle) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // The wardens.
    for (const g of state.guards) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y + 12, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.guardBody;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.skin;
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.angle) * 3, g.y + Math.sin(g.angle) * 3, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.guardCap;
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.angle) * 3, g.y + Math.sin(g.angle) * 3, 6.5, g.angle - 0.4, g.angle + Math.PI + 0.4);
      ctx.fill();
      if (g.sees) {
        ctx.fillStyle = PALETTE.danger;
        ctx.beginPath();
        ctx.arc(g.x, g.y - 26, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', g.x, g.y - 21.5);
      }
    }

    // Wren, the thief: teal hood, and a sack that grows honest with the night's work.
    const p = state.player;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 11, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state.lootCount > 0) {
      ctx.fillStyle = '#8a6d3b';
      ctx.beginPath();
      ctx.arc(p.x - Math.cos(p.face) * 13, p.y - Math.sin(p.face) * 13, 6 + state.lootCount, 0, Math.PI * 2);
      ctx.fill();
      if (state.hasDiamond) {
        ctx.fillStyle = PALETTE.diamond;
        ctx.beginPath();
        ctx.arc(p.x - Math.cos(p.face) * 13, p.y - Math.sin(p.face) * 13, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = PALETTE.thief;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.thiefDark;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.face) * 4, p.y + Math.sin(p.face) * 4, 7, 0, Math.PI * 2);
    ctx.fill();
    if (p.sneak) {
      ctx.strokeStyle = 'rgba(57, 208, 196, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // A fresh lift announces itself.
    if (state.toastT > 0 && state.toast) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, state.toastT);
      ctx.font = FONT.hud;
      const w = ctx.measureText(state.toast).width + 36;
      ctx.fillStyle = 'rgba(10, 14, 24, 0.85)';
      roundRect(ctx, 640 - w / 2, 96, w, 34, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      ctx.textAlign = 'center';
      ctx.fillText(state.toast, 640, 119);
      ctx.restore();
    }
  }

  function drawHud(state) {
    ctx.fillStyle = PALETTE.hudBar;
    ctx.fillRect(0, 0, FIELD.width, FIELD.hudHeight);
    ctx.fillStyle = PALETTE.brass;
    ctx.fillRect(0, FIELD.hudHeight - 2, FIELD.width, 2);

    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.hud;
    ctx.fillText(`LOOT  ${money(state.lootTotal)}`, 24, 28);
    ctx.font = FONT.hudSmall;
    ctx.fillStyle = state.hasDiamond ? PALETTE.diamond : PALETTE.textDim;
    ctx.fillText(
      state.hasDiamond ? 'AURORA DIAMOND: IN THE BAG' : 'AURORA DIAMOND: STILL IN THE VAULT',
      24,
      51,
    );

    // The objective, the meter, the warning.
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.brass;
    ctx.font = FONT.hudSmall;
    ctx.fillText(state.hasDiamond ? 'OBJECTIVE: REACH THE EXIT' : 'OBJECTIVE: LIFT THE AURORA DIAMOND', 640, 15);
    ctx.textAlign = 'right';
    ctx.fillStyle = state.alarm >= 60 ? PALETTE.danger : PALETTE.textDim;
    ctx.fillText('ALARM', 462, 45);
    ctx.fillStyle = '#232a42';
    ctx.fillRect(470, 31, 320, 15);
    ctx.fillStyle = alarmGradient;
    ctx.fillRect(470, 31, (320 * state.alarm) / ALARM.max, 15);
    const flashing = state.alarm >= 75 && Math.floor(state.time * 4) % 2 === 0;
    ctx.strokeStyle = flashing ? PALETTE.danger : '#39415e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(470, 31, 320, 15);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`${Math.round(state.alarm)}%`, 798, 45);
    if (state.seenNow) {
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.danger;
      ctx.fillText('● SPOTTED', 640, 61);
    }

    // Decoy coins left, and the clock.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText('COINS', 1132, 28);
    for (let i = 0; i < 3; i += 1) {
      const cx = 1152 + i * 22;
      ctx.beginPath();
      ctx.arc(cx, 22, 7, 0, Math.PI * 2);
      if (i < state.coinsLeft) {
        ctx.fillStyle = PALETTE.gold;
        ctx.fill();
      } else {
        ctx.strokeStyle = '#39415e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.hud;
    ctx.fillText(fmtTime(state.time), 1256, 52);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(16, 21, 38, 0.97)';
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawTitle(state) {
    ctx.fillStyle = 'rgba(5, 8, 16, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(330, 196, 620, 428);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = FONT.title;
    ctx.fillText('THE MERIDIAN JOB', 640, 292);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = FONT.subtitle;
    ctx.fillText('a tiny heist in the Meridian Gallery', 640, 330);
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.body;
    ctx.fillText('Tonight the gallery sleeps. Wren does not.', 640, 384);
    ctx.fillText('Lift the Aurora Diamond, pocket the loose treasure,', 640, 410);
    ctx.fillText('and be gone before the alarm meter fills.', 640, 436);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = FONT.hudSmall;
    ctx.fillText('WASD / ARROWS — move        SHIFT — tiptoe (half as visible)', 640, 482);
    ctx.fillText('CLICK — toss a decoy coin (you carry 3)', 640, 506);
    ctx.fillText('Amber cones are wardens. Red sweeps are cameras. Cases and walls break sight.', 640, 530);
    ctx.fillText('A full ALARM meter, or a warden\u2019s hands on you, ends the night.', 640, 554);
    ctx.fillStyle = PALETTE.brass;
    ctx.font = FONT.hud;
    ctx.globalAlpha = 0.65 + 0.35 * Math.sin(state.time * 3);
    ctx.fillText('CLICK OR PRESS ENTER TO SLIP INSIDE', 640, 600);
    ctx.globalAlpha = 1;
  }

  function drawBusted(state) {
    ctx.fillStyle = 'rgba(64, 8, 6, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(380, 250, 520, 300);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.danger;
    ctx.font = FONT.title;
    ctx.fillText('BUSTED', 640, 348);
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.body;
    ctx.fillText(
      state.bustReason === 'caught'
        ? 'A warden got hands on Wren in the dark.'
        : 'The alarm hit 100% — the house came down.',
      640,
      396,
    );
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(`Loot in the bag: ${money(state.lootTotal)} — lost with the night.`, 640, 436);
    ctx.fillText(`Time inside: ${fmtTime(state.time)} · Alarm peak: ${Math.round(state.alarmPeak)}%`, 640, 464);
    ctx.fillStyle = PALETTE.brass;
    ctx.font = FONT.hud;
    ctx.fillText('CLICK OR PRESS ENTER TO TRY AGAIN', 640, 516);
  }

  function drawWin(state) {
    const loose = state.lootTotal - (state.hasDiamond ? 50000 : 0);
    const looseCount = state.lootCount - (state.hasDiamond ? 1 : 0);
    let rating = 'LOUD, BUT GONE';
    if (state.alarmPeak <= 20) rating = state.lootCount >= 6 ? 'GHOST — A PERFECT NIGHT' : 'GHOST';
    else if (state.alarmPeak <= 55) rating = 'PROFESSIONAL';
    ctx.fillStyle = 'rgba(4, 22, 14, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(380, 226, 520, 348);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = FONT.title;
    ctx.fillText('GETAWAY', 640, 322);
    ctx.fillStyle = PALETTE.brass;
    ctx.font = FONT.subtitle;
    ctx.fillText(rating, 640, 358);
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.body;
    ctx.fillText(`Aurora Diamond   ${money(50000)}`, 640, 408);
    ctx.fillText(`Loose treasure (${looseCount} of 5)   ${money(loose)}`, 640, 436);
    ctx.font = FONT.hud;
    ctx.fillText(`TOTAL   ${money(state.lootTotal)}`, 640, 472);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = FONT.body;
    ctx.fillText(`Time ${fmtTime(state.time)} · Alarm peak ${Math.round(state.alarmPeak)}%`, 640, 504);
    ctx.fillStyle = PALETTE.brass;
    ctx.font = FONT.hud;
    ctx.fillText('CLICK OR PRESS ENTER TO PLAY AGAIN', 640, 544);
  }

  function draw(state, screen) {
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawRoom(state);
    drawHud(state);
    if (screen === SCREEN_PLAY && state.alarm >= 70) {
      ctx.strokeStyle = `rgba(255, 60, 50, ${0.14 + 0.1 * Math.sin(state.time * 5)})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, FIELD.width - 10, FIELD.height - 10);
    }
    if (screen === SCREEN_TITLE) drawTitle(state);
    else if (screen === SCREEN_BUSTED) drawBusted(state);
    else if (screen === SCREEN_WIN) drawWin(state);
  }

  return { draw };
}
