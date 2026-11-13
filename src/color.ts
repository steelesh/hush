type Triple = [number, number, number];

const each = ([x, y, z]: Triple, change: (value: number) => number): Triple => [change(x), change(y), change(z)];
const dot = (a: Triple, b: Triple) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const minus = (a: Triple, b: Triple): Triple => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const clamp = (value: number, most: number) => Math.min(most, Math.max(0, value));
const pair = (value: number) => Math.round(value).toString(16).padStart(2, "0");

function rgb(color: string): Triple {
  if (!/^#[0-9a-f]{6}$/.test(color)) throw new Error(`not a #rrggbb color: ${color}`);
  const channel = (start: number) => Number.parseInt(color.slice(start, start + 2), 16);
  return [channel(1), channel(3), channel(5)];
}

function linear(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

export function argb(color: string): string {
  rgb(color);
  return `0xff${color.slice(1)}`;
}

export function alpha(color: string, amount: number): string {
  rgb(color);
  return `${color}${pair(255 * clamp(amount, 1))}`;
}

export function luminance(color: string): number {
  return dot([0.2126, 0.7152, 0.0722], each(rgb(color), linear));
}

export function contrast(a: string, b: string): number {
  const [first, second] = [luminance(a), luminance(b)];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function cover(over: string, target: string, under: string): number {
  const base = rgb(under);
  const span = minus(rgb(over), base);
  const reach = dot(span, span);
  return reach === 0 ? 1 : clamp(dot(minus(rgb(target), base), span) / reach, 1);
}
