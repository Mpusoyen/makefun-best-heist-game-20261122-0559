// The heist's rules and state, with no drawing and no browser in it: the thief, the
// wardens on their patrols, the sweeping cameras, the alarm their sight feeds, the
// loot, the decoy coins and the exit. step() advances one fixed step and returns what
// happened as bit flags, so the caller can react (sound, screens) without the world
// knowing about either.

import { ALARM, COIN, GUARD, PLAYER, VISION } from './config.js';
import { ROOM, buildLevel } from './level.js';
import { coneExposure, lineOfSight, turnToward } from './vision.js';

export const EVENT_PICKUP = 1;
export const EVENT_DIAMOND = 2;
export const EVENT_TOSS = 4;
export const EVENT_BUSTED = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_SPOTTED = 32;

function clampToRoom(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function circleHitsRect(a, radius, r) {
  const cx = Math.max(r.x, Math.min(a.x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(a.y, r.y + r.h));
  const dx = a.x - cx;
  const dy = a.y - cy;
  return dx * dx + dy * dy < radius * radius;
}

// Axis-separated movement: slide along whatever the circle meets.
function moveActor(a, radius, mx, my, blockers) {
  if (mx !== 0) {
    a.x += mx;
    for (let i = 0; i < blockers.length; i += 1) {
      const r = blockers[i];
      if (circleHitsRect(a, radius, r)) a.x = mx > 0 ? r.x - radius : r.x + r.w + radius;
    }
  }
  if (my !== 0) {
    a.y += my;
    for (let i = 0; i < blockers.length; i += 1) {
      const r = blockers[i];
      if (circleHitsRect(a, radius, r)) a.y = my > 0 ? r.y - radius : r.y + r.h + radius;
    }
  }
}

export function createWorld() {
  const state = {
    time: 0,
    player: { x: 0, y: 0, face: -Math.PI / 2, sneak: false, moving: false },
    guards: [],
    cameras: [],
    loots: [],
    blockers: [],
    exit: { x: 0, y: 0, w: 0, h: 0 },
    alarm: 0,
    alarmPeak: 0,
    lootTotal: 0,
    lootCount: 0,
    coinsLeft: COIN.count,
    coin: { active: false, x: 0, y: 0, t: 0 },
    hasDiamond: false,
    seenNow: false,
    busted: false,
    bustReason: '',
    escaped: false,
    toast: '',
    toastT: 0,
  };

  function reset() {
    const level = buildLevel();
    state.time = 0;
    state.blockers = level.blockers;
    state.exit = level.exit;
    state.loots = level.loots.map((l) => ({ ...l, taken: false }));
    state.player.x = level.start.x;
    state.player.y = level.start.y;
    state.player.face = -Math.PI / 2;
    state.player.sneak = false;
    state.player.moving = false;
    state.guards = level.guardRoutes.map((route, index) => ({
      x: route[0][0],
      y: route[0][1],
      angle: Math.atan2(route[1][1] - route[0][1], route[1][0] - route[0][0]),
      route,
      wp: 1,
      mode: 'patrol',
      scanBase: 0,
      sees: false,
      index,
    }));
    state.cameras = level.cameras.map((c) => ({ ...c, angle: c.base, sees: false }));
    state.alarm = 0;
    state.alarmPeak = 0;
    state.lootTotal = 0;
    state.lootCount = 0;
    state.coinsLeft = COIN.count;
    state.coin.active = false;
    state.coin.t = 0;
    state.hasDiamond = false;
    state.seenNow = false;
    state.busted = false;
    state.bustReason = '';
    state.escaped = false;
    state.toast = '';
    state.toastT = 0;
  }

  function nearestWaypoint(g) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < g.route.length; i += 1) {
      const d = Math.hypot(g.route[i][0] - g.x, g.route[i][1] - g.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return (best + 1) % g.route.length;
  }

  function updateGuard(g, dt) {
    if (g.mode === 'lured') {
      const dx = state.coin.x - g.x;
      const dy = state.coin.y - g.y;
      if (Math.hypot(dx, dy) < 12) {
        g.mode = 'scan';
        g.scanBase = g.angle;
        return;
      }
      g.angle = turnToward(g.angle, Math.atan2(dy, dx), 3.4 * dt);
      moveActor(
        g,
        GUARD.radius,
        Math.cos(g.angle) * GUARD.investigateSpeed * dt,
        Math.sin(g.angle) * GUARD.investigateSpeed * dt,
        state.blockers,
      );
      return;
    }
    if (g.mode === 'scan') {
      g.angle = g.scanBase + Math.sin(state.time * 2.1 + g.index * 1.7) * 0.65;
      return;
    }
    const target = g.route[g.wp];
    const dx = target[0] - g.x;
    const dy = target[1] - g.y;
    if (Math.hypot(dx, dy) < 5) {
      g.wp = (g.wp + 1) % g.route.length;
      return;
    }
    g.angle = turnToward(g.angle, Math.atan2(dy, dx), 3.0 * dt);
    moveActor(
      g,
      GUARD.radius,
      Math.cos(g.angle) * GUARD.patrolSpeed * dt,
      Math.sin(g.angle) * GUARD.patrolSpeed * dt,
      state.blockers,
    );
  }

  function updateDetection(dt) {
    const p = state.player;
    let rate = 0;
    let seen = false;
    for (const g of state.guards) {
      g.sees = false;
      const f = coneExposure(p.x, p.y, g.x, g.y, g.angle, VISION.guardHalfAngle, VISION.guardRange);
      if (f > 0 && lineOfSight(g.x, g.y, p.x, p.y, state.blockers)) {
        g.sees = true;
        seen = true;
        rate += ALARM.guardRate * (0.35 + 0.65 * f);
      }
    }
    for (const c of state.cameras) {
      c.sees = false;
      const f = coneExposure(p.x, p.y, c.x, c.y, c.angle, VISION.cameraHalfAngle, VISION.cameraRange);
      if (f > 0 && lineOfSight(c.x, c.y, p.x, p.y, state.blockers)) {
        c.sees = true;
        seen = true;
        rate += ALARM.cameraRate * (0.35 + 0.65 * f);
      }
    }
    let events = 0;
    if (seen) {
      if (!state.seenNow) events |= EVENT_SPOTTED;
      state.alarm += rate * dt * (p.sneak ? 0.5 : 1);
    } else {
      state.alarm -= ALARM.decay * dt;
    }
    state.seenNow = seen;
    if (state.alarm < 0) state.alarm = 0;
    if (state.alarm > ALARM.max) state.alarm = ALARM.max;
    if (state.alarm > state.alarmPeak) state.alarmPeak = state.alarm;
    return events;
  }

  function step(dt, input) {
    let events = 0;
    if (state.busted || state.escaped) return events;
    state.time += dt;
    if (state.toastT > 0) state.toastT -= dt;
    const p = state.player;

    // The thief.
    p.sneak = !!input.sneak;
    const len = Math.hypot(input.dx, input.dy);
    p.moving = len > 0;
    if (len > 0) {
      const speed = p.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
      p.face = Math.atan2(input.dy, input.dx);
      moveActor(
        p,
        PLAYER.radius,
        (input.dx / len) * speed * dt,
        (input.dy / len) * speed * dt,
        state.blockers,
      );
    }

    // A tossed coin lands with a ping and pulls nearby wardens off their routes.
    if (input.toss && state.coinsLeft > 0 && !state.coin.active) {
      const tx = clampToRoom(input.toss.x, ROOM.left + 10, ROOM.right - 10);
      const ty = clampToRoom(input.toss.y, ROOM.top + 10, ROOM.bottom - 10);
      if (Math.hypot(tx - p.x, ty - p.y) <= COIN.maxThrow) {
        state.coinsLeft -= 1;
        state.coin.active = true;
        state.coin.x = tx;
        state.coin.y = ty;
        state.coin.t = COIN.lureSeconds;
        events |= EVENT_TOSS;
        for (const g of state.guards) {
          if (Math.hypot(g.x - tx, g.y - ty) <= COIN.lureRadius) g.mode = 'lured';
        }
      }
    }
    if (state.coin.active) {
      state.coin.t -= dt;
      if (state.coin.t <= 0) {
        state.coin.active = false;
        for (const g of state.guards) {
          if (g.mode !== 'patrol') {
            g.mode = 'patrol';
            g.wp = nearestWaypoint(g);
          }
        }
      }
    }

    for (const g of state.guards) updateGuard(g, dt);
    for (const c of state.cameras) {
      c.angle = c.base + Math.sin(state.time * c.speed + c.phase) * c.sweep;
    }

    events |= updateDetection(dt);

    // A warden's hands end the night at once; a full meter brings the house down.
    for (const g of state.guards) {
      if (Math.hypot(g.x - p.x, g.y - p.y) < GUARD.catchDistance) {
        state.busted = true;
        state.bustReason = 'caught';
        return events | EVENT_BUSTED;
      }
    }
    if (state.alarm >= ALARM.max) {
      state.busted = true;
      state.bustReason = 'alarm';
      return events | EVENT_BUSTED;
    }

    // Loot, for the taking.
    for (const loot of state.loots) {
      if (loot.taken) continue;
      if (Math.hypot(loot.x - p.x, loot.y - p.y) < 30) {
        loot.taken = true;
        state.lootTotal += loot.value;
        state.lootCount += 1;
        state.toast = `${loot.name}  +$${loot.value.toLocaleString('en-US')}`;
        state.toastT = 2.2;
        events |= EVENT_PICKUP;
        if (loot.kind === 'diamond') {
          state.hasDiamond = true;
          state.alarm = Math.min(ALARM.max, state.alarm + ALARM.diamondTrip);
          state.toast = 'The pedestal plate trips: ALARM +12 — RUN';
          events |= EVENT_DIAMOND;
          if (state.alarm >= ALARM.max) {
            state.busted = true;
            state.bustReason = 'alarm';
            return events | EVENT_BUSTED;
          }
        }
      }
    }

    // The way out only counts with the diamond in the bag.
    const e = state.exit;
    if (state.hasDiamond && p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
      state.escaped = true;
      events |= EVENT_ESCAPED;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
