import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QrCode, encodeQr, type QrLevel, type QrMatrix } from '..';

interface Reference {
  text: string;
  level: QrLevel;
  mask: number;
  version: number;
  /** Rows top to bottom as hex, the leftmost module is the highest bit; made by python-qrcode 8 (byte mode, border 0). */
  rows: string;
}

const REFERENCES: readonly Reference[] = [
  { text: 'HELLO', level: 'H', mask: 0, version: 1,
    rows: '1fdd7f 104741 17405d 175a5d 17495d 104741 1fd57f 000900 05dd89 01a382 0f765f 07b3c2 175a94 001766 1fcaa7 105a70 1756a7 174126 1751d5 104652 1fcfa7' },
  { text: 'HELLO', level: 'H', mask: 1, version: 1,
    rows: '1fc77f 105d41 175a5d 17505d 17535d 105d41 1fd57f 000300 04f7be 0b0928 05dcf5 0d1968 1df03e 001dcc 1fd00d 1050da 174c0d 174b8c 175b7f 104cf8 1fc50d' },
  { text: 'HELLO', level: 'H', mask: 2, version: 1,
    rows: '1fd17f 105441 175c5d 17495d 17455d 105441 1fd57f 001a00 0751e7 19000c 086a2e 1f104c 1046e5 0014e8 1fc6d6 1049fe 175ad6 1752a8 175da4 1045dc 1fc3d6' },
  { text: 'HELLO', level: 'H', mask: 3, version: 1,
    rows: '1fc17f 104f41 17415d 17495d 175e5d 104941 1fd57f 001100 067cd0 19000c 1ef143 043dfa 1046e5 001f85 1fdb60 1049fe 1741bb 175f1e 175da4 104eb1 1fce60' },
  { text: 'HELLO', level: 'H', mask: 4, version: 1,
    rows: '1fc97f 105c41 174b5d 174e5d 174d5d 105c41 1fd57f 001d00 01e962 1738ef 19ed32 0e9750 1e7e06 001c0b 1fd1ca 105ee2 175235 174a4b 174ab8 1042c0 1fcb35' },
  { text: 'HELLO', level: 'H', mask: 5, version: 1,
    rows: '1fd77f 104c41 175c5d 17455d 17555d 104c41 1fd57f 001200 00c155 1e1c7d 086a2e 1d186c 1df03e 001cc8 1fc6d6 10558f 174ad6 174a88 174b7f 104dfc 1fc3d6' },
  { text: 'HELLO', level: 'H', mask: 6, version: 1,
    rows: '1fc77f 104c41 17585d 17555d 17475d 104a41 1fd57f 000200 03650c 1e1c7d 0cf867 1c9e74 1df03e 001c0b 1fd244 10458f 17589f 175c90 174b7f 104d3f 1fc744' },
  { text: 'HELLO', level: 'H', mask: 7, version: 1,
    rows: '1fdd7f 105341 17425d 175a5d 175d5d 105541 1fd57f 000d00 024f3b 01a382 0652cd 03218b 175a94 0013f4 1fc8ee 104a70 174235 17536f 1741d5 1042c0 1fcdee' },
  { text: 'https://norda.cloud/pay/7Kx2-318', level: 'M', mask: 5, version: 3,
    rows: '1fc7307f 105cd541 175fa05d 175b1d5d 174a3f5d 10442841 1fd5557f 001d7000 105b1dce 191b9236 1749f990 171083b8 1443b9e1 150b1e73 08730c4c 1d282015 0fda082c 1908cb77 1f493ec9 103185e0 17fb5df7 00147318 1fc73f5c 10404710 174ce7fb 1741ef8d 174bb3fe 104e308d 1fdebea4' },
  { text: 'Привет, Норда!', level: 'Q', mask: 3, version: 3,
    rows: '1fc9307f 105a7841 17551e5d 1745955d 1741505d 10470d41 1fd5557f 00021000 0ec17606 0633752c 05632361 0a1e3165 1e437f6a 07b91bbb 1fde4044 0938f09e 014c295c 01194e9b 1376c199 021fb922 0ee82bf8 001c2f10 1fc8e55f 105fd91f 174fb3f1 17578846 175f02b9 105fad9e 1fc25d2e' },
  { text: 'https://norda.cloud/deals/4821?utm_source=email&utm_medium=invoice&utm_campaign=november-2026&ref=studio-sever&lang=ru&x=1', level: 'M', mask: 6, version: 7,
    rows: '1fdc9946697f 1057f53b0a41 175781567a5d 174db627fb5d 1750f1fe675d 104941178041 1fd55555557f 00015f116f00 13fed7f7cb97 03aa786ddf6e 17d81ed09da7 072c28dc5424 1a4e0f855232 0a88ca05db5a 0e6cf1b198da 0ab0ddf849cc 1f675748162b 1394eb6b6db5 16cb5c10b819 091fa73f0a3e 13fe55f1cff8 1913f91fff1e 115e4f50ad5f 1314f718bb17 1bf3adfd53f0 1b1c9576d86e 1dd8b28d1104 062af4f8ceac 0c70601ab318 1aaa37b8667b 166d6b4b92f7 1f349c97a28e 10dbba6f4062 0a8457bcdcb6 017f3521bfcb 0f0f3ade11f5 1371d3f9f7f8 001387154b1c 1fd1fd5d1b56 10540f1ec71f 175555fc3df1 1759f25a6c83 1741a598b955 104df4c3ee7f 1fddee31c57c' },
];

