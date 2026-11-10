import {
  CloudRain,
  Compass,
  RefreshCw,
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react'
import { RISK_THRESHOLDS } from '../constants'
import { compassLabel, evaluateLaunch } from '../logic/risk'
import TideCurve from './TideCurve'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  weekday: 'short',
  timeZone: 'UTC',
})
const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const TODAY_KEY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Dublin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

function parseDateKey(date) {
  return new Date(`${date}T12:00:00Z`)
}

function DayCard({ day, group, gustEstimated, index }) {
  const limits = RISK_THRESHOLDS[group]
  const evaluation = evaluateLaunch(
    {
      windSpeed: day.windMax,
      windGust: day.gustMax,
      waveHeight: day.waveMax ?? 0,
    },
    group,
  )
  const approved = evaluation.isLaunchApproved
  const date = parseDateKey(day.date)
  const isToday = day.date === TODAY_KEY

  const waveViolated = day.seaKnown && day.waveMax != null && day.waveMax > limits.maxWave

  return (
    <article
      className={[
        'rounded-xl border p-3 transition',
        approved
          ? 'border-emerald-500/40 bg-emerald-950/20'
          : 'border-rose-500/40 bg-rose-950/20',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">
            {WEEKDAY_FORMATTER.format(date)}{' '}
            <span className="font-normal text-slate-400">
              {DAY_MONTH_FORMATTER.format(date)}
            </span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            {isToday ? 'Today' : index === 1 ? 'Tomorrow' : `Day ${index + 1}`}
          </p>
        </div>
        <span
          className={[
            'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            approved
              ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
              : 'border-rose-400/60 bg-rose-500/15 text-rose-300',
          ].join(' ')}
        >
          {approved ? 'Go' : 'Hold'}
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-slate-400">
            <Wind size={12} aria-hidden="true" /> Wind
          </dt>
          <dd className={evaluation.isWindViolated ? 'font-semibold text-rose-300' : 'text-slate-100'}>
            {day.windMax.toFixed(0)} kt
            <span className="text-slate-500">
              {' '}
              / gust {day.gustMax.toFixed(0)}
              {gustEstimated ? '*' : ''}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-slate-400">
            <Waves size={12} aria-hidden="true" /> Sea
          </dt>
          <dd className={waveViolated ? 'font-semibold text-rose-300' : 'text-slate-100'}>
            {day.waveMax != null ? `${day.waveMax.toFixed(2)} m` : 'n/a'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-slate-400">
            <Compass size={12} aria-hidden="true" /> Dir
          </dt>
          <dd className="text-slate-100">
            {compassLabel(day.windDir)} <span className="text-slate-500">{Math.round(day.windDir)}°</span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-slate-400">
            <Thermometer size={12} aria-hidden="true" /> Temp
          </dt>
          <dd className="text-slate-100">
            {day.tempMin.toFixed(0)}–{day.tempMax.toFixed(0)}°C
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 text-slate-400">
            <CloudRain size={12} aria-hidden="true" /> Rain
          </dt>
          <dd className="text-slate-100">{day.precip.toFixed(1)} mm</dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-slate-700/50 pt-2">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-slate-500">
          Tide · high &amp; low
        </p>
        <TideCurve
          tides={day.tides ?? []}
          points={day.tidePoints ?? []}
          dateKey={day.date}
        />
      </div>
    </article>
  )
}

function EmptyState({ status, error, onRetry }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-6 text-center">
      <p className="text-sm font-semibold text-slate-200">
        {status === 'error' ? 'Forecast unavailable' : 'No forecast data returned.'}
      </p>
      {error ? <p className="mt-1 text-xs text-slate-400">{error.message}</p> : null}
      <button
        type="button"
        onClick={() => onRetry()}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <RefreshCw size={14} aria-hidden="true" />
        Retry
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60"
        />
      ))}
    </div>
  )
}

export default function ForecastPanel({
  days,
  status,
  error,
  group,
  gustEstimated,
  providerNote,
  coverageDays,
  onRetry,
}) {
  if (status === 'loading') return <LoadingState />
  if (status === 'error' || days.length === 0) {
    return <EmptyState status={status} error={error} onRetry={onRetry} />
  }

  const limits = RISK_THRESHOLDS[group]
  const results = days.map((day) => ({
    day,
    approved: evaluateLaunch(
      { windSpeed: day.windMax, windGust: day.gustMax, waveHeight: day.waveMax ?? 0 },
      group,
    ).isLaunchApproved,
  }))
  const goCount = results.filter((r) => r.approved).length

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/40 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
            {coverageDays}-day outlook
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {providerNote} · {limits.label} limits ({limits.maxWind} kt / {limits.maxGust} kt gust /{' '}
            {limits.maxWave} m)
          </p>
        </div>
        <p className="text-sm font-semibold">
          <span className="text-emerald-300">{goCount} GO</span>
          <span className="text-slate-500"> · </span>
          <span className="text-rose-300">{days.length - goCount} HOLD</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {results.map(({ day }, index) => (
          <DayCard
            key={day.date}
            day={day}
            group={group}
            gustEstimated={gustEstimated}
            index={index}
          />
        ))}
      </div>

      <p className="text-[11px] text-slate-500">
        {gustEstimated ? '* Gusts estimated from sustained wind — MET Norway provides no gust field. ' : ''}
        Daily figures are worst-case maxima for the day. Sea state shown as “n/a” where the source
        has no marine coverage. Tide curves are model-derived from Open-Meteo sea-level data.
      </p>
    </section>
  )
}
