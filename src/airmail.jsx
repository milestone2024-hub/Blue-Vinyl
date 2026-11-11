import React, { useEffect, useId, useRef, useState } from 'react';
import { albumTitle, Cover, Vinyl } from './ui';

// An antique paper plane drifts in, lands, unfolds into a crumpled letter,
// and a stranger's LP rises out of the paper.
// Phases: fly -> unfold -> reveal -> ready. Tapping skips ahead.
const timings = { fly: 2300, unfold: 1500, reveal: 1100 };

export function AirmailArrival({ delivery, play, save, release, later, busy }) {
  const [phase, setPhase] = useState('fly');
  const timer = useRef(0);
  const album = delivery.album;
  const from = album.from || {};

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setPhase('ready'); return; }
    const next = { fly: 'unfold', unfold: 'reveal', reveal: 'ready' }[phase];
    if (!next) return;
    timer.current = setTimeout(() => setPhase(next), timings[phase]);
    return () => clearTimeout(timer.current);
  }, [phase]);

  function skip() {
    if (phase === 'ready') return;
    clearTimeout(timer.current);
    setPhase('ready');
  }

  return <div className={'airmail airmail-' + phase} role="dialog" aria-modal="true" aria-label={'종이비행기로 날아온 LP · ' + albumTitle(album)}
    onClick={(event) => { if (event.target === event.currentTarget) skip(); }}>
    {phase === 'fly' && <div className="airmail-flight" onClick={skip}><AntiquePlane /></div>}

    {phase !== 'fly' && <div className="airmail-letter" onClick={skip}>
      <div className="airmail-paper" aria-hidden="true"><span className="airmail-creases" /></div>
      <div className="airmail-body">
        <header>
          <span className="airmail-label">PAR AVION</span>
          <span className="airmail-postmark">{album.city}<small>{album.start?.replaceAll('-', '.')}</small></span>
        </header>
        <div className="airmail-record">
          <Cover album={album} />
          <Vinyl color={album.color} />
        </div>
        <p className="airmail-note">{from.note}</p>
        <p className="airmail-from">— {from.name}, {album.city}</p>
      </div>
    </div>}

    {phase === 'ready' && <div className="airmail-actions">
      <button type="button" className="airmail-play" disabled={busy} onClick={() => play(delivery)}>들어보기</button>
      <div>
        <button type="button" disabled={busy} onClick={() => save(delivery)}>선반에 꽂기</button>
        <button type="button" disabled={busy} onClick={() => release(delivery)}>바람에 보내기</button>
        <button type="button" disabled={busy} onClick={later}>나중에</button>
      </div>
    </div>}
  </div>;
}

export function AntiquePlane() {
  const id = useId().replace(/:/g, '');
  return <svg className="antique-plane" viewBox="0 0 220 130" aria-hidden="true">
    <defs>
      <filter id={id + 'age'} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 .42  0 0 0 0 .32  0 0 0 0 .2  0 0 0 .32 0" result="tint" />
        <feComposite in="tint" in2="SourceGraphic" operator="in" result="speckle" />
        <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="speckle" /></feMerge>
      </filter>
      <linearGradient id={id + 'wing'} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f1e6cd" /><stop offset="1" stopColor="#dccaa3" />
      </linearGradient>
    </defs>
    <g filter={'url(#' + id + 'age)'}>
      <path d="M8 58L212 12 96 78z" fill={'url(#' + id + 'wing)'} />
      <path d="M96 78L212 12 120 116z" fill="#cdb98f" />
      <path d="M96 78L212 12 104 70z" fill="#b9a275" />
      <path d="M8 58L104 70 212 12z" fill="#e8dbbd" />
      <path d="M8 58L212 12" stroke="#a48c62" strokeWidth=".8" opacity=".6" />
      <path d="M40 54l52 7M52 50l60 6M66 46l60 5" stroke="#6d5b45" strokeWidth=".7" opacity=".28" strokeLinecap="round" />
      <circle cx="150" cy="34" r="9" fill="none" stroke="#8a4b3a" strokeWidth="1.1" opacity=".45" />
      <path d="M126 92l8-4 6 9-7 4z" fill="#8a4b3a" opacity=".22" />
      <circle cx="70" cy="62" r="2.2" fill="#a7865a" opacity=".22" />
      <circle cx="180" cy="22" r="1.6" fill="#a7865a" opacity=".25" />
    </g>
  </svg>;
}
