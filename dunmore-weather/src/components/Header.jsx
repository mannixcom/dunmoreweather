import { Anchor } from 'lucide-react'
import { GROUPS, GROUP_BUTTON_LABELS, RISK_THRESHOLDS } from '../constants'

export default function Header({ group, onGroupChange }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30">
          <Anchor size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            Dunmore East Sea Scouts
          </h1>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Marine weather &amp; launch safety
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Proficiency group selection">
        {GROUPS.map((key) => {
          const active = key === group
          const limits = RISK_THRESHOLDS[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => onGroupChange(key)}
              aria-pressed={active}
              className={[
                'flex flex-col items-start rounded-lg border px-3 py-2 text-left transition',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
                active
                  ? 'border-sky-400 bg-sky-500/20 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.35)]'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800',
              ].join(' ')}
            >
              <span className="text-sm font-semibold leading-tight">
                {GROUP_BUTTON_LABELS[key]}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                ≤ {limits.maxWind} kt · {limits.maxWave} m
              </span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}
