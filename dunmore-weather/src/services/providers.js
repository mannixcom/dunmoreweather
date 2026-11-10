import { fetchMarineTelemetry, fetchOpenMeteoForecast } from './weather'
import { fetchMetNoCurrent, fetchMetNoForecast } from './metno'
import { fetchMetEireannCurrent, fetchMetEireannForecast } from './meteireann'

function openMeteoProvider(id, model, modelLabel, note, badge = '16-day') {
  return {
    id,
    group: 'open-meteo',
    label: 'Open-Meteo',
    modelLabel,
    badge,
    note,
    forecastDays: 16,
    gustEstimated: false,
    current: () => fetchMarineTelemetry({ model }),
    forecast: () => fetchOpenMeteoForecast({ model }),
  }
}

export const PROVIDERS = {
  'open-meteo': openMeteoProvider(
    'open-meteo',
    null,
    'Best match',
    'Best match (UKMO/ECMWF/ICON/GFS) · marine 16 days',
  ),
  'open-meteo-ukmo': openMeteoProvider(
    'open-meteo-ukmo',
    'ukmo_seamless',
    'UK Met Office 2 km',
    'UKMO 2 km · 7-day forecast',
    '7-day',
  ),
  'open-meteo-ecmwf': openMeteoProvider(
    'open-meteo-ecmwf',
    'ecmwf_ifs025',
    'ECMWF IFS',
    'ECMWF IFS 0.25° · 15-day forecast',
    '15-day',
  ),
  'open-meteo-icon': openMeteoProvider(
    'open-meteo-icon',
    'icon_seamless',
    'DWD ICON',
    'DWD ICON · 7-day forecast',
    '7-day',
  ),
  'open-meteo-gfs': openMeteoProvider(
    'open-meteo-gfs',
    'gfs_seamless',
    'NOAA GFS',
    'NOAA GFS · 16-day forecast',
  ),
  'met-no': {
    id: 'met-no',
    group: 'other',
    label: 'MET Norway',
    modelLabel: 'YR',
    badge: '10-day',
    note: 'Atmospheric ~10 days · ocean ~8 days',
    forecastDays: 10,
    gustEstimated: true,
    current: fetchMetNoCurrent,
    forecast: fetchMetNoForecast,
  },
  'met-eireann': {
    id: 'met-eireann',
    group: 'other',
    label: 'Met Éireann',
    modelLabel: 'HARMONIE + ECMWF',
    badge: '10-day',
    note: 'HARMONIE 2 km + ECMWF ~10 days · waves via Open-Meteo',
    forecastDays: 10,
    gustEstimated: false,
    current: fetchMetEireannCurrent,
    forecast: fetchMetEireannForecast,
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDERS)

export function getProvider(id) {
  return PROVIDERS[id] ?? PROVIDERS['open-meteo']
}
