import React, { useEffect, useRef, useState } from 'react';
import { dateAfter } from './archive';
import { cityLabel, estimatedDeliveryDays, findCity, nearestCity, project, worldWidth } from './geography';
import { WorldMap } from './map';
import { albumTitle, Icon, Top } from './ui';

const flightTime = 2300;

function DeliveryMap({ origin, destination, fly = true, departureFromEdge = false }) {
  const from = origin && project(origin);
  const to = destination && project(destination);
  const [x1, y1] = from || to || [160, 65];
  let [x2, y2] = to || [x1, y1];
  if (x2 - x1 > worldWidth / 2) x2 -= worldWidth;
  if (x1 - x2 > worldWidth / 2) x2 += worldWidth;
  const midX = (x1 + x2) / 2;
  const bendY = Math.min(y1, y2) - Math.min(30, 9 + Math.abs(x1 - x2) * .19);
  const route = 'M ' + x1 + ' ' + y1 + ' Q ' + midX + ' ' + bendY + ' ' + x2 + ' ' + y2;
  const showRoute = from && to && Math.hypot(x2 - x1, y2 - y1) > 1;
  const mapWidth = from || to ? Math.max(135, Math.abs(x1 - x2) + 92) : worldWidth;
  const flightPath = showRoute ? route : departureFromEdge
    ? 'M ' + (midX - mapWidth / 2) + ' ' + (y2 + 25) + ' Q ' + (x2 - 35) + ' ' + (y2 - 26) + ' ' + x2 + ' ' + y2
    : '';
  const viewBox = [midX - mapWidth / 2, Math.max(-20, (y1 + y2) / 2 - 54), mapWidth, 125].join(' ');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return <section className="shipping-map" aria-label="배송 경로">
    <WorldMap key={route + fly} viewBox={viewBox} label="여행지와 도착지를 표시한 지도" wrap>
      {showRoute && <path d={route} fill="none" stroke="#f7f1e8" strokeWidth="1.1" strokeDasharray="1.1 2.3" />}
      {from && <><circle cx={x1} cy={y1} r="4.2" fill="#27262a" stroke="#f1e7dc" strokeWidth=".9" />
        <circle cx={x1} cy={y1} r="1.25" fill="#f1e7dc" /></>}
      {to && <circle cx={x2} cy={y2} r="3" fill="#efaaa9" stroke="#f1e7dc" strokeWidth=".9" />}
      {fly && flightPath && <g transform={reduced ? 'translate(' + x2 + ' ' + y2 + ')' : undefined}>
        {!reduced && <animateMotion path={flightPath} begin="0s" dur={flightTime + 'ms'} fill="freeze" />}
        <path d="M-5 -4L6 0L-5 4L-2 0Z" transform={x1 <= x2 ? 'rotate(12)' : 'rotate(192)'} fill="#f8f0df" />
      </g>}
    </WorldMap>
  </section>;
}

export function ReturnMail({ album, back, createLink, shareLink, download, busy }) {
  const [status, setStatus] = useState('ready');
  const origin = findCity(album.delivery?.destination);
  const destination = findCity(album.city, album.country);
  const place = [album.city, album.country].filter(Boolean).join(', ') || '여행지';

  useEffect(() => {
    if (status !== 'flying') return;
    const timer = setTimeout(() => setStatus('sent'), flightTime);
    return () => clearTimeout(timer);
  }, [status]);

  return <div className="return-mail">
    <Top title="" back={back} />
    <DeliveryMap origin={origin} destination={destination} fly={status !== 'ready'} departureFromEdge />
    <section className="return-card">
      {albumTitle(album) !== place && <p>{albumTitle(album)}</p>}
      <h1>{place}</h1>
      {status === 'sent' ? <p role="status">종이비행기를 띄웠어요.</p>
        : <button className="primary" onClick={() => setStatus('flying')} disabled={status === 'flying'}>
          <Icon name="plane" size={17} /> {status === 'flying' ? '날아가는 중…' : '여행지로 보내기'}
        </button>}
      <div className="return-actions">
        {createLink && <button disabled={busy} onClick={createLink}>공유 링크 만들기</button>}
        <button disabled={busy} onClick={download}>앨범 파일 저장</button>
      </div>
      {shareLink && <label>공유 링크<input readOnly value={shareLink} onFocus={(event) => event.target.select()} /></label>}
    </section>
  </div>;
}

export function ShippingScreen({ album, busy, save }) {
  const delivery = album.delivery;
  const [date, setDate] = useState(delivery.arrivesOn);
  const [destination, setDestination] = useState(delivery.destination);
  const [point, setPoint] = useState(undefined);
  const [attempt, setAttempt] = useState(0);
  const [gps, setGps] = useState('waiting');
  const manual = useRef({ date: false, destination: false });
  const origin = findCity(album.city, album.country);
  const originLabel = [album.city, album.country].filter(Boolean).join(', ') || albumTitle(album);
  const days = Math.max(0, Math.round((Date.parse(date) - Date.parse(delivery.dispatchedOn)) / 86400000)) || 0;

  useEffect(() => {
    let active = true;
    if (!window.isSecureContext || !navigator.geolocation) { setGps('unavailable'); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (!active) return;
      setGps('located');
      if (manual.current.destination) return;
      const position = { latitude: coords.latitude, longitude: coords.longitude };
      const city = nearestCity(position);
      setPoint(position);
      setDestination(city ? cityLabel(city) : '현재 위치');
      if (!manual.current.date) setDate(dateAfter(delivery.dispatchedOn, estimatedDeliveryDays(origin, position)));
    }, () => {
      if (active) setGps('unavailable');
    }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 60000 });
    return () => { active = false; };
  }, [attempt, delivery.dispatchedOn, origin]);

  function editDestination(value) {
    manual.current.destination = true;
    setDestination(value);
    const city = findCity(value);
    setPoint(city);
    if (city && !manual.current.date) setDate(dateAfter(delivery.dispatchedOn, estimatedDeliveryDays(origin, city)));
  }

  function retryLocation() {
    manual.current.destination = false;
    setGps('waiting');
    setAttempt((value) => value + 1);
  }

  return <div className="shipping-screen">
    <DeliveryMap origin={origin} destination={point || findCity(destination)} />
    <form className="shipping-card" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const chosenDate = data.get('delivery-date');
      const chosenDestination = data.get('destination').trim();
      if (!chosenDate || chosenDate < delivery.dispatchedOn || !chosenDestination) return;
      save({ ...delivery, arrivesOn: chosenDate, destination: chosenDestination });
    }}>
      <p>Your LP will be delivered after</p>
      <h1>{days === 0 ? 'Today' : days + (days === 1 ? ' Day' : ' Days')}</h1>
      <div className="shipping-route"><span>{originLabel}</span><span aria-hidden="true">⟶</span><span>{destination || '도착지'}</span></div>
      <div className="shipping-fields">
        <label>도착 예정일<input type="date" name="delivery-date" required min={delivery.dispatchedOn}
          value={date} onInput={(event) => { manual.current.date = true; setDate(event.target.value); }} /></label>
        <label>도착지<input name="destination" maxLength={80} required placeholder="도시 이름"
          value={destination} onChange={(event) => editDestination(event.target.value)} /></label>
      </div>
      {gps === 'waiting' && <small className="shipping-location" role="status">현재 위치 확인 중</small>}
      {gps === 'unavailable' && <button className="shipping-location" type="button" onClick={retryLocation}>현재 위치 다시 확인</button>}
      <button className="shipping-ok" type="submit" disabled={busy || !destination.trim() || !date}>OK</button>
    </form>
  </div>;
}
