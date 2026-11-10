import { CalendarDays, Gauge } from 'lucide-react'
import { PROVIDER_IDS, PROVIDERS } from '../services/providers'

function Tab({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
        active ? 'bg-sky-500/20 text-white' : 'text-slate-400 hover:text-slate-200',
      ].join(' ')}
    >
      <Icon size={15} aria-hidden="true" />
      {children}
    </button>
  )
}

function ProviderOptions({ ids }) {
  return ids.map((id) => {
    const meta = PROVIDERS[id]
    return (
      <option key={id} value={id}>
        {meta.label} — {meta.modelLabel} · {meta.badge}
      </option>
    )
  })
}

export default function Toolbar({ tab, onTab, provider, onProvider }) {
  const openMeteoIds = PROVIDER_IDS.filter((id) => PROVIDERS[id].group === 'open-meteo')
  const otherIds = PROVIDER_IDS.filter((id) => PROVIDERS[id].group !== 'open-meteo')

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label="View"
        className="inline-flex w-fit rounded-xl border border-slate-700 bg-slate-900/60 p-1"
      >
        <Tab active={tab === 'current'} icon={Gauge} onClick={() => onTab('current')}>
          Current
        </Tab>
        <Tab active={tab === 'forecast'} icon={CalendarDays} onClick={() => onTab('forecast')}>
          Forecast
        </Tab>
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="provider-select"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
        >
          Source
        </label>
        <select
          id="provider-select"
          value={provider}
          onChange={(event) => onProvider(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <optgroup label="Open-Meteo models">
            <ProviderOptions ids={openMeteoIds} />
          </optgroup>
          <optgroup label="Other sources">
            <ProviderOptions ids={otherIds} />
          </optgroup>
        </select>
      </div>
    </div>
  )
}
