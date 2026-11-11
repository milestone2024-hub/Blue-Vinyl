import React, { useEffect, useState } from 'react';
import { Vinyl } from './ui';

// Auto layout for the player screen, modelled on a record's packaging spread:
// photos are measured, then sized by shape (portrait = tall panel, landscape =
// wide spread, square = single panel) and packed onto a 3-column grid. The LP
// sits in a sleeve panel, and gaps left by the packing become a track-list
// one-line diary panel (the album's memos) or extra photo panels, so every layout comes out as a full rectangle.

const COLS = 3;
const MAX_ROWS = 4;

export function shapeOf(ratio) {
  if (!ratio) return 'square';
  if (ratio >= 2.1) return 'panorama';
  if (ratio >= 1.3) return 'wide';
  if (ratio <= 0.82) return 'tall';
  return 'square';
}

const spans = {
  panorama: [3, 1],
  wide: [2, 1],
  tall: [1, 2],
  square: [1, 1],
  hero: [2, 2],
  sleeve: [2, 1],
};

// Classic 2x2 grid when every photo is close to square; otherwise the spread.
export function chooseLayout(photos) {
  const shapes = photos.map((photo) => shapeOf(photo.ratio));
  return shapes.length && shapes.every((shape) => shape === 'square') ? 'grid' : 'spread';
}

export function planSpread(cover, photos) {
  const items = [];
  if (cover) {
    const shape = shapeOf(cover.ratio);
    items.push({ kind: 'photo', photo: cover, size: shape === 'square' ? 'hero' : shape });
  }
  items.push({ kind: 'sleeve', size: 'sleeve' });
  const rank = { tall: 0, square: 1, wide: 2, panorama: 3 };
  [...photos].sort((a, b) => rank[shapeOf(a.ratio)] - rank[shapeOf(b.ratio)])
    .forEach((photo) => items.push({ kind: 'photo', photo, size: shapeOf(photo.ratio) }));

  const grid = [];
  const free = (row, col) => !grid[row]?.[col];
  const take = (row, col, w, h) => {
    for (let r = row; r < row + h; r++) {
      grid[r] ||= [];
      for (let c = col; c < col + w; c++) grid[r][c] = true;
    }
  };
  const fits = (row, col, w, h) => {
    if (col + w > COLS || row + h > MAX_ROWS) return false;
    for (let r = row; r < row + h; r++) for (let c = col; c < col + w; c++) if (!free(r, c)) return false;
    return true;
  };

  const placed = [];
  // The LP sleeve always sits in the top-right corner.
  const sleeve = items.find((item) => item.kind === 'sleeve');
  take(0, 1, 2, 1);
  placed.push({ ...sleeve, row: 0, col: 1, w: 2, h: 1 });
  for (const item of items) {
    if (item === sleeve) continue;
    let [w, h] = spans[item.size];
    let spot = findSpot(fits, w, h);
    if (!spot && h > 1) { h = 1; spot = findSpot(fits, w, h); }
    if (!spot && w > 1) { w = 1; spot = findSpot(fits, w, h); }
    if (!spot) continue;
    take(spot.row, spot.col, w, h);
    placed.push({ ...item, row: spot.row, col: spot.col, w, h });
  }

  const rows = Math.max(1, ...placed.map((item) => item.row + item.h));
  const holes = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < COLS; col++) if (free(row, col)) holes.push({ row, col });

  const owner = (row, col) => placed.find((item) => row >= item.row && row < item.row + item.h && col >= item.col && col < item.col + item.w);
  let listed = false;
  const pool = [cover, ...photos].filter(Boolean);
  let next = 0;
  for (const hole of holes) {
    if (!free(hole.row, hole.col)) continue;
    if (!listed) {
      take(hole.row, hole.col, 1, 1);
      placed.push({ kind: 'list', row: hole.row, col: hole.col, w: 1, h: 1 });
      listed = true;
      continue;
    }
    // Grow a neighbouring photo into the gap before repeating any photo.
    const above = hole.row > 0 ? owner(hole.row - 1, hole.col) : null;
    if (above && above.w === 1 && above.kind !== 'sleeve') { take(hole.row, hole.col, 1, 1); above.h += 1; continue; }
    const left = hole.col > 0 ? owner(hole.row, hole.col - 1) : null;
    if (left && left.h === 1 && left.kind !== 'sleeve') { take(hole.row, hole.col, 1, 1); left.w += 1; continue; }
    take(hole.row, hole.col, 1, 1);
    placed.push(pool.length
      ? { kind: 'photo', photo: pool[(next++ + 1) % pool.length], size: 'square', row: hole.row, col: hole.col, w: 1, h: 1, extra: true }
      : { kind: 'blank', row: hole.row, col: hole.col, w: 1, h: 1 });
  }
  return { rows, items: placed };
}

