import { csv } from 'd3-fetch';

import L from 'leaflet';

// import states from './data/counties.low.geo.json';
import states from './data/landkreise.geo.json'; // contains RS (which matches IFOPT)

import stationsUrl from './data/stations.csv?url';

import './style.scss'

import '../node_modules/leaflet/dist/leaflet.css';

const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const mainStationNames = ['AH', 'BL', 'DH', 'EE', 'FF', 'HH', 'KK', 'LH', 'MH', 'NN', 'RK', 'SSH', 'TS', 'UE', 'WS']; // 15

const colors = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', '#ccffcc', '#ffcccff', '#cccccc']; // 12 actually


const stations = await csv(stationsUrl, c => ({
  // evaNr: c.EVA_NR,
  ds100: c.DS100,
  start: c.DS100.substr(0, 1),
  ifopt: c.IFOPT,
  rs: c.IFOPT.split(':')[1],
  name: c.NAME,
  verkehr: c.Verkehr,
  lon: c.Laenge.replace(',', '.'),
  lat: c.Breite.replace(',', '.'),
}));
const mainStations = stations.filter(({ ds100 }) => mainStationNames.includes(ds100))

const letters = [...new Set(stations.map(s => s.start))];

const colorMap = new Map();

stations.forEach(({ start, rs }) => {
  if (!rs) {
    return;
  }
  colorMap.set(rs, start);
});

function getColor(rs) {
  let letter = colorMap.get(rs);
  if (!letter && rs === '03159') {
    // Göttingen fix (HG) should be 03152
    letter = 'H';
  }
  if (!letter) {
    console.error('letter not found', letter, rs);
    return '#ffffff';
  }
  const index = letters.indexOf(letter);
  if (index === -1 || index >= 15) {
    console.error('letter index not found', index, letter, rs);
    return '#ffffff';
  }
  return colors[index];
}

function style({ properties }) {
  return {
    fillColor: getColor(properties.RS),
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

const map = L.map('map').setView([50.2, 9], 6);

// function locateUser() {
//   map.locate({setView: true, maxZoom: 16});
// }
// locateUser()

mainStations.forEach(station => {
  const title = `${station.name} (${station.ds100})`;
  L
    .marker([station.lat, station.lon], { title, alt: title })
    .bindPopup(title)
    .addTo(map);
});

const hasDarkmode = window.matchMedia('(prefers-color-scheme: dark)').matches;

L.tileLayer(`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${accessToken}`, {
  maxZoom: 18,
  id: hasDarkmode ? 'mapbox/dark-v9' : 'mapbox/light-v9',
  tileSize: 512,
  zoomOffset: -1,
  accessToken,
}).addTo(map);

const geojson = L.geoJson(states, { style }).addTo(map);

geojson.eachLayer(function (layer) {
    layer.bindPopup(layer.feature.properties.GEN);
});

map.fitBounds(geojson.getBounds());
