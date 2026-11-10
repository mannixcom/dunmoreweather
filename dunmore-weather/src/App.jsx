import { useMemo, useState } from 'react'
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import LaunchBox from './components/LaunchBox'
import WeatherGrid from './components/WeatherGrid'
import HarborMap from './components/HarborMap'
import GearChecklist from './components/GearChecklist'
import ForecastPanel from './components/ForecastPanel'
import { useMarineTelemetry } from './hooks/useMarineTelemetry'
import { useMarineForecast } from './hooks/useMarineForecast'
import { useCooldown } from './hooks/useCooldown'
import { evaluateLaunch } from './logic/risk'
import { getProvider, PROVIDER_IDS } from './services/providers'
import { readProvider, writeProvider } from './services/cache'
import { DEFAULT_PROVIDER, REFRESH_COOLDOWN_MS } from './constants'

const TIME_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function initialProvider() {
  const saved = readProvider()
  return PROVIDER_IDS.includes(saved) ? saved : DEFAULT_PROVIDER
}

function Banner({ tone, icon: Icon, title, children }) {
  const styles =
    tone === 'warn'
      ? 'border-amber-500/50 bg-amber-950/40 text-amber-100'
      : 'border-sky-500/50 bg-sky-950/40 text-sky-100'
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${styles}`}
      role="status"
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">{title}</span> {children}
      </p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-5" aria-hidden="true">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
      <div className="min-h-[360px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 lg:col-span-3" />
    </div>
  )
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-6 text-center">
      <p className="text-sm font-semibold text-rose-100">
        Unable to load weather data and no cached reading is available.
      </p>
      <p className="mt-1 text-xs text-rose-200/70">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-400/60 bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-50 hover:bg-rose-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        <RefreshCw size={14} aria-hidden="true" />
        Retry
      </button>
    </div>
  )
}

export default function App() {
  const [group, setGroup] = useState('junior')
  const [tab, setTab] = useState('current')
  const [provider, setProvider] = useState(initialProvider)

  const current = useMarineTelemetry(provider)
  const forecast = useMarineForecast(provider, tab === 'forecast')
  const { remaining, active: cooling, start: startCooldown } = useCooldown(REFRESH_COOLDOWN_MS)

  const providerMeta = getProvider(provider)
  const active = tab === 'current' ? current : forecast
  const refreshing = active.status === 'refreshing'
  const fetchedAt = active.fetchedAt

  const evaluation = useMemo(
    () => evaluateLaunch(current.telemetry, group),
    [current.telemetry, group],
  )

  const changeProvider = (id) => {
    writeProvider(id)
    setProvider(id)
  }

  const refreshActive = () => {
    if (refreshing || cooling) return
    startCooldown()
    active.refresh(true)
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-[#0b1220] via-[#0b1220] to-[#0e1a2b] text-slate-200">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-5 md:py-7">
        <Header group={group} onGroupChange={setGroup} />
        <Toolbar
          tab={tab}
          onTab={setTab}
          provider={provider}
          onProvider={changeProvider}
        />

        {active.isStale ? (
          <Banner tone="warn" icon={WifiOff} title="Displaying Cached Data">
            — Connection unstable. Showing the last successful {providerMeta.label} reading
            {fetchedAt ? ` from ${TIME_FORMATTER.format(fetchedAt)}` : ''}.
          </Banner>
        ) : null}

        {active.degraded.length && !active.isStale ? (
          <Banner tone="info" icon={AlertTriangle} title="Partial data">
            — Live {active.degraded.join(' & ')} feed unavailable; related tiles may read zero.
          </Banner>
        ) : null}

        {tab === 'current' ? (
          current.status === 'loading' ? (
            <Skeleton />
          ) : current.status === 'error' ? (
            <ErrorCard message={current.error?.message} onRetry={() => current.refresh(true)} />
          ) : (
            <main className="grid gap-4 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-2">
                <LaunchBox telemetry={current.telemetry} group={group} evaluation={evaluation} />
                <WeatherGrid
                  telemetry={current.telemetry}
                  gustEstimated={current.gustEstimated}
                />
              </div>
              <div className="lg:col-span-3">
                <HarborMap group={group} approved={evaluation.isLaunchApproved} />
              </div>
            </main>
          )
        ) : (
          <main>
            <ForecastPanel
              days={forecast.days}
              status={forecast.status === 'idle' ? 'loading' : forecast.status}
              error={forecast.error}
              group={group}
              gustEstimated={forecast.gustEstimated}
              providerNote={providerMeta.note}
              coverageDays={forecast.coverageDays || forecast.days.length}
              onRetry={() => forecast.refresh(true)}
            />
          </main>
        )}

        <GearChecklist />

        <footer className="space-y-1.5 pb-2 pt-1 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Dunmore East Slipway Hub · 52.152°N, 6.994°W · {providerMeta.label} (
              {providerMeta.modelLabel})
            </span>
            <span className="flex items-center gap-2">
              {fetchedAt ? <span>Updated {TIME_FORMATTER.format(fetchedAt)}</span> : null}
              <button
                type="button"
                onClick={refreshActive}
                disabled={refreshing || cooling}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <RefreshCw
                  size={11}
                  className={refreshing ? 'animate-spin' : ''}
                  aria-hidden="true"
                />
                {refreshing
                  ? 'Refreshing'
                  : cooling
                    ? `Refresh in ${remaining}s`
                    : 'Refresh'}
              </button>
            </span>
          </div>

          <p className="text-[10px] text-slate-600">
            Weather data:{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-slate-400"
            >
              Open-Meteo
            </a>{' '}
            (
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-slate-400"
            >
              CC BY 4.0
            </a>
            )
            {provider === 'met-no' ? (
              <>
                {' '}
                ·{' '}
                <a
                  href="https://www.met.no/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-slate-400"
                >
                  MET Norway
                </a>{' '}
                (
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-slate-400"
                >
                  CC BY 4.0
                </a>
                )
              </>
            ) : null}
            {provider === 'met-eireann' ? (
              <>
                {' '}
                ·{' '}
                <a
                  href="https://www.met.ie/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-slate-400"
                >
                  Met Éireann
                </a>{' '}
                (open data)
              </>
            ) : null}{' '}
            · Map ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-slate-400"
            >
              OpenStreetMap
            </a>{' '}
            contributors
          </p>
        </footer>
      </div>
    </div>
  )
}