const hexRows = (matrix: QrMatrix) =>
  matrix.modules
    .map((row) => {
      const bits = row.map((dark) => (dark ? '1' : '0')).join('');
      return BigInt(`0b${bits}`).toString(16).padStart(Math.ceil(row.length / 4), '0');
    })
    .join(' ');

const at = (matrix: QrMatrix, x: number, y: number) => matrix.modules[y]?.[x] === true;

/** Fifteen format bits read from the copy around the top-left finder, bit 14 first. */
function formatBits(matrix: QrMatrix): number {
  const cells: [number, number][] = [
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8], [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  ];
  return cells.reduce((bits, [x, y]) => (bits << 1) | (at(matrix, x, y) ? 1 : 0), 0);
}

/** The second copy: under the top-right finder and beside the bottom-left one. */
function formatBitsCopy(matrix: QrMatrix): number {
  const n = matrix.size;
  const cells: [number, number][] = [];
  for (let i = 0; i < 7; i++) cells.push([8, n - 1 - i]);
  for (let i = 0; i < 8; i++) cells.push([n - 8 + i, 8]);
  return cells.reduce((bits, [x, y]) => (bits << 1) | (at(matrix, x, y) ? 1 : 0), 0);
}

// ISO/IEC 18004 table C.1: format information after the 101010000010010 mask, by level and mask 0–7.
const FORMAT_TABLE: Record<QrLevel, readonly number[]> = {
  L: [0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976],
  M: [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0],
  Q: [0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed],
  H: [0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b],
};

function finderAt(matrix: QrMatrix, left: number, top: number): boolean {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const x = left + dx;
      const y = top + dy;
      if (x < 0 || y < 0 || x >= matrix.size || y >= matrix.size) continue;
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      // rings 0–1 and 3 dark, 2 light, 4 is the light separator
      if (at(matrix, x, y) !== (ring !== 2 && ring !== 4)) return false;
    }
  }
  return true;
}

