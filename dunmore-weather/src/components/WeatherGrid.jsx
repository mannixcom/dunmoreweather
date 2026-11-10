import {
  Anchor,
  CloudRain,
  Compass,
  Gauge,
  Thermometer,
  Timer,
  Waves,
  Wind,
} from 'lucide-react'
import { compassLabel } from '../logic/risk'

function Tile({ icon: Icon, label, value, unit, sub, tone = 'default' }) {
  const valueTone = tone === 'bad' ? 'text-rose-300' : 'text-white'
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={14} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold leading-none tracking-tight ${valueTone}`}>
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span> : null}
      </p>
      {sub ? <p className="mt-1 text-[11px] text-slate-400">{sub}</p> : null}
    </div>
  )
}

export default function WeatherGrid({ telemetry, gustEstimated = false }) {
  const t = telemetry
  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          Live weather matrix
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Open-Meteo</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Tile
          icon={Wind}
          label="Wind"
          value={t.windSpeed.toFixed(0)}
          unit="kt"
          sub={`Gust ${t.windGust.toFixed(0)} kt${gustEstimated ? ' (est.)' : ''}`}
        />
        <Tile
          icon={Compass}
          label="Direction"
          value={`${Math.round(t.windDirection)}°`}
          sub={compassLabel(t.windDirection)}
        />
        <Tile
          icon={Waves}
          label="Sea state"
          value={t.waveHeight.toFixed(2)}
          unit="m"
          sub={`Swell ${t.swellHeight.toFixed(2)} m`}
        />
        <Tile
          icon={Timer}
          label="Wave period"
          value={t.wavePeriod.toFixed(0)}
          unit="s"
          sub="Dominant wave"
        />
        <Tile
          icon={Thermometer}
          label="Air temp"
          value={t.airTemp.toFixed(1)}
          unit="°C"
        />
        <Tile
          icon={CloudRain}
          label="Precipitation"
          value={t.precipitation.toFixed(1)}
          unit="mm"
        />
        <div className="col-span-2 rounded-xl border border-slate-700/70 bg-slate-900/60 px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Anchor size={14} aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              Next high tide
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <p className="text-2xl font-bold leading-none tracking-tight text-white">
              {t.highTideTime}
            </p>
            <p className="text-sm font-medium text-sky-300">{t.highTideHeight}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
        <Gauge size={12} aria-hidden="true" />
        Wind speed in knots · heights in metres
      </p>
    </section>
  )
}
