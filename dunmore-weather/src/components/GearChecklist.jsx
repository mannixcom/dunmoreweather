import { useState } from 'react'
import { CheckSquare, ListCollapse, RotateCcw } from 'lucide-react'
import { GEAR_ITEMS } from '../constants'
import { readGearState, writeGearState } from '../services/cache'

export default function GearChecklist() {
  const [checked, setChecked] = useState(() => readGearState())

  const total = GEAR_ITEMS.length
  const done = GEAR_ITEMS.filter((item) => checked[item.id]).length
  const complete = done === total

  const toggle = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      writeGearState(next)
      return next
    })
  }

  const reset = () => {
    setChecked({})
    writeGearState({})
  }

  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-sky-300" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
            Gear verification
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold ${complete ? 'text-emerald-300' : 'text-slate-400'}`}
          >
            {done}/{total} complete
          </span>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <RotateCcw size={12} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-400' : 'bg-sky-400'}`}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {GEAR_ITEMS.map((item) => {
          const isOn = Boolean(checked[item.id])
          return (
            <li key={item.id}>
              <label
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition',
                  isOn
                    ? 'border-emerald-500/50 bg-emerald-950/30'
                    : 'border-slate-700/70 bg-slate-900/50 hover:border-slate-600',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-500 bg-slate-800 accent-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                />
                <span>
                  <span
                    className={`block text-sm font-medium ${isOn ? 'text-emerald-100' : 'text-slate-100'}`}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{item.hint}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500">
        <ListCollapse size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        Complete every item before setting foot on the slipway. Ticks persist on this device.
      </p>
    </section>
  )
}
