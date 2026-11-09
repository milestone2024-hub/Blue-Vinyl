import geography from './geography-data.json';

export const worldWidth = 320;
export const worldHeight = 160;
export const landPath = geography.land;

const key = (value) => String(value ?? '').trim().toLowerCase().normalize('NFD')
  .replace(/\p{M}/gu, '').normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
const cityAliases = {
  서울: 'Seoul', 부산: 'Busan', 제주: 'Jeju', 파리: 'Paris', 도쿄: 'Tokyo', 교토: 'Kyoto',
  런던: 'London', 뉴욕: 'New York', 리스본: 'Lisbon', 방콕: 'Bangkok',
};
const countries = {
  korea: 'southkorea', republicofkorea: 'southkorea', 한국: 'southkorea', 대한민국: 'southkorea',
  usa: 'unitedstates', unitedstatesofamerica: 'unitedstates', 미국: 'unitedstates',
  프랑스: 'france', 일본: 'japan', 영국: 'unitedkingdom', uk: 'unitedkingdom',
  포르투갈: 'portugal', 태국: 'thailand', 아이슬란드: 'iceland',
};
const countryKey = (value) => {
  const normalized = key(value);
  return Object.hasOwn(countries, normalized) ? countries[normalized] : normalized;
};
const cities = geography.cities.map(([name, country, latitude, longitude, ...aliases]) => ({
  name, country, latitude, longitude, names: [name, ...aliases].map(key), countryKey: countryKey(country || ''),
}));

export function findCity(value, country = '') {
  const [name = '', region = ''] = (value || '').split(',').map((part) => part.trim());
  const city = key(Object.hasOwn(cityAliases, name) ? cityAliases[name] : name);
  const regionKey = countryKey(country || region);
  if (!city) return undefined;
  return cities.find((place) => place.names.includes(city) && (!regionKey || place.countryKey === regionKey));
}

export function cityLabel(place) {
  return [place.name, place.country === 'South Korea' ? 'Korea' : place.country].filter(Boolean).join(', ');
}

export function project(point) {
  return [(point.longitude + 180) * worldWidth / 360, (90 - point.latitude) * worldHeight / 180];
}

function distanceKm(from, to) {
  const rad = Math.PI / 180;
  const a = Math.sin((to.latitude - from.latitude) * rad / 2) ** 2 +
    Math.cos(from.latitude * rad) * Math.cos(to.latitude * rad) * Math.sin((to.longitude - from.longitude) * rad / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function nearestCity(point) {
  let best;
  let shortest = 220;
  for (const city of cities) {
    const km = distanceKm(point, city);
    if (km >= shortest) continue;
    shortest = km;
    best = city;
  }
  return best;
}

export function estimatedDeliveryDays(origin, destination) {
  if (!origin || !destination) return 3;
  const distance = distanceKm(origin, destination);
  if (distance < 300) return 1;
  if (distance < 1500) return 2;
  return distance < 10000 ? 3 : 5;
}
