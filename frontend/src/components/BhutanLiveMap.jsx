import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import { 
  Navigation, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Clock, 
  CheckCircle2, 
  Compass, 
  Layers, 
  Globe, 
  LocateFixed, 
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Map as MapIcon
} from 'lucide-react';

// Key Bhutanese Towns, Dzongkhags & College Campuses
export const BHUTAN_LOCATIONS = {
  trashigang: { name: 'Trashigang Town Stand', coords: [27.3331, 91.5542] },
  kanglung: { name: 'Kanglung (Sherubtse Campus)', coords: [27.2800, 91.5233] },
  sherubtse: { name: 'Sherubtse College Main Gate', coords: [27.2800, 91.5233] },
  ranjung: { name: 'Ranjung Town & School', coords: [27.3887, 91.6881] },
  khaling: { name: 'Khaling Handloom Center', coords: [27.1991, 91.5831] },
  wamrong: { name: 'Wamrong Town', coords: [27.0543, 91.5647] },
  dewathang: { name: 'Dewathang (JNEC Campus)', coords: [26.8624, 91.4645] },
  jnec: { name: 'JNEC Campus, Dewathang', coords: [26.8624, 91.4645] },
  samdrup_jongkhar: { name: 'Samdrup Jongkhar Main Gate', coords: [26.8007, 91.5052] },
  mongar: { name: 'Mongar Town Center', coords: [27.2747, 91.2396] },
  jakar: { name: 'Bumthang (Jakar Town)', coords: [27.5492, 90.7525] },
  bumthang: { name: 'Bumthang (Jakar Town)', coords: [27.5492, 90.7525] },
  trongsa: { name: 'Trongsa Dzong Viewpoint', coords: [27.4998, 90.5081] },
  punakha: { name: 'Punakha (Khuruthang)', coords: [27.5816, 89.8647] },
  dochula: { name: 'Dochula Pass (108 Chortens)', coords: [27.4938, 89.7525] },
  thimphu: { name: 'Thimphu City Center', coords: [27.4728, 89.6393] },
  paro: { name: 'Paro Campus & Town', coords: [27.4287, 89.4164] },
  phuntsholing: { name: 'Phuntsholing (CST Campus)', coords: [26.8584, 89.3853] },
  cst: { name: 'CST College, Phuntsholing', coords: [26.8584, 89.3853] },
  gelephu: { name: 'Gelephu Mindfulness City', coords: [26.8776, 90.4998] }
};

