import React, { useEffect, useRef, useState } from 'react';
import { albumTitle, Icon, Top, Vinyl } from './ui';

const holdMs = 2600;

export function JourneyConfirm({ confirm, close }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog className="journey-confirm" ref={dialog} aria-labelledby="journey-confirm-title"
    onCancel={(event) => { event.preventDefault(); close(); }}
    onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    <h2 id="journey-confirm-title">Did you finish your journey?</h2>
    <button onClick={confirm}>Yes!</button>
    <button onClick={close}>No...</button>
  </dialog>;
}

export function PressRecord({ photo, busy, back, choose, complete }) {
  const [progress, setProgress] = useState(0);
  const hold = useRef(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function start(id) {
    if (hold.current || busy || progress === 1) return;
    hold.current = { id, at: performance.now() };
    function tick(now) {
      const active = hold.current;
      if (!active) return;
      const next = Math.min(1, (now - active.at) / holdMs);
      setProgress(next);
      if (next === 1) {
        hold.current = null;
        complete().then((saved) => { if (!saved) setProgress(0); });
      } else frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
  }

  function cancel(id) {
    if (hold.current?.id !== id) return;
    hold.current = null;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  }

  return <div className="press-room" style={{ '--press-progress': progress }}>
    <Top title="" back={() => { if (!busy && progress < 1) back(); }} />
    <button className="press-hold" aria-label="길게 눌러 LP 프레싱"
      onPointerDown={(event) => {
        if (event.button !== 0 || hold.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        start(event.pointerId);
      }}
      onPointerUp={(event) => cancel(event.pointerId)}
      onPointerCancel={(event) => cancel(event.pointerId)}
      onLostPointerCapture={(event) => cancel(event.pointerId)}
      onBlur={() => cancel('keyboard')}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); start('keyboard'); }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); cancel('keyboard'); }
      }}>
      <span className="press-heading">Press!</span>
      <span className="press-visual" aria-hidden="true">
        <span className="press-disc"><Vinyl color="#373738" /></span>
        <span className="press-inlay">{photo && <img src={photo} alt="" />}</span>
      </span>
      <span className="press-instruction">{progress === 1 ? '프레싱 마무리 중…' : '완성될 때까지 길게 누르세요'}</span>
    </button>
    <button className="press-cover" onClick={choose} disabled={busy || progress > 0}><Icon name="camera" size={16} /> LP 커버 선택</button>
  </div>;
}

export function PressCompleted({ album, photo, next }) {
  useEffect(() => {
    const timer = setTimeout(next, 3000);
    return () => clearTimeout(timer);
  }, [next]);

  return <div className="press-completed" role="status">
    <p>Completed</p>
    <Vinyl color="#bd8582" image={photo} />
    <h1>{albumTitle(album)}</h1>
  </div>;
}
