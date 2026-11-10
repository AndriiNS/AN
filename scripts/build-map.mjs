// Generates src/data/europe-map.json: a dotted map of Europe for the Journey section.
// Run once with `npm run build:map` (the result is committed, so this is only needed
// if you want to change the area, density or highlighted countries).
import { readFileSync, writeFileSync } from 'node:fs';
import { geoBounds, geoConicConformal, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';

const W = 1000;
const H = 620;
const STEP = 11; // distance between dots in px (viewBox units)

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)));
const countries = feature(topo, topo.objects.countries).features;

// Area that the map shows: from the Atlantic coast to eastern Ukraine
const frame = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[-5, 42], [-5, 58], [40, 58], [40, 42], [-5, 42]]],
  },
};

const projection = geoConicConformal().rotate([-17, 0]).parallels([43, 60]).fitExtent([[20, 20], [W - 20, H - 20]], frame);

// ISO 3166 numeric ids
const HIGHLIGHT = { '804': 'ua', '276': 'de' };

// Natural Earth (the source of world-atlas) draws Crimea as part of Russia.
// Crimea is Ukraine, so every land dot on the peninsula is assigned to Ukraine.
// The box stops at the Kerch Strait, so the Russian Taman peninsula is not included.
const isCrimea = ([lon, lat]) => lon >= 32.4 && lon <= 36.65 && lat >= 44.35 && lat <= 46.2;

// Pre-filter countries to the ones roughly inside the frame (speed)
const near = countries.filter((c) => {
  const [[lon0, lat0], [lon1, lat1]] = geoBounds(c);
  const wraps = lon0 > lon1; // crosses the 180° meridian (Russia does)
  return (wraps || (lon1 > -15 && lon0 < 50)) && lat1 > 35 && lat0 < 65;
});

const dots = [];
let crimea = 0;
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const ll = projection.invert([x, y]);
    if (!ll) continue;
    const hit = near.find((c) => geoContains(c, ll));
    if (!hit) continue;
    const type = isCrimea(ll) ? 'ua' : HIGHLIGHT[hit.id] || '';
    if (isCrimea(ll) && hit.id !== '804') crimea++;
    dots.push([Math.round(x), Math.round(y), type]);
  }
}

const cities = {
  khmelnytskyi: projection([26.99, 49.42]).map(Math.round),
  kyiv: projection([30.52, 50.45]).map(Math.round),
  hagen: projection([7.47, 51.36]).map(Math.round),
};

writeFileSync(new URL('../src/data/europe-map.json', import.meta.url), JSON.stringify({ width: W, height: H, step: STEP, dots, cities }));
console.log(`dots: ${dots.length}, Crimea dots reassigned to Ukraine: ${crimea}`, cities);
