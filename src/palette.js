import { useEffect, useState } from 'react';

// Pulls a quiet palette out of a photo: a pale background that sits with the
// image, a deep ink for text, and a translucent tint for a coloured LP.

const cache = new Map();

function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

const hsl = (h, s, l) => `hsl(${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function hexToHsl(hex) {
  const n = parseInt((hex || '#8495ad').slice(1), 16);
  return toHsl((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

// Weighted average colour: saturated mid-tones count most, so a grey sky
// doesn't wash out the sunset or the grass.
function sample(src) {
  if (cache.has(src)) return Promise.resolve(cache.get(src));
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const [, s, l] = toHsl(data[i], data[i + 1], data[i + 2]);
          const w = (0.12 + s) * (1 - Math.abs(l - 0.5) * 1.6);
          if (w <= 0) continue;
          r += data[i] * w; g += data[i + 1] * w; b += data[i + 2] * w; weight += w;
        }
        const result = weight ? toHsl(r / weight, g / weight, b / weight) : null;
        cache.set(src, result);
        resolve(result);
      } catch { resolve(null); }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function toneFrom([h, s]) {
  const soft = clamp(s, 0.08, 0.42);
  return {
    '--tone-bg': hsl(h, soft * 0.42, 0.95),
    '--tone-bg2': hsl(h, soft * 0.5, 0.92),
    '--tone-ink': hsl(h, clamp(s, 0.12, 0.38), 0.21),
    '--tone-soft': hsl(h, soft * 0.7, 0.45),
    '--tone-paper': hsl(h, soft * 0.25, 0.975),
    '--lp': hsl(h, clamp(s * 1.25, 0.32, 0.72), 0.56),
    '--lp-deep': hsl(h, clamp(s * 1.2, 0.3, 0.68), 0.4),
  };
}

// Returns CSS custom properties for the photo at `src`, falling back to the
// album colour until (or unless) the photo can be read.
// Starts unset so the screen paints in the app's own blue first, then eases
// into the photo's colours (the properties are registered for transitions).
export function useTone(src, fallback) {
  const [tone, setTone] = useState(null);
  useEffect(() => {
    let alive = true;
    let frame = 0;
    const apply = (base) => {
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { if (alive) setTone(toneFrom(base)); }); });
    };
    if (!src) apply(hexToHsl(fallback));
    else sample(src).then((found) => {
      if (!alive) return;
      apply(found && found[1] > 0.06 ? found : [hexToHsl(fallback)[0], found ? found[1] : 0.2, 0.5]);
    });
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [src, fallback]);
  return tone || undefined;
}