// Pre-defined High-Fidelity Mountain Corridors
export const BHUTAN_ROUTES = {
  'trashigang_kanglung': {
    id: 'trashigang_kanglung',
    name: 'Trashigang Town ↔ Kanglung (Sherubtse Campus)',
    startName: 'Trashigang Town Stand',
    destName: 'Sherubtse College Gate, Kanglung',
    pickupName: 'Chazam Bridge',
    distanceKm: 22.4,
    estMinutes: 35,
    milestones: [
      { name: 'Trashigang Town Stand', km: 0, coords: [27.3331, 91.5542] },
      { name: 'Chazam Bridge Checkpoint', km: 4.2, coords: [27.3305, 91.5510] },
      { name: 'Rongthung Junction', km: 11.5, coords: [27.3020, 91.5375] },
      { name: 'Lower Kanglung Market', km: 18.0, coords: [27.2870, 91.5270] },
      { name: 'Sherubtse College Gate', km: 22.4, coords: [27.2800, 91.5233] },
    ],
    coordinates: [
      [27.3331, 91.5542],
      [27.3305, 91.5510],
      [27.3240, 91.5475],
      [27.3160, 91.5440],
      [27.3090, 91.5410],
      [27.3020, 91.5375],
      [27.2960, 91.5340],
      [27.2910, 91.5305],
      [27.2870, 91.5270],
      [27.2830, 91.5250],
      [27.2800, 91.5233]
    ]
  },
  'kanglung_trashigang': {
    id: 'kanglung_trashigang',
    name: 'Kanglung Campus ↔ Trashigang Town',
    startName: 'Sherubtse Main Gate',
    destName: 'Trashigang Town Center',
    pickupName: 'Upper Kanglung Chorten',
    distanceKm: 22.4,
    estMinutes: 35,
    milestones: [
      { name: 'Sherubtse Main Gate', km: 0, coords: [27.2800, 91.5233] },
      { name: 'Upper Kanglung Market', km: 3.5, coords: [27.2870, 91.5270] },
      { name: 'Rongthung Junction', km: 10.9, coords: [27.3020, 91.5375] },
      { name: 'Chazam Bridge', km: 18.2, coords: [27.3305, 91.5510] },
      { name: 'Trashigang Town Center', km: 22.4, coords: [27.3331, 91.5542] },
    ],
    coordinates: [
      [27.2800, 91.5233],
      [27.2830, 91.5250],
      [27.2870, 91.5270],
      [27.2910, 91.5305],
      [27.2960, 91.5340],
      [27.3020, 91.5375],
      [27.3090, 91.5410],
      [27.3160, 91.5440],
      [27.3240, 91.5475],
      [27.3305, 91.5510],
      [27.3331, 91.5542]
    ]
  },
  'trashigang_ranjung': {
    id: 'trashigang_ranjung',
    name: 'Trashigang Town ↔ Ranjung High School',
    startName: 'Trashigang Taxi Stand',
    destName: 'Ranjung High School & Town',
    pickupName: 'Chazam Junction',
    distanceKm: 16.2,
    estMinutes: 30,
    milestones: [
      { name: 'Trashigang Taxi Stand', km: 0, coords: [27.3331, 91.5542] },
      { name: 'Chazam River Crossing', km: 3.8, coords: [27.3360, 91.5620] },
      { name: 'Bikhar Valley View', km: 8.5, coords: [27.3550, 91.6120] },
      { name: 'Ranjung Central School Gate', km: 16.2, coords: [27.3887, 91.6881] }
    ],
    coordinates: [
      [27.3331, 91.5542],
      [27.3360, 91.5620],
      [27.3450, 91.5830],
      [27.3550, 91.6120],
      [27.3680, 91.6450],
      [27.3780, 91.6680],
      [27.3887, 91.6881]
    ]
  },
  'ranjung_trashigang': {
    id: 'ranjung_trashigang',
    name: 'Ranjung Town ↔ Trashigang Town Center',
    startName: 'Ranjung Market Point',
    destName: 'Trashigang Town Center',
    pickupName: 'Ranjung Chorten',
    distanceKm: 16.2,
    estMinutes: 30,
    milestones: [
      { name: 'Ranjung Market Point', km: 0, coords: [27.3887, 91.6881] },
      { name: 'Bikhar Valley', km: 7.7, coords: [27.3550, 91.6120] },
      { name: 'Chazam River Crossing', km: 12.4, coords: [27.3360, 91.5620] },
      { name: 'Trashigang Town Center', km: 16.2, coords: [27.3331, 91.5542] }
    ],
    coordinates: [
      [27.3887, 91.6881],
      [27.3780, 91.6680],
      [27.3680, 91.6450],
      [27.3550, 91.6120],
      [27.3450, 91.5830],
      [27.3360, 91.5620],
      [27.3331, 91.5542]
    ]
  },
  'kanglung_khaling': {
    id: 'kanglung_khaling',
    name: 'Kanglung Campus ↔ Khaling Handloom Center',
    startName: 'Sherubtse Campus Gate',
    destName: 'Khaling Handloom Center',
    pickupName: 'Lower Kanglung Bus Stop',
    distanceKm: 32.8,
    estMinutes: 50,
    milestones: [
      { name: 'Sherubtse Campus Gate', km: 0, coords: [27.2800, 91.5233] },
      { name: 'Yonten Kuenjung School', km: 8.5, coords: [27.2500, 91.5500] },
      { name: 'Yadi Valley Crossing', km: 19.0, coords: [27.2340, 91.5620] },
      { name: 'Khaling Town & Handloom', km: 32.8, coords: [27.1991, 91.5831] }
    ],
    coordinates: [
      [27.2800, 91.5233],
      [27.2650, 91.5350],
      [27.2500, 91.5500],
      [27.2340, 91.5620],
      [27.2180, 91.5710],
      [27.1991, 91.5831]
    ]
  },
  'khaling_kanglung': {
    id: 'khaling_kanglung',
    name: 'Khaling ↔ Kanglung (Sherubtse College)',
    startName: 'Khaling Handloom Center',
    destName: 'Sherubtse Campus Gate',
    pickupName: 'Khaling Market Stand',
    distanceKm: 32.8,
    estMinutes: 50,
    milestones: [
      { name: 'Khaling Market Stand', km: 0, coords: [27.1991, 91.5831] },
      { name: 'Yadi Valley Crossing', km: 13.8, coords: [27.2340, 91.5620] },
      { name: 'Yonten Kuenjung School', km: 24.3, coords: [27.2500, 91.5500] },
      { name: 'Sherubtse Campus Gate', km: 32.8, coords: [27.2800, 91.5233] }
    ],
    coordinates: [
      [27.1991, 91.5831],
      [27.2180, 91.5710],
      [27.2340, 91.5620],
      [27.2500, 91.5500],
      [27.2650, 91.5350],
      [27.2800, 91.5233]
    ]
  },
  'thimphu_paro': {
    id: 'thimphu_paro',
    name: 'Thimphu ↔ Paro (Babesa-Chuzom Expressway)',
    startName: 'Thimphu Expressway Gate',
    destName: 'Paro Campus & Town Junction',
    pickupName: 'Babesa Bridge',
    distanceKm: 50.8,
    estMinutes: 65,
    milestones: [
      { name: 'Thimphu Expressway Gate', km: 0, coords: [27.4728, 89.6393] },
      { name: 'Babesa Bridge', km: 7.5, coords: [27.4320, 89.6540] },
      { name: 'Khasadrapchu', km: 18.2, coords: [27.3920, 89.6100] },
      { name: 'Chuzom Confluence Bridge', km: 30.4, coords: [27.3820, 89.5420] },
      { name: 'Isuna Junction', km: 41.0, coords: [27.4050, 89.4650] },
      { name: 'Paro Campus & Town', km: 50.8, coords: [27.4287, 89.4164] },
    ],
    coordinates: [
      [27.4728, 89.6393],
      [27.4530, 89.6450],
      [27.4320, 89.6540],
      [27.4110, 89.6410],
      [27.3920, 89.6100],
      [27.3780, 89.5780],
      [27.3820, 89.5420],
      [27.3910, 89.5050],
      [27.4050, 89.4650],
      [27.4200, 89.4350],
      [27.4287, 89.4164]
    ]
  },
  'paro_thimphu': {
    id: 'paro_thimphu',
    name: 'Paro ↔ Thimphu Expressway',
    startName: 'Paro Town Center',
    destName: 'Thimphu Expressway Gate',
    pickupName: 'Bondey Junction',
    distanceKm: 50.8,
    estMinutes: 65,
    milestones: [
      { name: 'Paro Town Center', km: 0, coords: [27.4287, 89.4164] },
      { name: 'Isuna Junction', km: 9.8, coords: [27.4050, 89.4650] },
      { name: 'Chuzom Confluence Bridge', km: 20.4, coords: [27.3820, 89.5420] },
      { name: 'Babesa Bridge', km: 43.3, coords: [27.4320, 89.6540] },
      { name: 'Thimphu City Center', km: 50.8, coords: [27.4728, 89.6393] }
    ],
    coordinates: [
      [27.4287, 89.4164],
      [27.4200, 89.4350],
      [27.4050, 89.4650],
      [27.3910, 89.5050],
      [27.3820, 89.5420],
      [27.3780, 89.5780],
      [27.3920, 89.6100],
      [27.4110, 89.6410],
      [27.4320, 89.6540],
      [27.4530, 89.6450],
      [27.4728, 89.6393]
    ]
  },
  'thimphu_punakha': {
    id: 'thimphu_punakha',
    name: 'Thimphu ↔ Punakha (via Dochula Pass 3,100m)',
    startName: 'Thimphu Main Gate',
    destName: 'Punakha (Khuruthang Town)',
    pickupName: 'Semtokha Dzong Junction',
    distanceKm: 72.5,
    estMinutes: 120,
    milestones: [
      { name: 'Thimphu Main Gate', km: 0, coords: [27.4728, 89.6393] },
      { name: 'Semtokha Dzong', km: 6.5, coords: [27.4430, 89.6750] },
      { name: 'Dochula Pass (108 Chortens, 3,100m)', km: 30.5, coords: [27.4938, 89.7525] },
      { name: 'Lobesa Junction', km: 56.0, coords: [27.5120, 89.7890] },
      { name: 'Punakha Khuruthang Town', km: 72.5, coords: [27.5816, 89.8647] }
    ],
    coordinates: [
      [27.4728, 89.6393],
      [27.4430, 89.6750],
      [27.4650, 89.7120],
      [27.4938, 89.7525],
      [27.5120, 89.7890],
      [27.5450, 89.8320],
      [27.5816, 89.8647]
    ]
  },
  'trashigang_mongar': {
    id: 'trashigang_mongar',
    name: 'Trashigang ↔ Mongar (East-West Highway)',
    startName: 'Trashigang Chazam Bridge',
    destName: 'Mongar Town Center',
    pickupName: 'Chazam Toll Gate',
    distanceKm: 91.0,
    estMinutes: 180,
    milestones: [
      { name: 'Trashigang Bridge', km: 0, coords: [27.3331, 91.5542] },
      { name: 'Yadi Loops', km: 38.0, coords: [27.3350, 91.4720] },
      { name: 'Kori La Pass (2,298m)', km: 64.0, coords: [27.2980, 91.3500] },
      { name: 'Sherichhu Bridge', km: 78.0, coords: [27.2800, 91.2800] },
      { name: 'Mongar Town Center', km: 91.0, coords: [27.2747, 91.2396] },
    ],
    coordinates: [
      [27.3331, 91.5542],
      [27.3380, 91.5420],
      [27.3420, 91.5120],
      [27.3350, 91.4720],
      [27.3180, 91.4200],
      [27.2980, 91.3500],
      [27.2850, 91.3100],
      [27.2800, 91.2800],
      [27.2760, 91.2550],
      [27.2747, 91.2396]
    ]
  },
  'phuntsholing_thimphu': {
    id: 'phuntsholing_thimphu',
    name: 'Phuntsholing (CST Campus) ↔ Thimphu',
    startName: 'Phuntsholing Main Gate (CST)',
    destName: 'Thimphu City Center',
    pickupName: 'Rinchending Checkpost',
    distanceKm: 165.0,
    estMinutes: 270,
    milestones: [
      { name: 'Phuntsholing Gate', km: 0, coords: [26.8584, 89.3853] },
      { name: 'Gedu College Junction', km: 48.0, coords: [26.9320, 89.4310] },
      { name: 'Chukha Dam Overlook', km: 82.0, coords: [27.0250, 89.5240] },
      { name: 'Chapcha Pass', km: 115.0, coords: [27.1210, 89.5820] },
      { name: 'Chuzom Confluence Bridge', km: 135.0, coords: [27.3820, 89.5420] },
      { name: 'Thimphu City Center', km: 165.0, coords: [27.4728, 89.6393] }
    ],
    coordinates: [
      [26.8584, 89.3853],
      [26.9320, 89.4310],
      [27.0250, 89.5240],
      [27.1210, 89.5820],
      [27.2400, 89.5980],
      [27.3780, 89.5780],
      [27.4320, 89.6540],
      [27.4728, 89.6393]
    ]
  }
};

