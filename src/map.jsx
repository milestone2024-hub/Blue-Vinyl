import React, { useId, useState } from 'react';
import { findCity, landPath, project, worldHeight, worldWidth } from './geography';
import { albumTitle, dateLabel, Top } from './ui';

export function WorldMap({ children, viewBox = '0 0 320 160', label = '세계 지도', wrap = false, land = '#aeb9ce' }) {
  const id = useId();
  return <svg viewBox={viewBox} role="img" aria-label={label}>
    <defs><path id={id} d={landPath} fill={land} fillRule="evenodd" /></defs>
    <use href={'#' + id} />
    {wrap && <><use href={'#' + id} x={-worldWidth} /><use href={'#' + id} x={worldWidth} /></>}
    {children}
  </svg>;
}

export function TravelMap({ albums, back, open }) {
  const [active, setActive] = useState('');
  const seen = new Set();
  const mapped = albums.flatMap((album) => {
    const city = findCity(album.city, album.country);
    if (!city || seen.has(city)) return [];
    seen.add(city);
    return [{ album, city }];
  });

  return <>
    <Top title="TRAVEL MAP" back={back} />
    <section className="atlas">
      <div className="atlas-map">
        <WorldMap land="#7d87a4" />
        {mapped.map(({ album, city }) => {
          const [x, y] = project(city);
          return <button key={album.id} className="atlas-pin" style={{ left: (x / worldWidth * 100) + '%', top: (y / worldHeight * 100) + '%' }}
            aria-label={albumTitle(album)} aria-pressed={active === album.id}
            onClick={() => setActive(active === album.id ? '' : album.id)} />;
        })}
      </div>
      <ol className="atlas-list">{albums.map((album) => <li key={album.id}>
        <button className={active === album.id ? 'active' : ''} onClick={() => open(album)}
          onPointerEnter={() => setActive(album.id)} onFocus={() => setActive(album.id)}>
          <span className="atlas-city">{album.city}<small>{album.country}</small></span>
          <time>{dateLabel(album.start)}</time>
        </button>
      </li>)}</ol>
    </section>
  </>;
}
