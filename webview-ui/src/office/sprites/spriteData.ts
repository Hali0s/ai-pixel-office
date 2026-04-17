import type { ColorValue } from '../../components/ui/types.js';
import { PALETTE_COUNT } from '../../constants.js';
import { adjustSprite } from '../colorize.js';
import type { Direction, SpriteData } from '../types.js';
import { Direction as Dir } from '../types.js';

/** Panda desaturation color settings: full greyscale + contrast boost */
const PANDA_COLOR: ColorValue = { h: 0, s: -100, b: 0, c: 30, colorize: false };
import bubblePermissionData from './bubble-permission.json';
import bubbleWaitingData from './bubble-waiting.json';

// ── Speech Bubble Sprites ───────────────────────────────────────

interface BubbleSpriteJson {
  palette: Record<string, string>;
  pixels: string[][];
}

function resolveBubbleSprite(data: BubbleSpriteJson): SpriteData {
  return data.pixels.map((row) => row.map((key) => data.palette[key] ?? key));
}

/** Permission bubble: white square with "..." in amber, and a tail pointer (11x13) */
export const BUBBLE_PERMISSION_SPRITE: SpriteData = resolveBubbleSprite(bubblePermissionData);

/** Waiting bubble: white square with green checkmark, and a tail pointer (11x13) */
export const BUBBLE_WAITING_SPRITE: SpriteData = resolveBubbleSprite(bubbleWaitingData);

// ════════════════════════════════════════════════════════════════
// Idle Activity Overlay Sprites (pixel art, inline)
// ════════════════════════════════════════════════════════════════

// Coffee cup — 6×7 pixels
// Frame 0: cup held normally | Frame 1: cup slightly tilted (sipping)
// Colours: steam=s, ceramic=b, coffee=c, saucer=k
const _X = '';
const _s = '#B0C4CC'; // steam wisp
const _b = '#7B4C2A'; // brown ceramic
const _c = '#3D1C08'; // dark coffee
const _k = '#C8A060'; // saucer beige

export const COFFEE_CUP_SPRITE: SpriteData = [
  [_X, _s, _X, _s, _X, _X],
  [_X, _b, _b, _b, _b, _X],
  [_b, _c, _c, _c, _c, _b],
  [_b, _c, _c, _c, _c, _b],
  [_X, _b, _b, _b, _b, _X],
  [_X, _k, _k, _k, _k, _X],
  [_k, _k, _k, _k, _k, _k],
];

/** Tilted variant for sipping frame — cup body shifted one row higher */
export const COFFEE_SIPPING_SPRITE: SpriteData = [
  [_X, _b, _b, _b, _b, _X],
  [_b, _c, _c, _c, _c, _b],
  [_b, _c, _c, _c, _c, _b],
  [_X, _b, _b, _b, _b, _X],
  [_X, _s, _X, _s, _X, _X],
  [_X, _k, _k, _k, _k, _X],
  [_k, _k, _k, _k, _k, _k],
];

// ZZZ sleep indicator — 9×5 pixels (three Z letters decreasing in size)
const _z = '#88AAFF'; // soft blue
export const SLEEP_ZZZ_SPRITE: SpriteData = [
  [_z, _z, _z, _z, _X, _z, _z, _z, _X],
  [_X, _X, _X, _z, _X, _X, _z, _X, _X],
  [_X, _X, _z, _X, _X, _z, _X, _X, _X],
  [_z, _z, _z, _z, _X, _z, _z, _z, _X],
  [_X, _X, _X, _X, _X, _X, _X, _X, _X],
];

/** Faded ZZZ (alternate animation frame — lighter alpha) */
export const SLEEP_ZZZ_FADED_SPRITE: SpriteData = SLEEP_ZZZ_SPRITE.map((row) =>
  row.map((px) => (px === _z ? '#4466CC' : px)),
);

// Smartphone — 5×8 pixels
const _p = '#2A2A44'; // phone body
const _sc = '#44AADD'; // screen
const _btn = '#555577'; // button
export const PHONE_SPRITE: SpriteData = [
  [_X, _p, _p, _p, _X],
  [_p, _p, _p, _p, _p],
  [_p, _sc, _sc, _sc, _p],
  [_p, _sc, _sc, _sc, _p],
  [_p, _sc, _sc, _sc, _p],
  [_p, _sc, _sc, _sc, _p],
  [_p, _btn, _btn, _btn, _p],
  [_X, _p, _p, _p, _X],
];

/** Per-frame overlay sprites for each idle activity.
 *  Frame index cycles 0→3 at IDLE_ACTIVITY_FRAME_SEC interval. */
export function getIdleActivitySprite(
  activity: 'coffee' | 'sleep' | 'phone',
  frame: number,
): SpriteData {
  switch (activity) {
    case 'coffee':
      // Frames: 0=hold, 1=sip, 2=hold, 3=hold (pause between sips)
      return frame === 1 ? COFFEE_SIPPING_SPRITE : COFFEE_CUP_SPRITE;
    case 'sleep':
      // Frames: 0=bright, 1=dim, 2=bright, 3=dim
      return frame % 2 === 0 ? SLEEP_ZZZ_SPRITE : SLEEP_ZZZ_FADED_SPRITE;
    case 'phone':
      return PHONE_SPRITE;
  }
}