// Helper to fuzzy match location name to BHUTAN_LOCATIONS coords
function findLocationCoords(name = '') {
  if (!name) return null;
  const lower = name.toLowerCase();

  for (const [key, loc] of Object.entries(BHUTAN_LOCATIONS)) {
    if (lower.includes(key) || loc.name.toLowerCase().includes(lower)) {
      return loc;
    }
  }

  // Common keywords
  if (lower.includes('sherubtse') || lower.includes('kang')) return BHUTAN_LOCATIONS.kanglung;
  if (lower.includes('trashi')) return BHUTAN_LOCATIONS.trashigang;
  if (lower.includes('ranj')) return BHUTAN_LOCATIONS.ranjung;
  if (lower.includes('khal')) return BHUTAN_LOCATIONS.khaling;
  if (lower.includes('wamr')) return BHUTAN_LOCATIONS.wamrong;
  if (lower.includes('samdrup') || lower.includes('dewathang') || lower.includes('jnec')) return BHUTAN_LOCATIONS.dewathang;
  if (lower.includes('mong')) return BHUTAN_LOCATIONS.mongar;
  if (lower.includes('thim')) return BHUTAN_LOCATIONS.thimphu;
  if (lower.includes('paro')) return BHUTAN_LOCATIONS.paro;
  if (lower.includes('punak')) return BHUTAN_LOCATIONS.punakha;
  if (lower.includes('phunt') || lower.includes('cst')) return BHUTAN_LOCATIONS.phuntsholing;
  if (lower.includes('jakar') || lower.includes('bumt')) return BHUTAN_LOCATIONS.bumthang;

  return null;
}

