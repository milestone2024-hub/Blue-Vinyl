import React, { useEffect, useRef, useState } from 'react';
import { albumTitle, Cover, Vinyl } from './ui';

// An antique paper plane drifts in, lands and opens flat, the folded letter
// unfolds panel by panel like a real sheet, and a stranger's LP rises from it.
// Phases: fly -> land -> unfold -> reveal -> ready. Tapping skips ahead.
const timings = { fly: 2600, land: 750, unfold: 1900, reveal: 1100 };
const order = { fly: 'land', land: 'unfold', unfold: 'reveal', reveal: 'ready' };

export function AirmailArrival({ delivery, play, save, release, later, busy }) {
  const [phase, setPhase] = useState('fly');
  const timer = useRef(0);
  const album = delivery.album;
  const from = album.from || {};

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setPhase('ready'); return; }
    if (!order[phase]) return;
    timer.current = setTimeout(() => setPhase(order[phase]), timings[phase]);
    return () => clearTimeout(timer.current);
  }, [phase]);

  function skip() {
    if (phase === 'ready') return;
    clearTimeout(timer.current);
    setPhase('ready');
  }

  const flying = phase === 'fly' || phase === 'land';
  return <div className={'airmail airmail-' + phase} role="dialog" aria-modal="true" aria-label={'종이비행기로 날아온 LP · ' + albumTitle(album)}
    onClick={skip}>
    {flying && <div className="airmail-flight"><PaperPlane /></div>}

    {!flying && <div className="airmail-letter">
      <FoldingSheet />
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

    {phase === 'ready' && <div className="airmail-actions" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="airmail-play" disabled={busy} onClick={() => play(delivery)}>들어보기</button>
      <div>
        <button type="button" disabled={busy} onClick={() => save(delivery)}>선반에 꽂기</button>
        <button type="button" disabled={busy} onClick={() => release(delivery)}>바람에 보내기</button>
        <button type="button" disabled={busy} onClick={later}>나중에</button>
      </div>
    </div>}
  </div>;
}

// A dart paper plane built from real 3D faces: two wings and two keel flaps
// hinged on the centre crease, lit differently so it reads as folded paper.
export function PaperPlane({ className = '' }) {
  return <div className={'pp ' + className} aria-hidden="true">
    <div className="pp-shadow" />
    <div className="pp-orient">
      <div className="pp-body">
        <i className="pp-face pp-keel pp-keel-near" />
        <i className="pp-face pp-keel pp-keel-far" />
        <i className="pp-face pp-wing pp-wing-far" />
        <i className="pp-face pp-wing pp-wing-near" />
      </div>
    </div>
  </div>;
}

// A sheet folded in quarters (bottom up, then right over left) that unfolds
// on its creases. Each quarter has an inner (writing) side and an outer side.
function FoldingSheet() {
  const quarter = (name) => <div className={'fold-q fold-' + name}>
    <i className="fold-face fold-in" /><i className="fold-face fold-out" /><i className="fold-shade" />
  </div>;
  return <div className="fold-sheet" aria-hidden="true">
    <div className="fold-half fold-top">{quarter('tl')}{quarter('tr')}</div>
    <div className="fold-half fold-bottom">{quarter('bl')}{quarter('br')}</div>
  </div>;
}
