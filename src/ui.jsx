import React, { useEffect, useRef, useState } from 'react';
import { albumArt } from './archive';

const icons = {
  back: 'M15 5l-7 7 7 7', next: 'M9 5l7 7-7 7', up: 'M5 15l7-7 7 7', down: 'M5 9l7 7 7-7',
  plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', close: 'M6 6l12 12M18 6 6 18',
  disc: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  camera: 'M3 7h4l2-3h6l2 3h4v13H3zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  audio: 'M9 17V6l11-3v11M9 17c0 2-6 4-6 1s6-4 6-1Zm11-3c0 2-6 4-6 1s6-4 6-1Z',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  memo: 'M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5',
  mic: 'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 10v1a7 7 0 0 0 14 0v-1m-7 8v4m-4 0h8',
  play: 'M8 4l13 8-13 8z', pause: 'M9 5v14m6-14v14',
  check: 'M4 12l5 5L20 6', edit: 'M4 16l12-12 4 4L8 20H4zM14 6l4 4',
  plane: 'M3 4l18 7-7 3-3 7-8-17Zm10 9-5-5',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  calendar: 'M3 6h18v15H3zM7 3v6m10-6v6M3 11h18',
  pin: 'M12 22s7-6.5 7-13a7 7 0 0 0-14 0c0 6.5 7 13 7 13Zm0-16a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  list: 'M5 6h14M5 12h14M5 18h14',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5v5l3 2',
  search: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm5.5 13 5 5',
  zoom: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm5.5 13 5 5M7.5 10.5h6m-3-3v6',
  cycle: 'M3 7h15l-3-3m3 3-3 3m6 7H6l3 3m-3-3 3-3',
};

export function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>;
}

export function Plane() {
  return <svg viewBox="0 0 136 85" aria-hidden="true" className="planes">
    <g className="plane-a"><path d="M59 11l69 4-20 17 7 18-25-11-13 11z" fill="#d3cfc7"/><path d="M59 11l49 21 7 18-25-11z" fill="#8c8b8a"/><path d="M59 11l69 4-38 24-13 11z" fill="#f5f1e7"/><path d="M59 11l31 28 38-24z" fill="#e6e0d4"/></g>
    <g className="plane-b"><path d="M6 65l57-34-5 23 16 11-19-1 4 15z" fill="#d2cec4"/><path d="M6 65l52-11 16 11-19-1z" fill="#8b8986"/><path d="M6 65l57-34-8 33 4 15z" fill="#f5f0e6"/><path d="M6 65l49-1 8-33z" fill="#e6e0d4"/></g>
  </svg>;
}

export function Vinyl({ className = '', color, image, playing }) {
  return <div className={'vinyl ' + className + (playing ? ' rotating' : '')} aria-hidden="true">
    <div className="vinyl-label" style={{ backgroundColor: color }}>
      {image && <img src={image} alt="" />}
    </div>
  </div>;
}

// MD-style tonearm. viewBox 180x250, pivot at (140,44); drawn in the "over record" pose.
// ArmBase is the static plinth + arm rest, so the arm can rotate on top of it.
export function ArmBase({ className = 'arm', rest = true }) {
  return <svg className={className} viewBox="0 0 180 250" aria-hidden="true">
    <rect x="109" y="11" width="64" height="70" rx="15" fill="#20263a" opacity=".22" transform="translate(2 4)"/>
    <rect x="108" y="9" width="64" height="70" rx="15" fill="#f1efe9"/>
    <rect x="108.5" y="9.5" width="63" height="69" rx="14.5" fill="none" stroke="#fff" strokeOpacity=".9"/>
    <circle cx="140" cy="44" r="20" fill="#e2e0da"/>
    <circle cx="140" cy="44" r="20" fill="none" stroke="#cfcdc7" strokeWidth="1"/>
    {rest && <g>
      <rect x="135" y="132" width="11" height="24" rx="5.5" fill="#20263a" opacity=".2" transform="translate(2 3)"/>
      <rect x="135" y="132" width="11" height="24" rx="5.5" fill="#f1efe9"/>
      <circle cx="140.5" cy="137.5" r="3.4" fill="#d9d7d1"/>
    </g>}
  </svg>;
}