// ════════════════════════════════════════════════════════════════
// Loaded character sprites (from PNG assets)
// ════════════════════════════════════════════════════════════════

interface LoadedCharacterData {
  down: SpriteData[];
  up: SpriteData[];
  right: SpriteData[];
}

let loadedCharacters: LoadedCharacterData[] | null = null;
let loadedFemaleCharacters: LoadedCharacterData[] | null = null;
let loadedMaleCharacters: LoadedCharacterData[] | null = null;

interface CharacterTemplates {
  neutral: LoadedCharacterData[];
  female?: LoadedCharacterData[];
  male?: LoadedCharacterData[];
}

/** Set pre-colored character sprites loaded from PNG assets. Call this when characterSpritesLoaded message arrives. */
export function setCharacterTemplates({ neutral, female, male }: CharacterTemplates): void {
  loadedCharacters = neutral;
  loadedFemaleCharacters = female ?? null;
  loadedMaleCharacters = male ?? null;
  // Clear cache so sprites are rebuilt from loaded data
  spriteCache.clear();
}

/** Return the number of loaded character palettes, or PALETTE_COUNT as fallback. */
export function getLoadedCharacterCount(): number {
  return loadedCharacters ? loadedCharacters.length : PALETTE_COUNT;
}

/** Return true if gender-specific sprites are available for the given gender. */
export function hasGenderSprites(gender: string): boolean {
  if (gender === 'female') return loadedFemaleCharacters !== null;
  if (gender === 'male') return loadedMaleCharacters !== null;
  return false;
}

/** Flip a SpriteData horizontally (for generating left sprites from right) */
function flipSpriteHorizontal(sprite: SpriteData): SpriteData {
  return sprite.map((row) => [...row].reverse());
}

// ════════════════════════════════════════════════════════════════
// Sprite resolution + caching
// ════════════════════════════════════════════════════════════════

export interface CharacterSprites {
  walk: Record<Direction, [SpriteData, SpriteData, SpriteData, SpriteData]>;
  typing: Record<Direction, [SpriteData, SpriteData]>;
  reading: Record<Direction, [SpriteData, SpriteData]>;
}

const spriteCache = new Map<string, CharacterSprites>();

