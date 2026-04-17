/**
 * Convert an arbitrary sprite sheet into the AI Pixel Office character format.
 *
 * Target format: 112×96 PNG  (7 frames × 16px wide, 3 direction rows × 32px tall)
 *   Row 0 — DOWN  (facing toward camera)
 *   Row 1 — UP    (facing away from camera)
 *   Row 2 — RIGHT (facing right; LEFT is generated automatically by mirror)
 *
 *   Frames per direction row:
 *     0   walk1
 *     1   stand  (also used as IDLE pose)
 *     2   walk2
 *     3   type1  (working / typing)
 *     4   type2
 *     5   read1  (reading / thinking)
 *     6   read2
 *
 * Usage:
 *   npx tsx scripts/convert-character.ts <source.png> [output.png] [--config=<json>]
 *
 * Config JSON (optional, defaults shown for a 5-col × 5-row sheet):
 * {
 *   "cols": 5,           // columns in source sprite sheet
 *   "rows": 5,           // rows in source sprite sheet
 *   "frameW": 0,         // source frame width  (0 = sheet.width / cols)
 *   "frameH": 0,         // source frame height (0 = sheet.height / rows)
 *   "scale": "nearest",  // scaling algorithm: "nearest"
 *   "directions": {
 *     "down":  { "sheetRow": 0, "frames": [2, 2, 2, 0, 0, 0, 0] },
 *     "up":    { "sheetRow": 0, "frames": [2, 2, 2, 0, 0, 0, 0] },
 *     "right": { "sheetRow": 1, "frames": [0, 2, 4, 0, 2, 0, 2] }
 *   }
 * }
 * "frames" array maps each of the 7 output frames → source column index.
 *
 * Example for the anime-boy sprite sheet (5 cols, 5 rows):
 *   right row = row 1 (walk cycle).  Columns 0-4 are walk frames.
 *   down/up   = row 0 (idle poses). Columns 0-4 are idle variants.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

// ── Constants ──────────────────────────────────────────────────────────────────
const OUT_FRAME_W = 16;
const OUT_FRAME_H = 32;
const OUT_FRAMES = 7;
const OUT_DIRS = 3; // down, up, right

// ── Types ──────────────────────────────────────────────────────────────────────
interface DirectionConfig {
  sheetRow: number;
  frames: number[]; // length 7, each = source column index
  flipH?: boolean; // flip horizontally (e.g. left-facing sheet → right)
}

interface ConvertConfig {
  cols: number;
  rows: number;
  frameW: number; // 0 = auto
  frameH: number; // 0 = auto
  scale: 'nearest';
  directions: {
    down: DirectionConfig;
    up: DirectionConfig;
    right: DirectionConfig;
  };
}

// ── Default config for the 5-col anime-boy sheet provided by user ──────────────
const DEFAULT_CONFIG: ConvertConfig = {
  cols: 5,
  rows: 5,
  frameW: 0,
  frameH: 0,
  scale: 'nearest',
  directions: {
    // Row 0 appears to be idle/standing variants — use col 0 as stand, 1 as slight variation
    down: {
      sheetRow: 0,
      frames: [0, 1, 0, 0, 1, 0, 1], // walk=col0-1 alternating, type/read=same idle
    },
    up: {
      sheetRow: 0,
      frames: [0, 1, 0, 0, 1, 0, 1],
    },
    // Row 1 is the walk cycle — 5 frames
    right: {
      sheetRow: 1,
      frames: [0, 2, 4, 0, 2, 0, 2],
      flipH: true, // sheet faces LEFT — flip to get RIGHT
    },
  },
};

// ── Nearest-neighbour scale ────────────────────────────────────────────────────
function scaleNearest(src: Buffer, srcW: number, srcH: number, dstW: number, dstH: number): Buffer {
  const dst = Buffer.alloc(dstW * dstH * 4, 0);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.min(Math.floor(dx * xRatio), srcW - 1);
      const sy = Math.min(Math.floor(dy * yRatio), srcH - 1);
      const si = (sy * srcW + sx) * 4;
      const di = (dy * dstW + dx) * 4;
      dst[di] = src[si];
      dst[di + 1] = src[si + 1];
      dst[di + 2] = src[si + 2];
      dst[di + 3] = src[si + 3];
    }
  }
  return dst;
}

// ── Extract one frame from the source PNG ─────────────────────────────────────
function extractFrame(
  srcData: Buffer,
  srcW: number,
  srcH: number,
  frameW: number,
  frameH: number,
  col: number,
  row: number,
  flipH: boolean,
): Buffer {
  const ox = col * frameW;
  const oy = row * frameH;
  const frameBuf = Buffer.alloc(frameW * frameH * 4, 0);

  for (let r = 0; r < frameH; r++) {
    for (let c = 0; c < frameW; c++) {
      const sx = Math.min(ox + c, srcW - 1);
      const sy = Math.min(oy + r, srcH - 1);
      const si = (sy * srcW + sx) * 4;
      const dc = flipH ? frameW - 1 - c : c;
      const di = (r * frameW + dc) * 4;
      frameBuf[di] = srcData[si];
      frameBuf[di + 1] = srcData[si + 1];
      frameBuf[di + 2] = srcData[si + 2];
      frameBuf[di + 3] = srcData[si + 3];
    }
  }

  // Scale to OUT_FRAME_W × OUT_FRAME_H if needed
  if (frameW === OUT_FRAME_W && frameH === OUT_FRAME_H) return frameBuf;
  return scaleNearest(frameBuf, frameW, frameH, OUT_FRAME_W, OUT_FRAME_H);
}

// ── Main conversion ────────────────────────────────────────────────────────────
function convert(srcPath: string, dstPath: string, cfg: ConvertConfig): void {
  if (!fs.existsSync(srcPath)) {
    console.error(`Source file not found: ${srcPath}`);
    process.exit(1);
  }

  const src = PNG.sync.read(fs.readFileSync(srcPath));
  const srcW = src.width;
  const srcH = src.height;

  const frameW = cfg.frameW || Math.floor(srcW / cfg.cols);
  const frameH = cfg.frameH || Math.floor(srcH / cfg.rows);

  console.log(
    `Source: ${srcW}×${srcH}  →  ${cfg.cols} cols × ${cfg.rows} rows  (${frameW}×${frameH} per frame)`,
  );
  console.log(
    `Output: ${OUT_FRAME_W * OUT_FRAMES}×${OUT_FRAME_H * OUT_DIRS} (${OUT_FRAMES} frames × ${OUT_DIRS} directions)`,
  );

  const outW = OUT_FRAME_W * OUT_FRAMES;
  const outH = OUT_FRAME_H * OUT_DIRS;
  const out = new PNG({ width: outW, height: outH, filterType: -1 });
  out.data.fill(0); // transparent

  const dirOrder: Array<keyof ConvertConfig['directions']> = ['down', 'up', 'right'];

  for (let di = 0; di < OUT_DIRS; di++) {
    const dirKey = dirOrder[di];
    const dirCfg = cfg.directions[dirKey];

    for (let fi = 0; fi < OUT_FRAMES; fi++) {
      const srcCol = dirCfg.frames[fi] ?? 0;
      const srcRow = dirCfg.sheetRow;
      const frame = extractFrame(
        src.data,
        srcW,
        srcH,
        frameW,
        frameH,
        srcCol,
        srcRow,
        dirCfg.flipH ?? false,
      );

      // Write into output at correct position
      const outX = fi * OUT_FRAME_W;
      const outY = di * OUT_FRAME_H;
      for (let r = 0; r < OUT_FRAME_H; r++) {
        for (let c = 0; c < OUT_FRAME_W; c++) {
          const si = (r * OUT_FRAME_W + c) * 4;
          const di2 = ((outY + r) * outW + (outX + c)) * 4;
          out.data[di2] = frame[si];
          out.data[di2 + 1] = frame[si + 1];
          out.data[di2 + 2] = frame[si + 2];
          out.data[di2 + 3] = frame[si + 3];
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, PNG.sync.write(out));
  console.log(`✅ Written: ${dstPath}`);
}

// ── CLI entry point ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
Usage:
  npx tsx scripts/convert-character.ts <source.png> [output.png] [--config=<json-file>]

Examples:
  # Convert with defaults (5×5 anime-boy sheet → char_6.png in assets)
  npx tsx scripts/convert-character.ts my-char.png dist/assets/characters/char_6.png

  # With custom config
  npx tsx scripts/convert-character.ts my-char.png char_6.png --config=char-config.json

Output format: 112×96 PNG (7 frames × 3 directions, each frame 16×32)

Frame layout (per direction row):
  0   walk frame 1   ← used when walking
  1   stand (idle)   ← used when idle / standing still
  2   walk frame 2
  3   type frame 1   ← used when working at desk
  4   type frame 2
  5   read frame 1   ← used when reading files / browsing web
  6   read frame 2

Direction rows:
  Row 0 → DOWN  (facing toward viewer)
  Row 1 → UP    (facing away from viewer)
  Row 2 → RIGHT (LEFT is auto-mirrored by the engine)
`);
  process.exit(0);
}

const srcArg = args[0];
const dstArg = args[1] ?? path.join('dist', 'assets', 'characters', `char_new.png`);

let cfg = { ...DEFAULT_CONFIG };
const cfgArg = args.find((a) => a.startsWith('--config='));
if (cfgArg) {
  const cfgFile = cfgArg.split('=')[1];
  try {
    const raw = JSON.parse(fs.readFileSync(cfgFile, 'utf8')) as Partial<ConvertConfig>;
    cfg = { ...cfg, ...raw };
    console.log(`Loaded config from ${cfgFile}`);
  } catch (e) {
    console.error(`Failed to load config: ${e}`);
    process.exit(1);
  }
}

convert(srcArg, dstArg, cfg);