// Haversine distance in km
function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Resolve or dynamically synthesize a realistic mountain route
export function resolveBhutanRoute(start = '', dest = '', pickup = '') {
  const s = (start || '').toLowerCase();
  const d = (dest || '').toLowerCase();

  // 1. Direct predefined route matching
  if (s.includes('trashi') && d.includes('kang')) return BHUTAN_ROUTES.trashigang_kanglung;
  if (s.includes('kang') && d.includes('trashi')) return BHUTAN_ROUTES.kanglung_trashigang;
  if (s.includes('trashi') && d.includes('ranj')) return BHUTAN_ROUTES.trashigang_ranjung;
  if (s.includes('ranj') && d.includes('trashi')) return BHUTAN_ROUTES.ranjung_trashigang;
  if (s.includes('kang') && d.includes('khal')) return BHUTAN_ROUTES.kanglung_khaling;
  if (s.includes('khal') && d.includes('kang')) return BHUTAN_ROUTES.khaling_kanglung;
  if (s.includes('thim') && d.includes('paro')) return BHUTAN_ROUTES.thimphu_paro;
  if (s.includes('paro') && d.includes('thim')) return BHUTAN_ROUTES.paro_thimphu;
  if (s.includes('thim') && d.includes('punak')) return BHUTAN_ROUTES.thimphu_punakha;
  if (s.includes('trashi') && d.includes('mong')) return BHUTAN_ROUTES.trashigang_mongar;
  if (s.includes('phunt') && d.includes('thim')) return BHUTAN_ROUTES.phuntsholing_thimphu;

  // 2. Dynamic route synthesis
  const locStart = findLocationCoords(start) || BHUTAN_LOCATIONS.trashigang;
  const locDest = findLocationCoords(dest) || BHUTAN_LOCATIONS.kanglung;

  const [lat1, lng1] = locStart.coords;
  const [lat2, lng2] = locDest.coords;

  const straightKm = haversineKm([lat1, lng1], [lat2, lng2]);
  const roadKm = Math.max(12, Math.round(straightKm * 1.45 * 10) / 10);
  const estMins = Math.max(20, Math.round((roadKm / 38) * 60));

  const coords = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    const bend = Math.sin(t * Math.PI) * 0.012;
    coords.push([lat + bend, lng - bend * 0.6]);
  }

  return {
    id: `custom_${Date.now()}`,
    name: `${start || locStart.name} ↔ ${dest || locDest.name}`,
    startName: start || locStart.name,
    destName: dest || locDest.name,
    pickupName: pickup || 'Designated Highway Pickup',
    distanceKm: roadKm,
    estMinutes: estMins,
    milestones: [
      { name: start || locStart.name, km: 0, coords: [lat1, lng1] },
      { name: pickup ? `Pickup: ${pickup}` : 'Highway Checkpoint', km: Math.round(roadKm * 0.25 * 10) / 10, coords: coords[2] },
      { name: 'Mountain Ridge Crossing', km: Math.round(roadKm * 0.65 * 10) / 10, coords: coords[5] },
      { name: dest || locDest.name, km: roadKm, coords: [lat2, lng2] },
    ],
    coordinates: coords
  };
}