function findSpot(fits, w, h) {
  for (let row = 0; row < MAX_ROWS; row++) for (let col = 0; col < COLS; col++) if (fits(row, col, w, h)) return { row, col };
  return null;
}

// Resolve each entry to a URL and measure its natural size.
export function useMeasuredPhotos(entries) {
  const [measured, setMeasured] = useState([]);
  const key = entries.map((entry) => entry?.id).join('|');
  useEffect(() => {
    let alive = true;
    const urls = [];
    Promise.all(entries.filter(Boolean).map((entry) => new Promise((resolve) => {
      const src = entry.src || (entry.blob ? URL.createObjectURL(entry.blob) : null);
      if (entry.blob && src) urls.push(src);
      if (!src) { resolve(null); return; }
      const image = new Image();
      image.onload = () => resolve({ entry, src, ratio: image.naturalWidth / image.naturalHeight });
      image.onerror = () => resolve(null);
      image.src = src;
    }))).then((list) => { if (alive) setMeasured(list.filter(Boolean)); });
    return () => { alive = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [key]);
  return measured;
}

export function Spread({ plan, album, art, playing, onPlay, playLabel, disabled, tracks, track, onTrack, title }) {
  return <div className="spread-frame"><div className="spread" style={{ '--spread-rows': plan.rows }}>
    {plan.items.map((item, index) => {
      const style = { gridColumn: (item.col + 1) + ' / span ' + item.w, gridRow: (item.row + 1) + ' / span ' + item.h };
      if (item.kind === 'sleeve') {
        return <button key="sleeve" type="button" className={'spread-sleeve' + (playing ? ' playing' : '')} style={style}
          onClick={onPlay} disabled={disabled} aria-label={playLabel}>
          <span className="spread-jacket">{art && <img src={art} alt="" draggable="false" />}</span>
          <Vinyl image={art} color={album.color} playing={playing} />
        </button>;
      }
      if (item.kind === 'list') {
        const memos = tracks.filter((entry) => entry.kind === 'memo' && entry.note);
        return <div key="list" className="spread-memo" style={style}>
          {memos.length ? memos.map((memo) => <button type="button" key={memo.id} onClick={() => onTrack(memo)}
            className={memo.id === track?.id ? 'current' : ''}>
            <time>{memo.day?.replaceAll('-', '.')}</time>
            <q>{memo.note}</q>
          </button>) : <strong>{title}</strong>}
        </div>;
      }
      if (item.kind === 'blank') return <div key={'blank-' + index} className="spread-blank" style={style} />;
      const linked = tracks.find((entry) => entry.id === item.photo.entry.id);
      const image = <img src={item.photo.src} alt="" draggable="false" />;
      const className = 'spread-photo size-' + item.size;
      return linked
        ? <button key={'p-' + index} type="button" className={className} style={style} aria-label={linked.name + ' 트랙 열기'} onClick={() => onTrack(linked)}>{image}</button>
        : <div key={'p-' + index} className={className} style={style} aria-hidden="true">{image}</div>;
    })}
  </div></div>;
}