describe('encodeQr', () => {
  it.each(REFERENCES.map((ref) => [`${ref.text.slice(0, 24)} ${ref.level} mask ${ref.mask}`, ref] as const))(
    'matches the reference matrix: %s',
    (_name, ref) => {
      const matrix = encodeQr(ref.text, { level: ref.level, mask: ref.mask });
      expect(matrix.version).toBe(ref.version);
      expect(matrix.size).toBe(ref.version * 4 + 17);
      expect(hexRows(matrix)).toBe(ref.rows);
    },
  );

  it('picks the smallest version that fits at the level: 14 bytes fit 1-M, 15 need 2-M', () => {
    expect(encodeQr('a'.repeat(14), { level: 'M' }).version).toBe(1);
    expect(encodeQr('a'.repeat(15), { level: 'M' }).version).toBe(2);
    expect(encodeQr('a'.repeat(17), { level: 'L' }).version).toBe(1);
    expect(encodeQr('a'.repeat(7), { level: 'H' }).version).toBe(1);
    expect(encodeQr('a'.repeat(8), { level: 'H' }).version).toBe(2);
  });

  it('keeps the level it was given (M by default)', () => {
    const matrix = encodeQr('https://norda.cloud/pay/7Kx2-318');
    expect(matrix.level).toBe('M');
    expect(matrix.version).toBe(3);
  });

  it('counts UTF-8 bytes, not characters: 7 Cyrillic letters are 14 bytes', () => {
    expect(encodeQr('Привет!', { level: 'M' }).version).toBe(1);
    expect(encodeQr('Приветик', { level: 'M' }).version).toBe(2);
  });

  it('switches the length field to 16 bits from version 10: 2953 bytes fit 40-L, 2954 do not', () => {
    expect(encodeQr('a'.repeat(2953), { level: 'L' }).version).toBe(40);
    expect(encodeQr('a'.repeat(1273), { level: 'H' }).version).toBe(40);
    expect(() => encodeQr('a'.repeat(2954), { level: 'L' })).toThrow(RangeError);
    expect(() => encodeQr('a'.repeat(1274), { level: 'H' })).toThrow(RangeError);
  });

  it.each(['L', 'M', 'Q', 'H'] as const)('draws finders, timing, dark module and both format copies (%s)', (level) => {
    const matrix = encodeQr('https://norda.cloud/pay/7Kx2-318', { level });
    const n = matrix.size;
    expect(finderAt(matrix, 0, 0)).toBe(true);
    expect(finderAt(matrix, n - 7, 0)).toBe(true);
    expect(finderAt(matrix, 0, n - 7)).toBe(true);
    for (let i = 8; i < n - 8; i++) {
      expect(at(matrix, i, 6), `timing x ${i}`).toBe(i % 2 === 0);
      expect(at(matrix, 6, i), `timing y ${i}`).toBe(i % 2 === 0);
    }
    expect(at(matrix, 8, n - 8)).toBe(true);
    const bits = formatBits(matrix);
    expect(bits).toBe(FORMAT_TABLE[level][matrix.mask]);
    expect(formatBitsCopy(matrix)).toBe(bits);
  });

  it('places the version block from version 7: 7 → 000111110010010100', () => {
    const matrix = encodeQr('a'.repeat(120), { level: 'M' });
    expect(matrix.version).toBe(7);
    const n = matrix.size;
    let bottomLeft = 0;
    let topRight = 0;
    for (let i = 17; i >= 0; i--) {
      const a = n - 11 + (i % 3);
      const b = Math.floor(i / 3);
      bottomLeft = bottomLeft * 2 + (at(matrix, b, a) ? 1 : 0);
      topRight = topRight * 2 + (at(matrix, a, b) ? 1 : 0);
    }
    expect(bottomLeft).toBe(0x07c94);
    expect(topRight).toBe(0x07c94);
  });

  it('draws alignment patterns away from the finders: version 7 has six', () => {
    const matrix = encodeQr('a'.repeat(120), { level: 'M' });
    const centers = [6, 22, 38];
    let found = 0;
    for (const y of centers) {
      for (const x of centers) {
        if ((x === 6 && y === 6) || (x === 6 && y === 38) || (x === 38 && y === 6)) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) expect(at(matrix, x + dx, y + dy)).toBe(Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
        found++;
      }
    }
    expect(found).toBe(6);
  });

  it('chooses the same mask for the same input and only masks 0–7', () => {
    const first = encodeQr('https://norda.cloud/pay/7Kx2-318');
    const second = encodeQr('https://norda.cloud/pay/7Kx2-318');
    expect(first.mask).toBe(second.mask);
    expect(first.mask).toBeGreaterThanOrEqual(0);
    expect(first.mask).toBeLessThan(8);
  });

  it('rejects a forced mask outside 0–7', () => {
    expect(() => encodeQr('HELLO', { mask: 8 })).toThrow(RangeError);
  });
});

const plate = (container: HTMLElement) => container.querySelector('[data-slot=qr-code]');
const svg = (container: HTMLElement) => container.querySelector('[data-slot=qr-code] svg[role=img]');