/** Apply panda (B&W) desaturation to every sprite in a CharacterSprites set */
function pandaColorSprites(sprites: CharacterSprites): CharacterSprites {
  const shift = (s: SpriteData) => adjustSprite(s, PANDA_COLOR);
  const shiftWalk = (
    arr: [SpriteData, SpriteData, SpriteData, SpriteData],
  ): [SpriteData, SpriteData, SpriteData, SpriteData] => [
    shift(arr[0]),
    shift(arr[1]),
    shift(arr[2]),
    shift(arr[3]),
  ];
  const shiftPair = (arr: [SpriteData, SpriteData]): [SpriteData, SpriteData] => [
    shift(arr[0]),
    shift(arr[1]),
  ];
  return {
    walk: {
      [Dir.DOWN]: shiftWalk(sprites.walk[Dir.DOWN]),
      [Dir.UP]: shiftWalk(sprites.walk[Dir.UP]),
      [Dir.RIGHT]: shiftWalk(sprites.walk[Dir.RIGHT]),
      [Dir.LEFT]: shiftWalk(sprites.walk[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData, SpriteData, SpriteData]>,
    typing: {
      [Dir.DOWN]: shiftPair(sprites.typing[Dir.DOWN]),
      [Dir.UP]: shiftPair(sprites.typing[Dir.UP]),
      [Dir.RIGHT]: shiftPair(sprites.typing[Dir.RIGHT]),
      [Dir.LEFT]: shiftPair(sprites.typing[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData]>,
    reading: {
      [Dir.DOWN]: shiftPair(sprites.reading[Dir.DOWN]),
      [Dir.UP]: shiftPair(sprites.reading[Dir.UP]),
      [Dir.RIGHT]: shiftPair(sprites.reading[Dir.RIGHT]),
      [Dir.LEFT]: shiftPair(sprites.reading[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData]>,
  };
}

/** Apply hue shift to every sprite in a CharacterSprites set */
function hueShiftSprites(sprites: CharacterSprites, hueShift: number): CharacterSprites {
  const color: ColorValue = { h: hueShift, s: 0, b: 0, c: 0 };
  const shift = (s: SpriteData) => adjustSprite(s, color);
  const shiftWalk = (
    arr: [SpriteData, SpriteData, SpriteData, SpriteData],
  ): [SpriteData, SpriteData, SpriteData, SpriteData] => [
    shift(arr[0]),
    shift(arr[1]),
    shift(arr[2]),
    shift(arr[3]),
  ];
  const shiftPair = (arr: [SpriteData, SpriteData]): [SpriteData, SpriteData] => [
    shift(arr[0]),
    shift(arr[1]),
  ];
  return {
    walk: {
      [Dir.DOWN]: shiftWalk(sprites.walk[Dir.DOWN]),
      [Dir.UP]: shiftWalk(sprites.walk[Dir.UP]),
      [Dir.RIGHT]: shiftWalk(sprites.walk[Dir.RIGHT]),
      [Dir.LEFT]: shiftWalk(sprites.walk[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData, SpriteData, SpriteData]>,
    typing: {
      [Dir.DOWN]: shiftPair(sprites.typing[Dir.DOWN]),
      [Dir.UP]: shiftPair(sprites.typing[Dir.UP]),
      [Dir.RIGHT]: shiftPair(sprites.typing[Dir.RIGHT]),
      [Dir.LEFT]: shiftPair(sprites.typing[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData]>,
    reading: {
      [Dir.DOWN]: shiftPair(sprites.reading[Dir.DOWN]),
      [Dir.UP]: shiftPair(sprites.reading[Dir.UP]),
      [Dir.RIGHT]: shiftPair(sprites.reading[Dir.RIGHT]),
      [Dir.LEFT]: shiftPair(sprites.reading[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData]>,
  };
}

/** Create a transparent placeholder sprite of given dimensions */
function emptySprite(w: number, h: number): SpriteData {
  const rows: string[][] = [];
  for (let y = 0; y < h; y++) {
    rows.push(new Array(w).fill(''));
  }
  return rows;
}

/** Clear the sprite cache (call after character customization changes) */
export function clearCharacterSpriteCache(): void {
  spriteCache.clear();
}

export function getCharacterSprites(
  paletteIndex: number,
  hueShift = 0,
  isPanda = false,
  gender?: string,
): CharacterSprites {
  const genderKey = gender === 'female' ? 'f' : gender === 'male' ? 'm' : 'n';
  const cacheKey = `${paletteIndex}:${hueShift}:${isPanda ? 'panda' : ''}:${genderKey}`;
  const cached = spriteCache.get(cacheKey);
  if (cached) return cached;

  let sprites: CharacterSprites;

  // Pick the gender-specific bank if available, fall back to neutral
  const genderBank =
    gender === 'female' && loadedFemaleCharacters
      ? loadedFemaleCharacters
      : gender === 'male' && loadedMaleCharacters
        ? loadedMaleCharacters
        : loadedCharacters;

  if (genderBank) {
    // Use pre-colored character sprites directly (no palette swapping)
    const char = genderBank[paletteIndex % genderBank.length];
    const d = char.down;
    const u = char.up;
    const rt = char.right;
    const flip = flipSpriteHorizontal;

    sprites = {
      walk: {
        [Dir.DOWN]: [d[0], d[1], d[2], d[1]],
        [Dir.UP]: [u[0], u[1], u[2], u[1]],
        [Dir.RIGHT]: [rt[0], rt[1], rt[2], rt[1]],
        [Dir.LEFT]: [flip(rt[0]), flip(rt[1]), flip(rt[2]), flip(rt[1])],
      },
      typing: {
        [Dir.DOWN]: [d[3], d[4]],
        [Dir.UP]: [u[3], u[4]],
        [Dir.RIGHT]: [rt[3], rt[4]],
        [Dir.LEFT]: [flip(rt[3]), flip(rt[4])],
      },
      reading: {
        [Dir.DOWN]: [d[5], d[6]],
        [Dir.UP]: [u[5], u[6]],
        [Dir.RIGHT]: [rt[5], rt[6]],
        [Dir.LEFT]: [flip(rt[5]), flip(rt[6])],
      },
    };
  } else {
    // Fallback: return transparent placeholder sprites (16×32)
    const e = emptySprite(16, 32);
    const walkSet: [SpriteData, SpriteData, SpriteData, SpriteData] = [e, e, e, e];
    const pairSet: [SpriteData, SpriteData] = [e, e];
    sprites = {
      walk: {
        [Dir.DOWN]: walkSet,
        [Dir.UP]: walkSet,
        [Dir.RIGHT]: walkSet,
        [Dir.LEFT]: walkSet,
      },
      typing: {
        [Dir.DOWN]: pairSet,
        [Dir.UP]: pairSet,
        [Dir.RIGHT]: pairSet,
        [Dir.LEFT]: pairSet,
      },
      reading: {
        [Dir.DOWN]: pairSet,
        [Dir.UP]: pairSet,
        [Dir.RIGHT]: pairSet,
        [Dir.LEFT]: pairSet,
      },
    };
  }

  // Apply hue shift if non-zero
  if (hueShift !== 0) {
    sprites = hueShiftSprites(sprites, hueShift);
  }

  // Apply panda (black & white) desaturation
  if (isPanda) {
    sprites = pandaColorSprites(sprites);
  }

  spriteCache.set(cacheKey, sprites);
  return sprites;
}