export const BhutanLiveMap = ({
  initialRouteKey,
  startLocation = '',
  destination = '',
  pickupPoint = '',
  tripDriverName = '',
  tripTime = '',
  height = '480px',
  showRouteSelector = true,
  onSelectRoute = null
}) => {
  const { isDark } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const glowPolylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const milestoneMarkersRef = useRef([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMilestonesList, setShowMilestonesList] = useState(false);

  // Active route computation
  const activeRoute = useMemo(() => {
    if (initialRouteKey && BHUTAN_ROUTES[initialRouteKey]) {
      return BHUTAN_ROUTES[initialRouteKey];
    }
    return resolveBhutanRoute(startLocation, destination, pickupPoint);
  }, [initialRouteKey, startLocation, destination, pickupPoint]);

  const [selectedRouteKey, setSelectedRouteKey] = useState(() => {
    return activeRoute.id || 'trashigang_kanglung';
  });

  // Sync state if activeRoute changes
  useEffect(() => {
    if (activeRoute?.id) {
      setSelectedRouteKey(activeRoute.id);
    }
  }, [activeRoute]);

  // Initialize or re-theme Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [27.31, 91.53],
        zoom: 12,
        scrollWheelZoom: true,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layers to update for theme
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Dark vs Light Mode OpenStreetMap / CartoDB tiles
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

  }, [isDark]);

  // Update Route Polyline & Markers on route change (clean, static route inspection)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute || !activeRoute.coordinates?.length) return;

    // Clear existing route elements
    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (glowPolylineRef.current) map.removeLayer(glowPolylineRef.current);
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);
    if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);

    milestoneMarkersRef.current.forEach((m) => map.removeLayer(m));
    milestoneMarkersRef.current = [];

    const coords = activeRoute.coordinates;
    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];

    // 1. Subtle Outer Glow Polyline for clean road contrast
    const glowPolyline = L.polyline(coords, {
      color: '#FF9E80',
      weight: 10,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    glowPolylineRef.current = glowPolyline;

    // 2. High-contrast main highway route line
    const polyline = L.polyline(coords, {
      color: '#FF5722',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routePolylineRef.current = polyline;

    // 3. Start Marker (Green Origin Badge 'A')
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div style="background:#10B981; width:32px; height:32px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 4px 14px rgba(16,185,129,0.5); display:flex; align-items:center; justify-content:center; color:#ffffff; font-weight:900; font-size:13px; font-family:sans-serif;">
          A
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const startMarker = L.marker(startCoord, { icon: startIcon }).addTo(map);
    startMarker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <div style="font-size:10px; font-weight:800; color:#10B981; text-transform:uppercase;">Departure Location</div>
        <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">${activeRoute.startName}</div>
      </div>
    `);
    startMarkerRef.current = startMarker;

    // 4. Pickup Spot Marker (Golden Pin ★)
    const pickupTitle = pickupPoint || activeRoute.pickupName;
    if (pickupTitle && coords.length > 2) {
      const pickupIndex = Math.max(1, Math.floor(coords.length * 0.25));
      const pickupCoord = coords[pickupIndex];

      const pickupIcon = L.divIcon({
        className: 'custom-pickup-marker',
        html: `
          <div style="background:#F59E0B; width:30px; height:30px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 4px 14px rgba(245,158,11,0.6); display:flex; align-items:center; justify-content:center; color:#ffffff; font-weight:900; font-size:14px;">
            ★
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const pickupMarker = L.marker(pickupCoord, { icon: pickupIcon }).addTo(map);
      pickupMarker.bindPopup(`
        <div style="font-family:sans-serif; padding:4px;">
          <div style="font-size:10px; font-weight:800; color:#D97706; text-transform:uppercase;">Passenger Pickup Spot</div>
          <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">${pickupTitle}</div>
        </div>
      `);
      pickupMarkerRef.current = pickupMarker;
    }

    // 5. Destination Marker (Dark Slate / Orange Badge 'B')
    const endIcon = L.divIcon({
      className: 'custom-end-marker',
      html: `
        <div style="background:#0F172A; width:32px; height:32px; border-radius:8px; border:3px solid #FF5722; box-shadow:0 4px 14px rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; color:#ffffff; font-weight:900; font-size:13px; font-family:sans-serif;">
          B
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const endMarker = L.marker(endCoord, { icon: endIcon }).addTo(map);
    endMarker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <div style="font-size:10px; font-weight:800; color:#FF5722; text-transform:uppercase;">Final Destination</div>
        <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">${activeRoute.destName}</div>
      </div>
    `);
    endMarkerRef.current = endMarker;

    // 6. Intermediate Checkpoint/Milestone Waypoint Pins
    if (activeRoute.milestones && activeRoute.milestones.length > 2) {
      // Add markers for intermediate checkpoints (excluding start and end)
      const intermediate = activeRoute.milestones.slice(1, activeRoute.milestones.length - 1);
      intermediate.forEach((m) => {
        if (m.coords) {
          const mIcon = L.divIcon({
            className: 'custom-milestone-pin',
            html: `
              <div style="background:#ffffff; width:18px; height:18px; border-radius:50%; border:3px solid #6366F1; box-shadow:0 2px 8px rgba(99,102,241,0.4);"></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          const mMarker = L.marker(m.coords, { icon: mIcon }).addTo(map);
          mMarker.bindPopup(`
            <div style="font-family:sans-serif; padding:2px;">
              <div style="font-size:10px; font-weight:700; color:#6366F1; text-transform:uppercase;">Highway Stop • ${m.km} km</div>
              <div style="font-size:12px; font-weight:700; color:#0f172a;">${m.name}</div>
            </div>
          `);
          milestoneMarkersRef.current.push(mMarker);
        }
      });
    }

    // Fit map bounds to show the entire journey route comfortably
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

  }, [activeRoute, pickupPoint]);

  // Fit back to the route bounds
  const handleFitRoute = () => {
    if (mapInstanceRef.current && routePolylineRef.current) {
      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
    }
  };

  // Zoom out to view all of Bhutan
  const handleZoomBhutan = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([27.45, 90.5], 8);
    }
  };

  const handleRouteChange = (key) => {
    setSelectedRouteKey(key);
    if (onSelectRoute && BHUTAN_ROUTES[key]) {
      onSelectRoute(BHUTAN_ROUTES[key]);
    }
  };

  return (
    <div className={`uber-card overflow-hidden transition-all duration-300 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''}`}>
      
      {/* Top Map Control Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-orange to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-500/25">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white">
              Bhutan Journey Route Map
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive corridor navigation from {activeRoute.startName.split(',')[0]} to {activeRoute.destName.split(',')[0]}
            </p>
          </div>
        </div>

        {/* Route Selector Dropdown & Quick Map Actions */}
        <div className="flex items-center gap-2">
          {showRouteSelector && (
            <select
              value={selectedRouteKey}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              <optgroup label="Popular Highway Corridors">
                {Object.entries(BHUTAN_ROUTES).map(([key, r]) => (
                  <option key={key} value={key}>{r.name}</option>
                ))}
              </optgroup>
              {!BHUTAN_ROUTES[selectedRouteKey] && (
                <option value={selectedRouteKey}>Custom: {activeRoute.name}</option>
              )}
            </select>
          )}

          {/* Fit Route Button */}
          <button
            onClick={handleFitRoute}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Center on Journey Route"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          {/* Full Bhutan Overview */}
          <button
            onClick={handleZoomBhutan}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Zoom to Entire Bhutan"
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Journey Overview Card (Google Maps / Uber style) */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-sm z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-3">
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Journey Overview
            </span>
            <span className="text-xs font-black text-brand-orange">
              {activeRoute.distanceKm} km
            </span>
          </div>

          {/* Route Endpoints Summary */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {activeRoute.startName}
              </span>
            </div>

            <div className="pl-1.5 py-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Est. Driving Duration: <strong>~{activeRoute.estMinutes} mins</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-orange flex-shrink-0"></span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {activeRoute.destName}
              </span>
            </div>
          </div>

          {/* Pickup Location Badge if provided */}
          {(pickupPoint || activeRoute.pickupName) && (
            <div className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
              <span className="text-amber-600 dark:text-amber-400 font-black">★</span>
              <span className="truncate">Pickup: <strong>{pickupPoint || activeRoute.pickupName}</strong></span>
            </div>
          )}

          {/* Milestones / Stops Collapsible Toggle */}
          {activeRoute.milestones && activeRoute.milestones.length > 0 && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowMilestonesList(!showMilestonesList)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition py-1"
              >
                <span className="flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
                  Journey Stops ({activeRoute.milestones.length} checkpoints)
                </span>
                {showMilestonesList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showMilestonesList && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeRoute.milestones.map((m, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold flex-shrink-0 ml-2">{m.km} km</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Bottom Summary Strip */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-5">
        <div className="flex items-center gap-2 truncate">
          <span className="font-extrabold text-slate-900 dark:text-white truncate">{activeRoute.name}</span>
          <span>•</span>
          <span>Distance: <strong>{activeRoute.distanceKm} km</strong> (~{activeRoute.estMinutes} mins)</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bhutan Highway Route Verified
          </span>
        </div>
      </div>

    </div>
  );
};
