import React, { useEffect, useRef, useState } from 'react';
import { MomentMap } from './moment-map';
import { albumTitle, Icon, Top, useMedia, Vinyl } from './ui';

export function AlbumPlayer({ album, art, tracks, track, onTrack, back, send, autoStart, save, busy }) {
  const [playing, setPlaying] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState('record');
  const player = useRef(null);
  const lastAuto = useRef('');
  const startDistance = useRef(0);
  const zoomTimer = useRef(null);
  const index = tracks.indexOf(track);
  const source = useMedia(track);
  const isMedia = track?.kind === 'audio' || track?.kind === 'video';
  useEffect(() => () => clearTimeout(zoomTimer.current), []);

  useEffect(() => {
    setPlaying(false);
    setError('');
  }, [track?.id]);

  useEffect(() => {
    if (!autoStart || !isMedia || !source || lastAuto.current === track.id) return;
    lastAuto.current = track.id;
    player.current?.play().catch(() => {});
  }, [autoStart, isMedia, source, track?.id]);

  async function play() {
    if (track?.kind !== 'audio') setReveal(true);
    const media = player.current;
    if (!media) return;
    if (!media.paused) media.pause();
    else {
      try { await media.play(); }
      catch { setError('이 트랙을 재생할 수 없어요.'); }
    }
  }

  function move(direction) {
    onTrack(tracks[index + direction]);
    setReveal(false);
  }

  function openMoments() {
    if (zoomTimer.current !== null) return;
    player.current?.pause();
    setReveal(false);
    setZoom('transition');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    zoomTimer.current = setTimeout(() => {
      zoomTimer.current = null;
      setZoom('moments');
    }, reduceMotion ? 0 : 290);
  }

  function pinchDistance(touches) {
    return touches.length === 2
      ? Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
      : 0;
  }

  const events = {
    ref: player,
    src: source,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    onError: () => setError('이 트랙을 열 수 없어요.'),
  };
  const showVideo = track?.kind === 'video' && (reveal || playing);

  if (zoom === 'moments') return <MomentMap album={album} tracks={tracks} back={() => setZoom('record')} />;

  return <div className={'album-focus' + (zoom === 'transition' ? ' focus-zooming' : '')}>
    <Top title={autoStart ? 'RECEIVED RECORD' : 'BLUE VINYL'} back={back} action={send} actionIcon="plane" actionLabel="여행지로 LP 보내기" />
    <div className="focus-stage zoom-gesture"
      onTouchStart={(event) => { startDistance.current = pinchDistance(event.touches); }}
      onTouchMove={(event) => {
        if (startDistance.current && pinchDistance(event.touches) > startDistance.current * 1.22) {
          startDistance.current = 0;
          openMoments();
        }
      }}
      onTouchEnd={() => { startDistance.current = 0; }}
      onTouchCancel={() => { startDistance.current = 0; }}>
      <button className="focus-record" onClick={play} disabled={!track} aria-label={isMedia ? (playing ? '일시정지' : '트랙 재생') : '트랙 열기'}>
        <Vinyl image={art} color={album.color} playing={playing} />
      </button>
      <svg className="focus-arm" viewBox="0 0 138 236" aria-hidden="true">
        <defs><linearGradient id="focus-metal"><stop stopColor="#7d8089"/><stop offset=".55" stopColor="#e7e5de"/><stop offset="1" stopColor="#9d9d9a"/></linearGradient></defs>
        <circle cx="107" cy="36" r="28" fill="#242831" opacity=".24" transform="translate(2 4)" />
        <circle cx="107" cy="36" r="28" fill="#edece8" />
        <circle cx="107" cy="36" r="21" fill="#dfded9" />
        <path d="M113 39L36 203" stroke="#222531" opacity=".33" strokeWidth="11" transform="translate(3 3)" />
        <path d="M111 39L36 203" stroke="url(#focus-metal)" strokeWidth="9" strokeLinecap="round" />
        <rect x="96" y="27" width="25" height="27" rx="5" fill="#d4d3cf" transform="rotate(26 108 40)" />
        <rect x="18" y="194" width="35" height="14" rx="5" fill="#d8d7d2" transform="rotate(-29 35 201)" />
        <path d="M31 208l2 7" stroke="#eeece6" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <button className="focus-zoom" onClick={openMoments} disabled={zoom === 'transition'}>
        <Icon name="zoom" size={16} /> LP 확대
      </button>
    </div>
    <div className="focus-bottom">
      <h1>{albumTitle(album)}</h1>
      {track && <div className="focus-track">
        <button className="icon-button" aria-label="이전 트랙" disabled={index <= 0} onClick={() => move(-1)}><Icon name="back" size={16} /></button>
        <button className="focus-track-name" onClick={play}><Icon name={isMedia ? (playing ? 'pause' : 'play') : 'list'} size={15} /><span>{track.name}</span></button>
        <button className="icon-button" aria-label="다음 트랙" disabled={index >= tracks.length - 1} onClick={() => move(1)}><Icon name="next" size={16} /></button>
      </div>}
      {track && <div className="focus-progress" aria-label={String(index + 1) + ' / ' + tracks.length + ' 트랙'}>
        {tracks.length <= 12 ? tracks.map((entry, i) => <button type="button" key={entry.id} className={i === index ? 'active' : ''} aria-label={(i + 1) + '번 트랙'} aria-current={i === index ? 'true' : undefined}
          onClick={() => { onTrack(entry); setReveal(false); }} />) : <span>{index + 1} / {tracks.length}</span>}
      </div>}
      {!track && <p className="muted">아직 트랙이 없어요.</p>}
      {save && <button className="focus-save" disabled={busy} onClick={save}>내 선반에 저장</button>}
      {error && <p className="error" role="status">{error}</p>}
    </div>
    {track?.kind === 'audio' && source && <audio key={track.id} {...events} preload="auto" />}
    {track?.kind === 'video' && source && <div className="focus-media" hidden={!showVideo}>
      <button className="icon-button" aria-label="트랙 닫기" onClick={() => { player.current?.pause(); setReveal(false); }}><Icon name="close" /></button>
      <video key={track.id} {...events} controls playsInline preload="metadata" />
    </div>}
    {reveal && !isMedia && <section className="focus-media" aria-label="트랙 내용">
      <header><h2>{track.name}</h2><button className="icon-button" aria-label="트랙 닫기" onClick={() => setReveal(false)}><Icon name="close" /></button></header>
      {track.kind === 'photo' && source && <img className="media-photo" src={source} alt={track.name} />}
      {track.kind === 'memo' && <blockquote className="memo-view">{track.note}</blockquote>}
    </section>}
  </div>;
}
