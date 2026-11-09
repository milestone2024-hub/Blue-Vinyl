import React from 'react';
import { albumArt, trackArt } from './archive';
import { Icon, useMedia } from './ui';

function PhotoOption({ entry, selected, choose, busy }) {
  const url = useMedia(entry);
  return <button className="art-option" disabled={busy} aria-pressed={selected} onClick={choose} aria-label={entry.name}>
    {url && <img src={url} alt="" />}
    {selected && <span><Icon name="check" size={15} /></span>}
  </button>;
}

export function ArtPicker({ album, track, choose, upload, busy }) {
  const current = useMedia(track ? trackArt(album, track) : albumArt(album));
  const photos = album.entries.filter((entry) => entry.kind === 'photo');
  const selected = track ? track.art?.trackId || (!track.art && track.kind === 'photo' ? track.id : undefined) : album.art?.trackId;
  return <div className="art-picker">
    <p className="muted">{track ? '이 트랙의 바이닐 가운데에 들어갈 사진 한 장을 골라 주세요.' : '선반에 표시할 LP 커버 사진 한 장을 골라 주세요.'}</p>
    <div className="art-current">
      {current ? <img src={current} alt="현재 앨범아트" /> : <Icon name="disc" size={48} />}
    </div>
    {photos.length > 0 && <div className="art-choices">{photos.map((entry) => <PhotoOption
      key={entry.id} entry={entry} selected={selected === entry.id}
      choose={() => choose({ trackId: entry.id })} busy={busy} />)}</div>}
    <label className="primary file-label"><Icon name="camera" size={17} /> 사진 파일 선택
      <input type="file" accept="image/*" onChange={upload} disabled={busy} />
    </label>
  </div>;
}
