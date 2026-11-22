// Every tuning number and colour in one place. The playfield is a fixed 1280x800 logical
// area: a 64 px HUD strip over the gallery floor. The renderer letterboxes it into the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 800, hudHeight: 64 };
export const STEP = 1 / 60;

export const PLAYER = { radius: 13, walkSpeed: 152, sneakSpeed: 84 };
export const GUARD = { radius: 14, patrolSpeed: 62, investigateSpeed: 110, catchDistance: 28 };
export const COIN = { count: 3, maxThrow: 330, lureRadius: 340, lureSeconds: 2.6 };

export const VISION = {
  guardRange: 182,
  guardHalfAngle: 0.6,
  cameraRange: 170,
  cameraHalfAngle: 0.46,
};

export const ALARM = {
  max: 100,
  guardRate: 58, // a second at point blank in a guard's cone, scaled down with distance
  cameraRate: 40,
  decay: 10, // per second while nobody sees the thief
  diamondTrip: 12, // the pedestal's pressure plate, paid once when the diamond is lifted
};

export const PALETTE = {
  backdrop: '#0b0e16',
  hudBar: '#12172a',
  brass: '#c9a86a',
  floor: '#242c42',
  floorAlt: '#212940',
  rug: '#33254d',
  wall: '#47516e',
  wallTop: '#5b688c',
  caseWood: '#4a3826',
  caseGlass: 'rgba(150, 200, 235, 0.30)',
  pillar: '#59637e',
  guardCone: 'rgba(255, 186, 73, 0.17)',
  guardConeEdge: 'rgba(255, 186, 73, 0.55)',
  cameraCone: 'rgba(255, 84, 84, 0.15)',
  cameraConeEdge: 'rgba(255, 84, 84, 0.5)',
  alertCone: 'rgba(255, 60, 50, 0.30)',
  alertConeEdge: 'rgba(255, 60, 50, 0.8)',
  thief: '#39d0c4',
  thiefDark: '#0e6e66',
  guardBody: '#31456e',
  guardCap: '#1d2a47',
  skin: '#e8b98a',
  gold: '#ffd257',
  diamond: '#7ef0ff',
  emerald: '#4fe38a',
  cash: '#7dc95f',
  pearl: '#f2ead8',
  exit: '#39e08a',
  text: '#eef1f8',
  textDim: '#9aa5c0',
  danger: '#ff5a4e',
};

export const FONT = {
  title: '64px Georgia, "Times New Roman", serif',
  subtitle: '20px Georgia, "Times New Roman", serif',
  hud: '600 17px system-ui, -apple-system, sans-serif',
  hudSmall: '600 12px system-ui, -apple-system, sans-serif',
  label: '600 11px system-ui, -apple-system, sans-serif',
  body: '16px system-ui, -apple-system, sans-serif',
};
