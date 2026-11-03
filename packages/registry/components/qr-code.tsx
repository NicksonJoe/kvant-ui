import { RotateCcw } from 'lucide-react';
import { useMemo, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Announce } from './visually-hidden';

/* ---------- Encoder: byte mode, ISO/IEC 18004 ---------- */

export const QR_LEVELS = ['L', 'M', 'Q', 'H'] as const;
export type QrLevel = (typeof QR_LEVELS)[number];

export interface QrMatrix {
  /** 1–40; the side is 4 × version + 17 modules. */
  version: number;
  level: QrLevel;
  /** Mask pattern 0–7. */
  mask: number;
  size: number;
  /** `modules[y][x]`, true is dark. */
  modules: readonly (readonly boolean[])[];
}

export interface EncodeQrOptions {
  /** Error correction: L 7 %, M 15 % (default), Q 25 %, H 30 % of the code can be lost. */
  level?: QrLevel;
  /** Force a mask 0–7; by default the one with the lowest penalty is chosen. */
  mask?: number;
}

// Codewords of error correction per block and the number of blocks, by level and version (index 0 unused).
const ECC_PER_BLOCK: Record<QrLevel, readonly number[]> = {
  L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};
const BLOCKS: Record<QrLevel, readonly number[]> = {
  L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};
/** Two bits of the level in the format information. */
const LEVEL_BITS: Record<QrLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

const bit = (value: number, index: number) => ((value >>> index) & 1) !== 0;

/** Modules left for data and error correction once the function patterns are drawn. */
function rawModules(version: number): number {
  let modules = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    modules -= (25 * align - 10) * align - 55;
    if (version >= 7) modules -= 36;
  }
  return modules;
}

const dataCodewords = (version: number, level: QrLevel) =>
  Math.floor(rawModules(version) / 8) - (ECC_PER_BLOCK[level][version] ?? 0) * (BLOCKS[level][version] ?? 0);

/** Multiplication in GF(2⁸) modulo x⁸ + x⁴ + x³ + x² + 1. */
function gfMultiply(x: number, y: number): number {
  let product = 0;
  for (let i = 7; i >= 0; i--) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((y >>> i) & 1) * x;
  }
  return product;
}

/** Reed–Solomon generator (x − α⁰)(x − α¹)…(x − α^(degree−1)), highest coefficient dropped. */
function rsGenerator(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j] ?? 0, root) ^ (result[j + 1] ?? 0);
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: readonly number[], generator: readonly number[]): number[] {
  const result = generator.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    generator.forEach((coefficient, i) => {
      result[i] = (result[i] ?? 0) ^ gfMultiply(coefficient, factor);
    });
  }
  return result;
}

/** Data codewords split into blocks, error correction added, both interleaved. */
function addErrorCorrection(data: readonly number[], version: number, level: QrLevel): number[] {
  const blockCount = BLOCKS[level][version] ?? 1;
  const eccLength = ECC_PER_BLOCK[level][version] ?? 0;
  const raw = Math.floor(rawModules(version) / 8);
  const shortBlocks = blockCount - (raw % blockCount);
  const shortLength = Math.floor(raw / blockCount);
  const generator = rsGenerator(eccLength);

  const blocks: number[][] = [];
  for (let i = 0, offset = 0; i < blockCount; i++) {
    const chunk = data.slice(offset, offset + shortLength - eccLength + (i < shortBlocks ? 0 : 1));
    offset += chunk.length;
    const ecc = rsRemainder(chunk, generator);
    // a short block gets a placeholder so all blocks line up column by column
    blocks.push([...chunk, ...(i < shortBlocks ? [0] : []), ...ecc]);
  }
  const result: number[] = [];
  for (let i = 0; i < (blocks[0]?.length ?? 0); i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLength - eccLength || j >= shortBlocks) result.push(block[i] ?? 0);
    });
  }
  return result;
}

function alignmentCenters(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const centers = [6];
  for (let position = version * 4 + 10; centers.length < count; position -= step) centers.splice(1, 0, position);
  return centers;
}

class Grid {
  readonly size: number;
  readonly modules: boolean[][];
  readonly reserved: boolean[][];

  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }

  set(x: number, y: number, dark: boolean): void {
    const row = this.modules[y];
    const reservedRow = this.reserved[y];
    if (!row || !reservedRow || x < 0 || x >= this.size) return;
    row[x] = dark;
    reservedRow[x] = true;
  }

  isReserved(x: number, y: number): boolean {
    return this.reserved[y]?.[x] === true;
  }

  dark(x: number, y: number): boolean {
    return this.modules[y]?.[x] === true;
  }
}

