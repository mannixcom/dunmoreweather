export const ANCHOR = {
  lat: 52.152,
  lon: -6.994,
  label: 'Dunmore East Slipway Hub',
}

export const CACHE_KEYS = {
  gear: 'de_scout_gear_state',
  provider: 'de_scout_provider',
}

export const CACHE_PREFIX = 'de_scout'

export const CACHE_TTL_MS = 15 * 60 * 1000
export const FORECAST_TTL_MS = 30 * 60 * 1000

// MET Norway asks clients to respect the Expires header on locationforecast,
// which currently advertises a ~30 minute repeat interval.
export const MET_CACHE_TTL_MS = 30 * 60 * 1000

export const REFRESH_COOLDOWN_MS = 60 * 1000

export const DEFAULT_PROVIDER = 'open-meteo'

export const RISK_THRESHOLDS = {
  advanced: { maxWind: 16, maxGust: 21, maxWave: 1.5, label: 'Advanced' },
  intermediate: { maxWind: 10, maxGust: 16, maxWave: 1.2, label: 'Intermediate' },
  junior: { maxWind: 6, maxGust: 10, maxWave: 1.0, label: 'Junior' },
  beginner: { maxWind: 3, maxGust: 6, maxWave: 0.75, label: 'Beginner' },
}

export const GROUPS = ['beginner', 'junior', 'intermediate', 'advanced']

export const GROUP_BUTTON_LABELS = {
  beginner: 'Beginners',
  junior: 'Juniors',
  intermediate: 'Intermediates',
  advanced: 'Advanced',
}

export const GEAR_ITEMS = [
  { id: 'pfd', label: 'PFDs fitted & buckled', hint: 'One per paddler, correct size' },
  { id: 'bungs', label: 'Hull bungs in place', hint: 'Every kayak checked before launch' },
  { id: 'airbags', label: 'Airbags inflated', hint: 'Bow & stern buoyancy secure' },
  { id: 'whistles', label: 'Whistles attached', hint: 'Clipped to each PFD' },
]

export const POLYGONS = {
  innerHarbor: {
    name: 'Inner Harbour',
    positions: [
      [52.1546, -6.9962],
      [52.1553, -6.9952],
      [52.1556, -6.9934],
      [52.155, -6.9922],
      [52.154, -6.9928],
      [52.1537, -6.9946],
    ],
  },
  outerBay: {
    name: 'Outer Bay',
    positions: [
      [52.162, -7.005],
      [52.17, -6.985],
      [52.16, -6.96],
      [52.145, -6.955],
      [52.136, -6.975],
      [52.14, -7.0],
      [52.15, -7.01],
    ],
  },
}

export const GROUPS_ALLOWED_OUTER_BAY = ['intermediate', 'advanced']
