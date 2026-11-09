import React, { useId, useState } from 'react';
import { findCity, landPath, project, worldHeight, worldWidth } from './geography';
import { albumTitle, dateLabel, Icon, Top } from './ui';

export function WorldMap({ children, viewBox = '0 0 320 160', label = '세계 지도', wrap = false }) {
  const id = useId();
  return <svg viewBox={viewBox} role="img" aria-label={label}>
    <defs><path id={id} d={landPath} fill="#aeb9ce" fillRule="evenodd" /></defs>
    <use href={'#' + id} />
    {wrap && <><use href={'#' + id} x={-worldWidth} /><use href={'#' + id} x={worldWidth} /></>}
    {children}
  </svg>;
}

export function TravelMap({ albums, back, open }) {
  const [active, setActive] = useState('');
  const selected = albums.find((album) => album.id === active);
  const seen = new Set();
  const mapped = albums.flatMap((album) => {
    const city = findCity(album.city, album.country);
    if (!city || seen.has(city)) return [];
    seen.add(city);
    return [{ album, city }];
  });

  return <>
    <Top title="TRAVEL MAP" back={back} />
    <section className="content map-content">
      <p className="eyebrow">PLACES ON RECORD</p>
      <h1>LP 여행 지도</h1>
      <p className="muted">레코드에 담긴 여행을 다시 열어보세요.</p>
      <div className="map-board">
        <WorldMap />
        {mapped.map(({ album, city }) => {
          const [x, y] = project(city);
          return <button key={album.id} className="map-pin" style={{ left: (x / worldWidth * 100) + '%', top: (y / worldHeight * 100) + '%' }}
            aria-label={album.city} aria-pressed={active === album.id} onClick={() => setActive(album.id)} />;
        })}
      </div>
      {selected && <button className="sheet-row" onClick={() => open(selected)}><Icon name="disc" /> {albumTitle(selected)} <Icon name="next" size={16} /></button>}
      <div className="section-title"><span>여행 레코드</span><span>{albums.length} LP</span></div>
      <ol className="track-list">{albums.map((album, index) => <li key={album.id}>
        <button onClick={() => open(album)}><span className="track-no">{String(index + 1).padStart(2, '0')}</span><Icon name="disc" size={17} />
          <span className="track-name">{albumTitle(album)}</span><small>{dateLabel(album.start)}</small><Icon name="next" size={15} /></button>
      </li>)}</ol>
    </section>
  </>;
}