function drawFunctionPatterns(grid: Grid, version: number): void {
  const size = grid.size;
  for (let i = 0; i < size; i++) {
    grid.set(6, i, i % 2 === 0);
    grid.set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    // the 7×7 finder and its light separator
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const ring = Math.max(Math.abs(dx), Math.abs(dy));
        grid.set(cx + dx, cy + dy, ring !== 2 && ring !== 4);
      }
    }
  }
  const centers = alignmentCenters(version);
  const last = centers.length - 1;
  centers.forEach((cy, i) => {
    centers.forEach((cx, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) grid.set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    });
  });
  drawFormat(grid, 'M', 0);
  if (version >= 7) {
    let remainder = version;
    for (let i = 0; i < 12; i++) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    const bits = (version << 12) | remainder;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      grid.set(a, b, bit(bits, i));
      grid.set(b, a, bit(bits, i));
    }
  }
}

/** Level and mask, BCH(15,5) protected, in both copies; also the dark module. */
function drawFormat(grid: Grid, level: QrLevel, mask: number): void {
  const size = grid.size;
  const data = (LEVEL_BITS[level] << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  const bits = ((data << 10) | remainder) ^ 0x5412;
  for (let i = 0; i <= 5; i++) grid.set(8, i, bit(bits, i));
  grid.set(8, 7, bit(bits, 6));
  grid.set(8, 8, bit(bits, 7));
  grid.set(7, 8, bit(bits, 8));
  for (let i = 9; i < 15; i++) grid.set(14 - i, 8, bit(bits, i));
  for (let i = 0; i < 8; i++) grid.set(size - 1 - i, 8, bit(bits, i));
  for (let i = 8; i < 15; i++) grid.set(8, size - 15 + i, bit(bits, i));
  grid.set(8, size - 8, true);
}

/** Codeword bits in the two-column zigzag from the bottom right, skipping the vertical timing column. */
function drawCodewords(grid: Grid, codewords: readonly number[]): void {
  const size = grid.size;
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - step : step;
        if (grid.isReserved(x, y) || index >= codewords.length * 8) continue;
        const row = grid.modules[y];
        if (row) row[x] = bit(codewords[index >>> 3] ?? 0, 7 - (index & 7));
        index++;
      }
    }
  }
}

function applyMask(grid: Grid, mask: number): void {
  const test = MASKS[mask];
  if (!test) return;
  for (let y = 0; y < grid.size; y++) {
    const row = grid.modules[y];
    for (let x = 0; x < grid.size; x++) {
      if (row && !grid.isReserved(x, y) && test(x, y)) row[x] = !row[x];
    }
  }
}

/** ISO penalty: runs of 5+, 2×2 blocks, finder look-alikes (the quiet zone counts as light), dark balance. */
function penalty(grid: Grid): number {
  const size = grid.size;
  let score = 0;
  const line = (read: (i: number) => boolean) => {
    let run = 0;
    let previous = false;
    for (let i = 0; i < size; i++) {
      const dark = read(i);
      if (i > 0 && dark === previous) run++;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
        previous = dark;
      }
    }
    if (run >= 5) score += run - 2;
    // 1:1:3:1:1 with four light modules before or after it
    const at = (i: number) => i >= 0 && i < size && read(i);
    for (let i = -4; i < size; i++) {
      const core = at(i) && !at(i + 1) && at(i + 2) && at(i + 3) && at(i + 4) && !at(i + 5) && at(i + 6);
      if (!core) continue;
      const before = !at(i - 1) && !at(i - 2) && !at(i - 3) && !at(i - 4);
      const after = !at(i + 7) && !at(i + 8) && !at(i + 9) && !at(i + 10);
      if (before || after) score += 40;
    }
  };
  for (let y = 0; y < size; y++) line((x) => grid.dark(x, y));
  for (let x = 0; x < size; x++) line((y) => grid.dark(x, y));
  let dark = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid.dark(x, y)) dark++;
      if (x < size - 1 && y < size - 1) {
        const color = grid.dark(x, y);
        if (color === grid.dark(x + 1, y) && color === grid.dark(x, y + 1) && color === grid.dark(x + 1, y + 1)) score += 3;
      }
    }
  }
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

