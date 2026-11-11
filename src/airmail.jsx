import React, { useEffect, useRef, useState } from 'react';
import { albumTitle, Cover, Vinyl } from './ui';

// An antique paper plane drifts in, lands and opens flat into a folded letter.
// Press and hold the letter to unfold it; flick it to send it off on the wind.
// Phases: fly -> land -> wait -> unfold -> reveal -> ready, and on a flick
// (refold ->) flyaway. Tapping during the flight skips to the waiting letter.
const timings = { fly: 2600, land: 750, unfold: 1900, reveal: 1100, refold: 550, flyaway: 850 };
const order = { fly: 'land', land: 'wait', unfold: 'reveal', reveal: 'ready', refold: 'flyaway' };
const HOLD_MS = 520;

export function AirmailArrival({ delivery, play, release, later, startAt = 'fly' }) {
  const [phase, setPhase] = useState(startAt);
  const [pressing, setPressing] = useState(false);
  const [drag, setDrag] = useState(null);
  const [toss, setToss] = useState({ x: 0, y: -1 });
  const timer = useRef(0);
  const hold = useRef(0);
  const gesture = useRef(null);
  const album = delivery.album;
  const from = album.from || {};
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (phase === 'flyaway') {
      timer.current = setTimeout(() => release(delivery), still ? 0 : timings.flyaway);
      return () => clearTimeout(timer.current);
    }
    if (!order[phase]) return;
    timer.current = setTimeout(() => setPhase(order[phase]), still ? 0 : timings[phase]);
    return () => clearTimeout(timer.current);
  }, [phase]);
  useEffect(() => () => clearTimeout(hold.current), []);

  const opened = phase === 'reveal' || phase === 'ready';
  const canTouch = phase === 'wait' || opened;

  function down(event) {
    if (!canTouch || event.button > 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, points: [[event.clientX, event.clientY, event.timeStamp]], moved: false,
      onRecord: Boolean(event.target.closest?.('.airmail-record')) };
    if (phase === 'wait') {
      setPressing(true);
      hold.current = setTimeout(() => {
        gesture.current = null;
        setPressing(false);
        setDrag(null);
        setPhase('unfold');
      }, HOLD_MS);
    }
  }

  function move(event) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    g.points.push([event.clientX, event.clientY, event.timeStamp]);
    if (g.points.length > 6) g.points.shift();
    if (!g.moved && Math.hypot(dx, dy) > 10) {
      g.moved = true;
      clearTimeout(hold.current);
      setPressing(false);
    }
    if (g.moved) setDrag({ x: dx, y: dy });
  }

  function up(event, cancelled = false) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    clearTimeout(hold.current);
    setPressing(false);
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    const [x0, y0, t0] = g.points[0];
    const dt = Math.max(1, event.timeStamp - t0);
    const speed = Math.hypot(event.clientX - x0, event.clientY - y0) / dt;
    if (!cancelled && g.moved && (speed > 0.55 || Math.hypot(dx, dy) > 110)) {
      const length = Math.hypot(dx, dy) || 1;
      setToss({ x: dx / length, y: dy / length });
      setDrag(null);
      setPhase(opened ? 'refold' : 'flyaway');
      return;
    }
    setDrag(null);
    if (!cancelled && !g.moved && g.onRecord && phase === 'ready') play(delivery);
  }

  const flying = phase === 'fly' || phase === 'land' || phase === 'flyaway';
  const style = {
    '--toss-x': toss.x.toFixed(3), '--toss-y': toss.y.toFixed(3),
    '--drag-x': (drag?.x || 0) + 'px', '--drag-y': (drag?.y || 0) + 'px',
    '--drag-r': ((drag?.x || 0) / 14).toFixed(2) + 'deg',
  };
  return <div className={'airmail airmail-' + phase + (pressing ? ' airmail-pressing' : '') + (drag ? ' airmail-dragging' : '')}
    style={style} role="dialog" aria-modal="true" aria-label={'종이비행기로 날아온 LP · ' + albumTitle(album)}
    onClick={() => {
      if (phase === 'fly' || phase === 'land') { clearTimeout(timer.current); setPhase('wait'); }
      else if (canTouch && !drag) later();
    }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') later();
      if (phase === 'wait' && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setPhase('unfold'); }
    }}>
    {flying && <div className="airmail-flight"><PaperPlane /></div>}

    {!flying && <div className="airmail-letter" tabIndex={0}
      aria-label={phase === 'wait' ? '꾹 눌러 편지 펼치기, 밀어서 날려 보내기' : albumTitle(album)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={down} onPointerMove={move} onPointerUp={(event) => up(event)}
      onPointerCancel={(event) => up(event, true)} onDragStart={(event) => event.preventDefault()}>
      <FoldingSheet />
      <div className="airmail-body">
        <header>
          <span className="airmail-label">PAR AVION</span>
          <span className="airmail-postmark">{album.city}<small>{album.start?.replaceAll('-', '.')}</small></span>
        </header>
        <button type="button" className="airmail-record" disabled={!opened} aria-label={albumTitle(album) + ' 듣기'}
          onClick={(event) => { if (event.detail === 0 && phase === 'ready') play(delivery); }}>
          <Cover album={album} />
          <Vinyl color={album.color} />
        </button>
        <p className="airmail-note">{from.note}</p>
        <p className="airmail-from">— {from.name}, {album.city}</p>
      </div>
    </div>}

    {(phase === 'wait' || phase === 'ready') && <p className="airmail-hint" aria-hidden="true">
      {phase === 'wait' ? '꾹 눌러 펼치기' : 'LP를 눌러 듣기'}<span>밀어서 날려 보내기</span>
    </p>}
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
