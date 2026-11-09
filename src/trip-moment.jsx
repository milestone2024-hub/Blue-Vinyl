import React, { useRef, useState } from 'react';
import { localTime } from './archive';
import { albumTitle, Icon, useMedia } from './ui';

function DaySong({ entry }) {
  const source = useMedia(entry);
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  async function play() {
    if (!audio.current) return;
    if (!audio.current.paused) audio.current.pause();
    else {
      try { await audio.current.play(); }
      catch { setError(true); }
    }
  }
  return <div className="day-song">
    <span className="day-song-disc" aria-hidden="true" />
    <div className="day-song-info"><strong>{entry.name}</strong><small>{entry.artist || entry.time || '이날의 노래'}</small></div>
    <button className="icon-button" aria-label={playing ? '일시정지' : '노래 재생'} onClick={play} disabled={!source}><Icon name={playing ? 'pause' : 'play'} size={15} /></button>
    {source && <audio ref={audio} src={source} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
    {error && <span role="status" className="day-song-error">재생할 수 없어요.</span>}
  </div>;
}

export function TripMoment({ album, entries, day, note, setNote, menu, attach, add, press, busy }) {
  const [songId, setSongId] = useState('');
  const grooves = album.grooves || [];
  const engravedIds = new Set(grooves.flatMap((groove) => groove.entryIds));
  const photo = useMedia(entries.findLast((entry) => entry.kind === 'photo' && !engravedIds.has(entry.id)));
  const songs = entries.filter((entry) => entry.kind === 'audio' && !entry.fieldRecording);
  const song = songs.find((entry) => entry.id === songId) || songs.at(-1);
  const songIndex = songs.indexOf(song);
  return <div className="trip-moment">
    <header className="moment-capture-header">
      <h1>{albumTitle(album)}</h1>
      <span>MOMENT {grooves.length + 1}</span>
      <button className="icon-button" onClick={menu} aria-label="여행 메뉴"><Icon name="list" size={17} /></button>
    </header>
    <div className="capture-body">
      <label className={'capture-photo file-label' + (photo ? ' captured' : '')}>
        {photo && <img src={photo} alt="현재 순간 사진" />}
        <span className="capture-trigger"><Icon name="camera" size={23} /></span>
        {!photo && <span>사진 찍기</span>}
        <input type="file" aria-label={photo ? '다음 사진 찍기' : '사진 찍기'} accept="image/*" capture="environment" onChange={attach} disabled={busy} />
      </label>
      <div className="capture-songs">
        <div className="capture-songs-header"><span>이날 들은 노래</span><button type="button" onClick={add}><Icon name="plus" size={15} /> 노래 추가</button></div>
        {song ? <div className="day-song-wrap"><DaySong entry={song} key={song.id} />
          {songs.length > 1 && <button className="icon-button cycle-song" aria-label="다음 노래" onClick={() => setSongId(songs[(songIndex + 1) % songs.length].id)}><Icon name="cycle" size={17} /></button>}
        </div> : <button className="day-song day-song-empty" onClick={add}><span className="day-song-disc" aria-hidden="true" /> 들었던 노래를 기록해 보세요 <Icon name="plus" size={16} /></button>}
      </div>
      <label className="capture-note">NOTE
        <textarea rows={2} maxLength={3000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write this moment briefly..." />
      </label>
      <div className="capture-dates">
        <div className="day-label"><Icon name="calendar" size={15} /> 기록 날짜<time className="capture-date" dateTime={day}>{day}</time></div>
      </div>
    </div>
    <footer className="capture-footer"><button className="primary" disabled={busy} onClick={press}>PRESS INTO LP</button></footer>
  </div>;
}

export function SongForm({ day, save, busy }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  return <form className="memo-form" onSubmit={(event) => {
    event.preventDefault();
    const time = new FormData(event.currentTarget).get('time');
    if (title.trim() && file) save({ name: title.trim(), artist: artist.trim(), blob: file, time });
  }}>
    <label>들은 시간 <small>{day}</small><input name="time" type="time" defaultValue={localTime()} /></label>
    <label>노래 제목<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <label>아티스트<input maxLength={120} value={artist} onChange={(event) => setArtist(event.target.value)} /></label>
    <label>오디오 파일<input type="file" accept="audio/*" required onChange={(event) => {
      const value = event.target.files[0] || null;
      setFile(value);
      if (value) setTitle((current) => current || value.name.replace(/\.[^.]+$/, '').slice(0, 120));
    }} /></label>
    <button className="primary" type="submit" disabled={busy || !file || !title.trim()}>오늘의 노래로 저장</button>
  </form>;
}