/** QR code of `value` as UTF-8 bytes in the smallest version that fits the level; throws RangeError past version 40. */
export function encodeQr(value: string, { level = 'M', mask }: EncodeQrOptions = {}): QrMatrix {
  if (mask !== undefined && (!Number.isInteger(mask) || mask < 0 || mask > 7)) throw new RangeError(`QR mask must be 0–7, got ${mask}`);
  const bytes = new TextEncoder().encode(value);
  let version = 1;
  const lengthBits = (v: number) => (v <= 9 ? 8 : 16);
  while (version <= 40 && 4 + lengthBits(version) + bytes.length * 8 > dataCodewords(version, level) * 8) version++;
  if (version > 40) throw new RangeError(`${bytes.length} bytes do not fit a QR code at level ${level}`);

  const capacity = dataCodewords(version, level) * 8;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, lengthBits(version));
  for (const byte of bytes) push(byte, 8);
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((byte, b) => (byte << 1) | b, 0));

  const grid = new Grid(version * 4 + 17);
  drawFunctionPatterns(grid, version);
  drawCodewords(grid, addErrorCorrection(data, version, level));

  let chosen = mask ?? 0;
  if (mask === undefined) {
    let best = Infinity;
    for (let candidate = 0; candidate < 8; candidate++) {
      applyMask(grid, candidate);
      drawFormat(grid, level, candidate);
      const score = penalty(grid);
      if (score < best) {
        best = score;
        chosen = candidate;
      }
      applyMask(grid, candidate);
    }
  }
  applyMask(grid, chosen);
  drawFormat(grid, level, chosen);
  return { version, level, mask: chosen, size: grid.size, modules: grid.modules };
}

/* ---------- Rendering ---------- */

// Fixed in both themes: inverted or tinted codes fail on part of the cameras.
const PLATE = '#ffffff';
const INK = '#14171c';
const QUIET_ZONE = 4;

export const QR_CODE_SIZES = { sm: 96, md: 144, lg: 200, xl: 280 } as const;
export type QrCodeSize = keyof typeof QR_CODE_SIZES;
export const QR_CODE_STATES = ['ready', 'loading', 'expired', 'error'] as const;
export type QrCodeState = (typeof QR_CODE_STATES)[number];

/** One `M x y h len v1 h-len z` per horizontal run of dark modules. */
function modulesPath(matrix: QrMatrix): string {
  let d = '';
  matrix.modules.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      let end = x;
      while (row[end + 1]) end++;
      d += `M${x} ${y}h${end - x + 1}v1h-${end - x + 1}z`;
      x = end;
    }
  });
  return d;
}

const MESSAGES: Partial<Record<QrCodeState, string>> = { expired: 'Код истёк', error: 'Не удалось создать код' };

export interface QrCodeProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the camera opens: a link (norda.cloud/pay/7Kx2-318) or any text, encoded as UTF-8. */
  value: string;
  /** Plate with the quiet zone: sm 96 in a row, md 144 in a popover, lg 200 in a card or dialog, xl 280 on a connect screen. */
  size?: QrCodeSize;
  /** Error correction; M by default, H with a logo. */
  level?: QrLevel;
  /** Mark in the middle on a white pad, 22.5 % of the plate. */
  logo?: ReactNode;
  /** loading — the plate holds its place; expired and error offer «Обновить». */
  state?: QrCodeState;
  /** «Обновить» over an expired or failed code; without it there is no button. */
  onRefresh?: () => void;
  /** Name of the image: «QR-код: оплата счёта № 318». */
  'aria-label'?: string;
}

/**
 * QR code on a white plate with a 4-module quiet zone, dark modules in both themes. Put the same link next to it
 * as text with «Копировать»: a phone cannot scan its own screen.
 */