export function ArmBody({ className = 'arm' }) {
  return <svg className={className} viewBox="0 0 180 250" aria-hidden="true">
    <g transform="rotate(31 140 44)">
      <g opacity=".2" transform="translate(3 4)" fill="#20263a">
        <rect x="136.5" y="40" width="7" height="152" rx="3.5"/>
        <g transform="rotate(28 140 190)"><rect x="132" y="199" width="16" height="27" rx="3"/></g>
      </g>
      <rect x="136.5" y="40" width="7" height="152" rx="3.5" fill="#fbfaf7"/>
      <rect x="140.5" y="42" width="3" height="148" rx="1.5" fill="#dedcd6"/>
      <g transform="rotate(28 140 190)">
        <rect x="137" y="186" width="6" height="18" rx="3" fill="#fbfaf7"/>
        <rect x="132" y="199" width="16" height="27" rx="3" fill="#f6f5f1"/>
        <rect x="132" y="199" width="16" height="27" rx="3" fill="none" stroke="#d6d4ce"/>
        <path d="M148 205h7" stroke="#f6f5f1" strokeWidth="3" strokeLinecap="round"/>
        <rect x="136" y="225" width="8" height="5" rx="1.5" fill="#9a9a9e"/>
      </g>
    </g>
    <circle cx="140" cy="44" r="12.5" fill="#20263a" opacity=".18" transform="translate(1.5 2.5)"/>
    <circle cx="140" cy="44" r="12.5" fill="#fbfaf7"/>
    <circle cx="140" cy="44" r="12.5" fill="none" stroke="#d6d4ce"/>
    <circle cx="140" cy="44" r="4.5" fill="#e0ded8"/>
  </svg>;
}

export function Arm() {
  return <span className="arm arm-set">
    <ArmBase className="arm-layer" rest={false} />
    <ArmBody className="arm-layer" />
  </span>;
}

export function useMedia(entry) {
  const [media, setMedia] = useState(null);
  useEffect(() => {
    if (!entry?.blob) { setMedia(null); return; }
    const url = URL.createObjectURL(entry.blob);
    setMedia({ blob: entry.blob, url });
    return () => URL.revokeObjectURL(url);
  }, [entry?.blob]);
  return entry?.src || (media?.blob === entry?.blob ? media?.url : undefined);
}

export function Top({ title, back, action, actionIcon = 'list', actionLabel = '메뉴' }) {
  return <header className="top">
    {back ? <button className="icon-button" onClick={back} aria-label="뒤로"><Icon name="back" /></button> : <span className="top-spacer" />}
    <span className="top-title">{title}</span>
    {action ? <button className="icon-button" onClick={action} aria-label={actionLabel}><Icon name={actionIcon} /></button> : <span className="top-spacer" />}
  </header>;
}

export function Cover({ album }) {
  const photo = useMedia(albumArt(album));
  return <div className="cover" style={{ '--cover-color': album.color }}>
    {photo ? <img src={photo} alt="" /> : <span>{albumTitle(album).slice(0, 2).toUpperCase()}</span>}
  </div>;
}

export function PullSleeve({ album, open }) {
  const pointer = useRef(null);
  const [distance, setDistance] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  function offset(event, start) {
    const dx = event.clientX - start.x;
    const dy = Math.abs(event.clientY - start.y);
    return dx > dy * 0.9 ? Math.min(dx, start.limit) : 0;
  }

  function start(event) {
    if (event.button !== 0 || pointer.current) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      threshold: Math.min(96, width * 0.25),
      limit: width * 0.38,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function move(event) {
    const active = pointer.current;
    if (active?.id !== event.pointerId) return;
    const next = offset(event, active);
    setDistance(next);
    setReady(next >= active.threshold);
  }

  function finish(event, release = false) {
    const active = pointer.current;
    if (active?.id !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    setDistance(0);
    setReady(false);
    if (release && offset(event, active) >= active.threshold) open();
  }

  return <div className="pull-wrap">
    <button className={'pull' + (dragging ? ' dragging' : '') + (ready ? ' pull-ready' : '')}
      aria-label={albumTitle(album) + ' LP 열기'}
      aria-description="레코드를 오른쪽으로 당긴 뒤 놓으세요."
      style={{ '--pull-distance': distance + 'px' }}
      onPointerDown={start} onPointerMove={move} onPointerUp={(event) => finish(event, true)}
      onPointerCancel={finish} onLostPointerCapture={finish}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => { if (event.detail === 0) open(); }}>
      <Cover album={album} />
      <Vinyl color={album.color} />
      <span aria-hidden="true">{ready ? 'RELEASE' : 'PULL OUT'}<br />TO OPEN <b>→</b></span>
    </button>
    <div className="pull-caption"><strong>{albumTitle(album)}</strong><small>{dateLabel(album.start)}</small></div>
  </div>;
}

export const entryIcons = { photo: 'camera', audio: 'audio', video: 'video', memo: 'memo' };
export const dateLabel = (date) => date ? date.slice(0, 7).replace('-', '.') : '';
export const albumTitle = (album) => album.name || [album.city, album.country].filter(Boolean).join(', ');
