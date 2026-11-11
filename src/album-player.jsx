import React, { useEffect, useRef, useState } from 'react';
import { albumArt, fillerPhotos } from './archive';
import { chooseLayout, planSpread, Spread, useMeasuredPhotos } from './collage';
import { MomentMap } from './moment-map';
import { albumTitle, Arm, Icon, Top, useMedia, Vinyl } from './ui';

export function AlbumPlayer({ album, art, tracks, track, onTrack, back, send, autoStart, save, busy }) {
  const [playing, setPlaying] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState('record');
  const [view, setView] = useState('collage');
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

  function openRecord() {
    setView('record');
    if (track?.kind === 'audio' && player.current?.paused) player.current.play().catch(() => setError('이 트랙을 재생할 수 없어요.'));
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
  const panels = gridPanels(album);
  const measured = useMeasuredPhotos([panels[2], ...panelPool(album, panels[2])]);
  const layout = measured.length ? chooseLayout(measured) : 'pending';
  const coverPhoto = measured.find((photo) => photo.entry.id === panels[2]?.id);
  const plan = layout === 'spread' ? planSpread(coverPhoto, measured.filter((photo) => photo !== coverPhoto)) : null;
  const songs = tracks.filter((entry) => entry.kind === 'audio');
  const playLabel = isMedia ? (playing ? '일시정지' : '트랙 재생') : '트랙 열기';

  if (zoom === 'moments') return <MomentMap album={album} tracks={tracks} back={() => setZoom('record')} />;

  return <div className={'album-focus' + (zoom === 'transition' ? ' focus-zooming' : '')}>
    <Top title={autoStart ? 'RECEIVED RECORD' : 'BLUE VINYL'} back={view === 'record' ? () => setView('collage') : back} action={send} actionIcon="plane" actionLabel="여행지로 LP 보내기" />
    <div className={'focus-stage zoom-gesture' + (view === 'record' ? ' record-view' : '')}
      onTouchStart={(event) => { startDistance.current = pinchDistance(event.touches); }}
      onTouchMove={(event) => {
        if (startDistance.current && pinchDistance(event.touches) > startDistance.current * 1.22) {
          startDistance.current = 0;
          openMoments();
        }
      }}
      onTouchEnd={() => { startDistance.current = 0; }}
      onTouchCancel={() => { startDistance.current = 0; }}>
      {view === 'record' && <>
        <button className="focus-record focus-big" onClick={play} disabled={!track} aria-label={playLabel}>
          <Vinyl image={art} color={album.color} playing={playing} />
        </button>
        <span className="focus-arm"><Arm /></span>
      </>}
      {view === 'collage' && layout === 'grid' && <div className="focus-grid">
        <GridPhoto entry={panels[0]} slot="a" tracks={tracks} onTrack={onTrack} />
        <button className="focus-record" onClick={openRecord} disabled={!track} aria-label="LP 크게 보기">
          <Vinyl image={art} color={album.color} playing={playing} />
        </button>
        <GridPhoto entry={panels[1]} slot="b" tracks={tracks} onTrack={onTrack} />
        <GridPhoto entry={panels[2]} slot="c" tracks={tracks} onTrack={onTrack} />
      </div>}
      {view === 'collage' && plan && <Spread plan={plan} album={album} art={art} playing={playing} onPlay={openRecord} playLabel="LP 크게 보기" disabled={!track}
        tracks={tracks} track={track} onTrack={(entry) => { onTrack(entry); setReveal(false); }} title={albumTitle(album)} />}
      {view === 'collage' && songs.length > 0 && <section className="track-sheet" aria-label="트랙 리스트">
        <h2>Tracks</h2>
        <ol>{songs.map((entry, i) => <li key={entry.id}>
          <button type="button" className={entry.id === track?.id ? 'current' : ''} aria-current={entry.id === track?.id ? 'true' : undefined}
            onClick={() => { onTrack(entry); setReveal(false); }}>
            <span className="track-sheet-no">{String(i + 1).padStart(2, '0')}</span>
            <span className="track-sheet-name">{entry.name}</span>
            <span className="track-sheet-meta">{entry.time || entry.day?.slice(5).replace('-', '.')}</span>
          </button>
        </li>)}</ol>
      </section>}
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

// Three photo panels around the record (top-left, bottom-left, bottom-right).
// The album cover takes the bottom-right; other album photos fill the rest,
// and sample travel photos cover any gap.
function gridPanels(album) {
  const cover = albumArt(album);
  const photos = album.entries.filter((entry) => entry.kind === 'photo' && entry.id !== cover?.id);
  const picks = [...photos];
  for (const filler of fillerPhotos) {
    if (picks.length >= 2) break;
    if (filler.id !== cover?.id) picks.push(filler);
  }
  return [picks[0], picks[1], cover];
}

// Photos the layouts may use besides the cover: the album's own photos,
// topped up with sample travel photos so a layout never runs short.
function panelPool(album, cover) {
  const own = album.entries.filter((entry) => entry.kind === 'photo' && entry.id !== cover?.id);
  const extra = fillerPhotos.filter((filler) => filler.id !== cover?.id);
  return [...own, ...extra].slice(0, Math.max(3, own.length));
}

function GridPhoto({ entry, slot, tracks, onTrack }) {
  const src = useMedia(entry);
  const track = tracks.find((item) => item.id === entry?.id);
  const image = src ? <img src={src} alt="" draggable="false" /> : null;
  if (track) {
    return <button type="button" className={'focus-photo photo-' + slot} aria-label={track.name + ' 트랙 열기'} onClick={() => onTrack(track)}>{image}</button>;
  }
  return <div className={'focus-photo photo-' + slot} aria-hidden="true">{image}</div>;
}
