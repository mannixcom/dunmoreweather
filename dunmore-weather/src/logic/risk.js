import { RISK_THRESHOLDS } from '../constants'

export function evaluateLaunch(telemetry, group) {
  const limits = RISK_THRESHOLDS[group]
  if (!limits || !telemetry) {
    return { isWindViolated: false, isWaveViolated: false, isLaunchApproved: false }
  }

  const isWindViolated =
    telemetry.windSpeed > limits.maxWind || telemetry.windGust > limits.maxGust
  const isWaveViolated = telemetry.waveHeight > limits.maxWave

  return {
    isWindViolated,
    isWaveViolated,
    isLaunchApproved: !isWindViolated && !isWaveViolated,
  }
}

export function windMargin(telemetry, group) {
  const limits = RISK_THRESHOLDS[group]
  if (!limits || !telemetry) return null
  return Math.min(limits.maxWind - telemetry.windSpeed, limits.maxGust - telemetry.windGust)
}

export function waveMargin(telemetry, group) {
  const limits = RISK_THRESHOLDS[group]
  if (!limits || !telemetry) return null
  return limits.maxWave - telemetry.waveHeight
}

export function compassLabel(degrees) {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16
  return points[index]
}
