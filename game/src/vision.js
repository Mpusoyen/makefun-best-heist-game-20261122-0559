// Sight geometry: whether a watcher can see a point, and the shape of what it can see.
// Blockers are plain rectangles (walls and display cases). A vision cone is drawn as a
// fan of rays, each stopped by the first blocker it meets, so the drawn cone bends
// around cover exactly the way sight itself does.

const TAU = Math.PI * 2;
const RAYS = 30;

export function angleDifference(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export function turnToward(angle, target, maxStep) {
  const d = angleDifference(target, angle);
  if (Math.abs(d) <= maxStep) return target;
  return angle + Math.sign(d) * maxStep;
}

// Distance along the unit ray to the rect's near face, or Infinity when it misses.
export function rayRectDistance(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return Infinity;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) {
      const t = t1;
      t1 = t2;
      t2 = t;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return Infinity;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) {
      const t = t1;
      t1 = t2;
      t2 = t;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
  }
  return tmax < tmin ? Infinity : tmin;
}

// True when no blocker crosses the segment (a hair at each end is forgiven, so a
// watcher standing against a wall still sees along it).
export function lineOfSight(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const ux = dx / dist;
  const uy = dy / dist;
  for (let i = 0; i < blockers.length; i += 1) {
    const t = rayRectDistance(x1, y1, ux, uy, blockers[i]);
    if (t > 2 && t < dist - 2) return false;
  }
  return true;
}

// 0 when the point is outside the cone; otherwise a closeness factor in (0, 1],
// 1 at the watcher's nose. Callers still owe a lineOfSight check.
export function coneExposure(px, py, ox, oy, angle, halfAngle, range) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (Math.abs(angleDifference(Math.atan2(dy, dx), angle)) > halfAngle) return 0;
  return 1 - dist / range;
}

// The visible fan as points, the watcher first and then RAYS + 1 rim points, each rim
// point stopped at the first blocker or at full range.
export function conePolygon(ox, oy, angle, halfAngle, range, blockers) {
  const points = [[ox, oy]];
  for (let i = 0; i <= RAYS; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / RAYS;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let d = range;
    for (let j = 0; j < blockers.length; j += 1) {
      const t = rayRectDistance(ox, oy, dx, dy, blockers[j]);
      if (t < d) d = t;
    }
    points.push([ox + dx * d, oy + dy * d]);
  }
  return points;
}