export function QrCode({
  value,
  size = 'lg',
  level,
  logo,
  state = 'ready',
  onRefresh,
  'aria-label': label = 'QR-код',
  className,
  style,
  ...props
}: QrCodeProps) {
  const correction = level ?? (logo ? 'H' : 'M');
  const matrix = useMemo(() => {
    try {
      return encodeQr(value, { level: correction });
    } catch {
      return null;
    }
  }, [value, correction]);
  const shown: QrCodeState = state === 'ready' && !matrix ? 'error' : state;

  const [previous, setPrevious] = useState(shown);
  const [message, setMessage] = useState('');
  if (shown !== previous) {
    setPrevious(shown);
    setMessage(MESSAGES[shown] ?? (shown === 'ready' && previous !== 'loading' ? 'Код обновлён' : ''));
  }

  const px = QR_CODE_SIZES[size];
  const side = matrix ? matrix.size + QUIET_ZONE * 2 : 0;
  const blocked = shown === 'expired' || shown === 'error';
  // finder outlines of the loading plate scale with it: 36 px, 16 px in, 6 px ring on a 160 plate
  const finder = Math.round(px * 0.225);
  const inset = Math.round(px * 0.1);
  const ring = Math.round(px * 0.0375);

  return (
    <div
      data-slot="qr-code"
      data-size={size}
      data-state={shown}
      data-level={correction}
      aria-busy={shown === 'loading' || undefined}
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden shadow-[inset_0_0_0_1px_var(--color-hairline)]',
        size === 'sm' ? 'rounded-sm' : 'rounded-md',
        shown === 'loading' ? 'bg-fill-1' : 'bg-[#fff]',
        className,
      )}
      style={{ width: px, height: px, ...style }}
      {...props}
    >
      {shown === 'loading' ? (
        <>
          {(['left-(--i) top-(--i)', 'right-(--i) top-(--i)', 'left-(--i) bottom-(--i)'] as const).map((place) => (
            <span
              key={place}
              data-slot="qr-code-finder"
              aria-hidden
              className={cn('absolute rounded-sm', place)}
              style={{ '--i': `${inset}px`, width: finder, height: finder, boxShadow: `inset 0 0 0 ${ring}px var(--color-fill-2)` } as CSSProperties}
            />
          ))}
          <svg data-slot="qr-code-spinner" aria-hidden viewBox="0 0 40 40" width={28} height={28} fill="none" strokeWidth={4} className="animate-spinner">
            <circle cx="20" cy="20" r="15" stroke="var(--color-fill-3)" />
            <path d="M20 5a15 15 0 0 1 15 15" stroke="var(--color-accent)" strokeLinecap="round" />
          </svg>
        </>
      ) : matrix && shown !== 'error' ? (
        <svg
          role="img"
          aria-label={label}
          viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${side} ${side}`}
          width={px}
          height={px}
          shapeRendering="crispEdges"
          className={cn('absolute inset-0', blocked && 'opacity-35 blur-[3px]')}
        >
          <rect x={-QUIET_ZONE} y={-QUIET_ZONE} width={side} height={side} fill={PLATE} />
          <path data-slot="qr-code-modules" d={modulesPath(matrix)} fill={INK} />
        </svg>
      ) : null}
      {logo && shown === 'ready' ? (
        <span
          data-slot="qr-code-logo"
          aria-hidden
          className="relative grid place-items-center rounded-[25%] bg-[#fff] p-1 [&>*]:max-h-full [&>*]:max-w-full"
          style={{ width: finder, height: finder }}
        >
          {logo}
        </span>
      ) : null}
      {blocked ? (
        <div data-slot="qr-code-overlay" className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-2 text-center">
          <span className={cn('font-semibold', size === 'sm' ? 'text-caption' : 'text-label-md')} style={{ color: INK }}>
            {MESSAGES[shown]}
          </span>
          {onRefresh ? (
            <Button size={size === 'sm' ? 'xs' : 'sm'} leadingIcon={<RotateCcw aria-hidden />} onClick={onRefresh}>
              Обновить
            </Button>
          ) : null}
        </div>
      ) : null}
      <Announce>{message}</Announce>
    </div>
  );
}

export interface QrCodeImageOptions extends EncodeQrOptions {
  /** Side in px with the quiet zone; 1024 prints sharp at 2 × 2 cm and larger. */
  size?: number;
}

/** PNG data URL for «Скачать PNG» and print: same plate and modules, 4-module quiet zone. Browser only (canvas). */
export function qrCodeToDataUrl(value: string, { size = 1024, ...options }: QrCodeImageOptions = {}): string {
  const matrix = encodeQr(value, options);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  const scale = size / (matrix.size + QUIET_ZONE * 2);
  context.fillStyle = PLATE;
  context.fillRect(0, 0, size, size);
  context.fillStyle = INK;
  matrix.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      // whole pixels on both edges: no seams between neighbouring modules
      if (dark) {
        const left = Math.round((x + QUIET_ZONE) * scale);
        const top = Math.round((y + QUIET_ZONE) * scale);
        context.fillRect(left, top, Math.round((x + QUIET_ZONE + 1) * scale) - left, Math.round((y + QUIET_ZONE + 1) * scale) - top);
      }
    });
  });
  return canvas.toDataURL('image/png');
}
