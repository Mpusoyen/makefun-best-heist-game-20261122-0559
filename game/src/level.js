// The Meridian Gallery: one floor, three wings, drawn from plain rectangles. Walls and
// display cases both block movement and sight; the gaps in the partitions are the doors,
// and every wing can be reached by at least two routes. Loot stands on small plinths
// (decor only, never colliders) beside the cases, so everything here can be reached.

export const ROOM = { left: 24, top: 84, right: 1256, bottom: 776 };

export function buildLevel() {
  const walls = [
    // The outer shell.
    { x: 8, y: 68, w: 1264, h: 16 },
    { x: 8, y: 776, w: 1264, h: 16 },
    { x: 8, y: 68, w: 16, h: 724 },
    { x: 1256, y: 68, w: 16, h: 724 },
    // The upright partition between the entry hall and the two east wings, with a door
    // gap at y 250..310 (to the vault wing) and another at y 590..650 (to the south wing).
    { x: 423, y: 84, w: 14, h: 166 },
    { x: 423, y: 310, w: 14, h: 280 },
    { x: 423, y: 650, w: 14, h: 126 },
    // The cross partition between the vault wing and the south wing, door gap x 1010..1080.
    { x: 437, y: 423, w: 573, h: 14 },
    { x: 1080, y: 423, w: 176, h: 14 },
  ];

  const covers = [
    { x: 215, y: 225, w: 110, h: 58 }, // entry hall, the cash case
    { x: 620, y: 205, w: 110, h: 58 }, // vault wing, the emerald case
    { x: 640, y: 545, w: 110, h: 58 }, // south wing, the ingot case
    { x: 990, y: 620, w: 110, h: 58 }, // south wing, the pearl case
    { x: 150, y: 520, w: 110, h: 58 }, // entry hall, an empty case: pure cover
    { x: 880, y: 250, w: 46, h: 46 }, // vault wing pillar
    { x: 292, y: 636, w: 46, h: 46 }, // entry hall pillar
  ];

  const loots = [
    { id: 'diamond', name: 'Aurora Diamond', kind: 'diamond', x: 1130, y: 172, value: 50000 },
    { id: 'painting', name: 'Sunset Canvas', kind: 'painting', x: 140, y: 128, value: 8000 },
    { id: 'emerald', name: 'Veridia Emerald', kind: 'emerald', x: 675, y: 292, value: 5300 },
    { id: 'gold', name: 'Gold Ingots', kind: 'gold', x: 695, y: 632, value: 6500 },
    { id: 'pearl', name: 'Pearl Strand', kind: 'pearl', x: 1045, y: 590, value: 4200 },
    { id: 'cash', name: 'Cash Stack', kind: 'cash', x: 270, y: 312, value: 3000 },
  ];

  // Patrol loops, one warden per wing, each an axis-aligned rectangle inside its wing.
  const guardRoutes = [
    [
      [150, 170],
      [355, 170],
      [355, 690],
      [150, 690],
    ],
    [
      [540, 150],
      [1180, 150],
      [1180, 360],
      [540, 360],
    ],
    [
      [540, 700],
      [1180, 700],
      [1180, 520],
      [540, 520],
    ],
  ];

  // Sweeping cameras: base facing, sweep half-width and speed, one phase apart.
  const cameras = [
    { x: 405, y: 104, base: 2.3, sweep: 0.55, speed: 0.42, phase: 2.1 }, // entry hall corner
    { x: 452, y: 104, base: 0.85, sweep: 0.65, speed: 0.55, phase: 0 }, // vault wing corner
    { x: 1228, y: 455, base: 2.5, sweep: 0.6, speed: 0.6, phase: 4.0 }, // south wing corner
  ];

  return {
    walls,
    covers,
    blockers: walls.concat(covers),
    loots,
    guardRoutes,
    cameras,
    exit: { x: 30, y: 684, w: 56, h: 72 },
    start: { x: 96, y: 724 },
  };
}
