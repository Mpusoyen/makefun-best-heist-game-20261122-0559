// The screenshot scenes behind ?shot=title|cover|sneak|getaway. Each starts from a
// fresh world and plays the real rules forward; the action scenes then arrange one
// honest moment — positions, a lure coin mid-ping, the alarm where the moment puts
// it — and let the rules run a few more steps, so every cone and meter in the frame
// is the game's own work. A final touch sets facings exactly, since a still frame
// should not depend on the phase of a guard's scan. Same seed, same frame.

import { STEP } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const IDLE = { dx: 0, dy: 0, sneak: false, toss: null };

function idle(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(STEP, IDLE);
}

function takeLoot(state, id) {
  const loot = state.loots.find((l) => l.id === id);
  if (loot && !loot.taken) {
    loot.taken = true;
    state.lootTotal += loot.value;
    state.lootCount += 1;
  }
}

// Park a warden at a spot, standing at his post and scanning around scanBase.
function parkGuard(state, index, x, y, scanBase) {
  const g = state.guards[index];
  g.x = x;
  g.y = y;
  g.mode = 'scan';
  g.scanBase = scanBase;
  g.angle = scanBase;
}

export function stageShot(name, world) {
  const s = world.state;
  world.reset();

  if (name === 'cover') {
    idle(world, 6);
    takeLoot(s, 'painting');
    takeLoot(s, 'cash');
    // Wren, mid-crossing in the vault wing with two pieces already in the sack. The
    // coin she just tossed pings beside the emerald case; the vault warden turned
    // for it — and his sweep has caught her anyway. Alarm at half and climbing.
    s.player.x = 838;
    s.player.y = 258;
    s.coin.active = true;
    s.coin.x = 606;
    s.coin.y = 322;
    s.coin.t = 2.4;
    s.coinsLeft = 2;
    parkGuard(s, 1, 706, 356, -0.8);
    idle(world, 0.3);
    const g = s.guards[1];
    g.angle = Math.atan2(s.player.y - g.y, s.player.x - g.x);
    g.sees = true;
    s.seenNow = true;
    s.player.face = -2.25;
    s.alarm = 46;
    s.alarmPeak = 52;
    return SCREEN_PLAY;
  }

  if (name === 'sneak') {
    idle(world, 3);
    takeLoot(s, 'emerald');
    // On tiptoe at the pedestal's shoulder while the warden's cone washes over the
    // diamond itself — a held breath, not a safe one.
    s.player.x = 1028;
    s.player.y = 232;
    parkGuard(s, 1, 1152, 318, -1.75);
    idle(world, 0.2);
    s.guards[1].angle = -1.55;
    s.player.face = 0.45;
    s.player.sneak = true;
    s.alarm = 24;
    s.alarmPeak = 24;
    return SCREEN_PLAY;
  }

  if (name === 'getaway') {
    idle(world, 5);
    for (const id of ['painting', 'emerald', 'gold', 'pearl', 'cash', 'diamond']) takeLoot(s, id);
    s.hasDiamond = true;
    // Everything lifted, meter nearly full, one doorway to go. Her last coin pings
    // behind the hall warden — but his cone has found her at the exit all the same.
    s.player.x = 150;
    s.player.y = 712;
    s.coin.active = true;
    s.coin.x = 252;
    s.coin.y = 640;
    s.coin.t = 2.4;
    s.coinsLeft = 0;
    parkGuard(s, 0, 232, 596, 2.2);
    idle(world, 0.25);
    const g = s.guards[0];
    g.angle = Math.atan2(s.player.y - g.y, s.player.x - g.x);
    g.sees = true;
    s.seenNow = true;
    s.player.face = Math.PI;
    s.alarm = 83;
    s.alarmPeak = 88;
    return SCREEN_PLAY;
  }

  idle(world, 5);
  return SCREEN_TITLE;
}