describe('QrCode', () => {
  it('draws the code as an image named by aria-label, on a white plate with a 4-module quiet zone', () => {
    const { container } = render(<QrCode value="https://norda.cloud/pay/7Kx2-318" aria-label="QR-код: оплата счёта № 318" />);
    const image = screen.getByRole('img', { name: 'QR-код: оплата счёта № 318' });
    expect(image.tagName.toLowerCase()).toBe('svg');
    expect(image.getAttribute('shape-rendering')).toBe('crispEdges');
    // version 3: 29 modules plus 4 on every side
    expect(image.getAttribute('viewBox')).toBe('-4 -4 37 37');
    expect(plate(container)?.getAttribute('data-size')).toBe('lg');
    expect(plate(container)?.getAttribute('data-state')).toBe('ready');
    expect(container.querySelector('[data-slot=qr-code-modules]')?.getAttribute('fill')).toBe('#14171c');
  });

  it('falls back to «QR-код» as the name', () => {
    render(<QrCode value="https://norda.cloud" />);
    expect(screen.getByRole('img', { name: 'QR-код' })).toBeDefined();
  });

  it.each([
    ['sm', 96, 'rounded-sm'],
    ['md', 144, 'rounded-md'],
    ['lg', 200, 'rounded-md'],
    ['xl', 280, 'rounded-md'],
  ] as const)('size %s is a %i px plate', (size, px, radius) => {
    const { container } = render(<QrCode value="https://norda.cloud" size={size} />);
    const root = plate(container);
    expect(root?.getAttribute('style')).toContain(`width: ${px}px`);
    expect(root?.getAttribute('style')).toContain(`height: ${px}px`);
    expect(root?.className).toContain(radius);
    expect(svg(container)?.getAttribute('width')).toBe(String(px));
  });

  it('draws one path of modules that covers the dark cells only', () => {
    const { container } = render(<QrCode value="HELLO" level="H" />);
    const d = container.querySelector('[data-slot=qr-code-modules]')?.getAttribute('d') ?? '';
    const matrix = encodeQr('HELLO', { level: 'H' });
    // every run is «M x y h len v1 h -len z»: add the run lengths back up
    const darkInPath = [...d.matchAll(/h(\d+)v1/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    const dark = matrix.modules.flat().filter(Boolean).length;
    expect(darkInPath).toBe(dark);
  });

  it('with a logo raises the correction to H and puts the logo on a white pad in the middle', () => {
    const { container } = render(<QrCode value="https://norda.cloud/m/login" logo={<span>Н</span>} />);
    expect(plate(container)?.getAttribute('data-level')).toBe('H');
    const logo = container.querySelector('[data-slot=qr-code-logo]');
    expect(logo?.textContent).toBe('Н');
    // 22.5 % of the 200 plate
    expect(logo?.getAttribute('style')).toContain('width: 45px');
    expect(logo?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps an explicit level even with a logo', () => {
    const { container } = render(<QrCode value="https://norda.cloud" level="Q" logo={<span>Н</span>} />);
    expect(plate(container)?.getAttribute('data-level')).toBe('Q');
  });

  it('loading: fill-1 plate with three finder outlines and a spinner, busy, no modules', () => {
    const { container } = render(<QrCode value="https://norda.cloud" state="loading" />);
    const root = plate(container);
    expect(root?.getAttribute('aria-busy')).toBe('true');
    expect(root?.className).toContain('bg-fill-1');
    expect(container.querySelectorAll('[data-slot=qr-code-finder]')).toHaveLength(3);
    expect(container.querySelector('[data-slot=qr-code-spinner]')).not.toBeNull();
    expect(container.querySelector('[data-slot=qr-code-modules]')).toBeNull();
  });

  it('expired: the code is blurred, «Код истёк» and «Обновить» sit over it', () => {
    const onRefresh = vi.fn();
    const { container } = render(<QrCode value="https://norda.cloud" state="expired" onRefresh={onRefresh} />);
    expect(plate(container)?.getAttribute('data-state')).toBe('expired');
    expect(svg(container)?.getAttribute('class')).toContain('blur-[3px]');
    expect(svg(container)?.getAttribute('class')).toContain('opacity-35');
    expect(container.querySelector('[data-slot=qr-code-overlay]')?.textContent).toContain('Код истёк');
    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('expired without onRefresh shows no button', () => {
    render(<QrCode value="https://norda.cloud" state="expired" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('error: «Не удалось создать код» over an empty plate', () => {
    const { container } = render(<QrCode value="https://norda.cloud" state="error" onRefresh={() => {}} />);
    expect(container.querySelector('[data-slot=qr-code-overlay]')?.textContent).toContain('Не удалось создать код');
    expect(container.querySelector('[data-slot=qr-code-modules]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Обновить' })).toBeDefined();
  });

  it('a value too long for any version is an error, not a crash', () => {
    const { container } = render(<QrCode value={'a'.repeat(3000)} />);
    expect(plate(container)?.getAttribute('data-state')).toBe('error');
    expect(container.querySelector('[data-slot=qr-code-overlay]')?.textContent).toContain('Не удалось создать код');
  });

  it('announces expiry and the refreshed code in a polite live region', () => {
    const { container, rerender } = render(<QrCode value="https://norda.cloud/a" />);
    const live = () => container.querySelector('[aria-live=polite]')?.textContent;
    expect(live()).toBe('');
    rerender(<QrCode value="https://norda.cloud/a" state="expired" />);
    expect(live()).toBe('Код истёк');
    rerender(<QrCode value="https://norda.cloud/b" />);
    expect(live()).toBe('Код обновлён');
  });
});
