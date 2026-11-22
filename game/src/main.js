// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between three screens: the title, the night
// itself, and the night ended — busted or gone — from which a click or Enter starts
// the next attempt. Behind the title the gallery idles on, wardens walking their
// rounds, so the room the player enters is already alive.
//
// ?seed=N fixes the loot sparkles. ?shot=title|cover|sneak|getaway (with &seed=N)
// stages that scene instead of running the loop, paints it and sets
// window.__shotReady for a screenshot.

import { FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld,
  EVENT_BUSTED,
  EVENT_DIAMOND,
  EVENT_ESCAPED,
  EVENT_PICKUP,
  EVENT_SPOTTED,
  EVENT_TOSS,
} from './world.js';
import { ACTION_CONFIRM, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_BUSTED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;
const IDLE = { dx: 0, dy: 0, sneak: false, toss: null };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 7;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas, createRandom(seed));
const input = createInput(canvas, FIELD);
const audio = createAudio();

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
  canvas.style.left = `${Math.floor((window.innerWidth - FIELD.width * scale) / 2)}px`;
  canvas.style.top = `${Math.floor((window.innerHeight - FIELD.height * scale) / 2)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

if (shot !== null) {
  const screen = stageShot(shot, world);
  renderer.draw(world.state, screen);
  renderer.draw(world.state, screen);
  window.__shotReady = true;
} else {
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();

  const STATUS_TEXT = {
    [SCREEN_TITLE]: 'The Meridian Job. Click or press Enter to slip inside.',
    [SCREEN_PLAY]: 'The night is on: lift the Aurora Diamond and reach the exit.',
    [SCREEN_BUSTED]: 'Busted. Click or press Enter to try again.',
    [SCREEN_WIN]: 'Clean getaway. Click or press Enter to play again.',
  };
  status.textContent = STATUS_TEXT[screen];

  function setScreen(next) {
    if (next === screen) return;
    screen = next;
    status.textContent = STATUS_TEXT[screen];
  }

  function frame(now) {
    requestAnimationFrame(frame);
    let elapsed = (now - last) / 1000;
    last = now;
    if (elapsed > MAX_FRAME) elapsed = MAX_FRAME;
    const actions = input.takeActions();
    const click = input.takeClick();

    if (screen === SCREEN_TITLE) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        world.step(STEP, IDLE);
        accumulator -= STEP;
      }
      if (actions & ACTION_CONFIRM) {
        audio.unlock();
        world.reset();
        accumulator = 0;
        setScreen(SCREEN_PLAY);
      }
    } else if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      let toss = click;
      while (accumulator >= STEP) {
        const axes = input.axes();
        const events = world.step(STEP, { dx: axes.dx, dy: axes.dy, sneak: axes.sneak, toss });
        toss = null;
        accumulator -= STEP;
        if (events & EVENT_TOSS) audio.toss();
        if (events & EVENT_PICKUP) audio.pickup();
        if (events & EVENT_DIAMOND) audio.diamond();
        if (events & EVENT_SPOTTED) audio.spotted();
        if (events & EVENT_BUSTED) {
          audio.busted();
          setScreen(SCREEN_BUSTED);
          break;
        }
        if (events & EVENT_ESCAPED) {
          audio.win();
          setScreen(SCREEN_WIN);
          break;
        }
      }
    } else if (actions & ACTION_CONFIRM) {
      audio.unlock();
      world.reset();
      accumulator = 0;
      setScreen(SCREEN_PLAY);
    }

    renderer.draw(world.state, screen);
  }
  requestAnimationFrame(frame);
}
