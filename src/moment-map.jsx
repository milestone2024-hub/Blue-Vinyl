import React, { useRef, useState } from 'react';
import { trackArt } from './archive';
import { albumTitle, Icon, Top, useMedia } from './ui';

const pins = [[64, 36], [54, 56], [79, 75]];
const momentTime = (entry) => [entry.day?.replaceAll('-', '.'), entry.time].filter(Boolean).join(' · ') || '시간 미기록';

export function MomentMap({ album, tracks, back }) {
  const [group, setGroup] = useState(0);
  const [id, setId] = useState('');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef(null);
  const moments = tracks.filter((entry) => entry.kind === 'audio' && !entry.fieldRecording)
    .sort((a, b) => (a.day + (a.time || '')).localeCompare(b.day + (b.time || '')));
  const selected = moments.find((entry) => entry.id === id);
  const photo = useMedia(trackArt(album, selected));
  const source = useMedia(selected);
  const pageCount = Math.ceil(moments.length / pins.length);

  function select(entry) {
    audio.current?.pause();
    setPlaying(false);
    setError('');
    setId(entry?.id || '');
  }

  function moveGroup(next) {
    select();
    setGroup(next);
  }

  async function play() {
    const media = audio.current;
    if (!media) return;
    if (!media.paused) media.pause();
    else {
      try { await media.play(); }
      catch { setError('이 노래를 재생할 수 없어요.'); }
    }
  }

  return <div className="moment-map">
    <Top title="MOMENT REPLAY" back={back} />
    <div className="moment-heading">
      <h1>{albumTitle(album)}</h1>
      <p className="eyebrow">{moments.length} {moments.length === 1 ? 'MOMENT' : 'MOMENTS'}</p>
    </div>
    <div className="moment-recollection">
      {selected && <div className="moment-card" key={selected.id}>
        <div className="moment-photo">{photo ? <img src={photo} alt="" /> : <Icon name="audio" size={32} />}</div>
        <h2>{selected.name}</h2>
        <p>{[selected.artist, momentTime(selected)].filter(Boolean).join(' · ')}</p>
      </div>}
    </div>
    <div className={'moment-deck' + (playing ? ' moment-playing' : '')}>
      <svg className="moment-disc" viewBox="0 0 440 255" aria-hidden="true">
        <defs><linearGradient id="moment-sheen" x1="0" y1="0" x2="0.9" y2="1"><stop stopColor="#3c3a37"/><stop offset="1" stopColor="#1e1d1f"/></linearGradient></defs>
        <ellipse cx="220" cy="132" rx="217" ry="113" fill="#19191b" />
        <ellipse cx="220" cy="124" rx="217" ry="113" fill="url(#moment-sheen)" />
        {[207, 199, 182, 161, 135, 109, 87].map((rx) => <ellipse key={rx} cx="220" cy="124" rx={rx} ry={rx * .52} fill="none" stroke="#d2bea1" opacity={rx === 199 ? '.19' : '.12'} />)}
        <ellipse cx="220" cy="124" rx="33" ry="17" fill="#e2e0dc" />
        <ellipse cx="220" cy="124" rx="2.7" ry="1.6" fill="#aaa7a1" />
      </svg>
      {moments.slice(group * pins.length, (group + 1) * pins.length).map((entry, index) => (
        <button key={entry.id} className="moment-pin" style={{ '--pin-x': pins[index][0] + '%', '--pin-y': pins[index][1] + '%' }}
          aria-label={momentTime(entry) + ' · ' + entry.name} aria-pressed={id === entry.id} onClick={() => select(entry)}>
          <span className="pin-head" /><span className="pin-stem" /><span className="pin-foot" />
        </button>
      ))}
    </div>
    <div className="moment-bottom">
      {selected ? <button className="primary moment-play" disabled={!source} onClick={play}>
        <Icon name={playing ? 'pause' : 'play'} size={14} />{playing ? '일시정지' : '이 순간 재생'}
      </button> : <p className="muted">{moments.length ? '핀을 눌러 그 순간에 들은 노래를 만나보세요.' : '이 LP에 저장된 노래가 없어요.'}</p>}
      {pageCount > 1 && <nav className="moment-paging" aria-label="회고 핀 페이지">
        <button className="icon-button" aria-label="이전 핀" disabled={group === 0} onClick={() => moveGroup(group - 1)}><Icon name="back" size={15} /></button>
        <span>{group + 1} / {pageCount}</span>
        <button className="icon-button" aria-label="다음 핀" disabled={group + 1 >= pageCount} onClick={() => moveGroup(group + 1)}><Icon name="next" size={15} /></button>
      </nav>}
      {error && <p className="error" role="status">{error}</p>}
    </div>
    {source && <audio key={selected.id} ref={audio} src={source} preload="auto"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onError={() => setError('이 노래를 열 수 없어요.')} />}
  </div>;
}
