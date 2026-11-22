// Keyboard and pointer input. Held keys give a movement direction and the tiptoe
// modifier; one-shot presses and clicks are queued and taken once by the loop, so a
// press between two frames is never lost and never counted twice. A click means
// "confirm" on the menu screens and "toss a decoy coin there" in play; the loop
// decides which by the screen it is on.

export const ACTION_CONFIRM = 1;

const MOVE_KEYS = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export function createInput(canvas, view) {
  const held = new Set();
  let actions = 0;
  let click = null;
  const mouse = { x: 0, y: 0 };

  function toLogical(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * view.width,
      y: ((e.clientY - rect.top) / rect.height) * view.height,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (MOVE_KEYS[e.code] || e.code === 'Space') e.preventDefault();
    if (e.code === 'Enter' || e.code === 'Space') actions |= ACTION_CONFIRM;
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointermove', (e) => {
    const p = toLogical(e);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLogical(e);
    mouse.x = p.x;
    mouse.y = p.y;
    click = p;
    actions |= ACTION_CONFIRM;
  });

  return {
    axes() {
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        const m = MOVE_KEYS[code];
        if (m) {
          dx += m[0];
          dy += m[1];
        }
      }
      return { dx, dy, sneak: held.has('ShiftLeft') || held.has('ShiftRight') };
    },
    takeActions() {
      const a = actions;
      actions = 0;
      return a;
    },
    takeClick() {
      const c = click;
      click = null;
      return c;
    },
    mousePosition() {
      return mouse;
    },
  };
}
