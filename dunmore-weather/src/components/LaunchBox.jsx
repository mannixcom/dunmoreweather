import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { RISK_THRESHOLDS } from '../constants'
import { waveMargin, windMargin } from '../logic/risk'

function ReasonChip({ tone, children }) {
  const styles =
    tone === 'bad'
      ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
      : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}>
      {children}
    </span>
  )
}

export default function LaunchBox({ telemetry, group, evaluation }) {
  const limits = RISK_THRESHOLDS[group]
  const approved = evaluation.isLaunchApproved

  const shell = approved
    ? 'bg-emerald-950/40 border-emerald-500'
    : 'bg-rose-950/40 border-rose-500'
  const accent = approved ? 'text-emerald-300' : 'text-rose-300'
  const Icon = approved ? ShieldCheck : ShieldAlert

  const windLeft = windMargin(telemetry, group)
  const waveLeft = waveMargin(telemetry, group)

  return (
    <section
      className={`rounded-2xl border-2 p-5 shadow-lg ${shell}`}
      aria-live="polite"
      aria-label="Launch status"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Live launch decision
          </p>
          <h2 className={`mt-1 text-3xl font-extrabold tracking-tight ${accent}`}>
            {approved ? 'LAUNCH APPROVED' : 'HOLD'}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {limits.label} group · limits {limits.maxWind} kt wind / {limits.maxGust} kt gust /{' '}
            {limits.maxWave} m wave
          </p>
        </div>
        <Icon size={44} className={`shrink-0 ${accent}`} aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ReasonChip tone={evaluation.isWindViolated ? 'bad' : 'good'}>
          {evaluation.isWindViolated ? 'Wind / gust over limit' : 'Wind within limit'}
        </ReasonChip>
        <ReasonChip tone={evaluation.isWaveViolated ? 'bad' : 'good'}>
          {evaluation.isWaveViolated ? 'Sea state over limit' : 'Sea state within limit'}
        </ReasonChip>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-black/20 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-slate-400">Wind headroom</dt>
          <dd className={`text-base font-semibold ${windLeft < 0 ? 'text-rose-300' : 'text-slate-100'}`}>
            {windLeft == null ? '—' : `${windLeft > 0 ? '+' : ''}${windLeft.toFixed(1)} kt`}
          </dd>
        </div>
        <div className="rounded-lg bg-black/20 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-slate-400">Wave headroom</dt>
          <dd className={`text-base font-semibold ${waveLeft < 0 ? 'text-rose-300' : 'text-slate-100'}`}>
            {waveLeft == null ? '—' : `${waveLeft > 0 ? '+' : ''}${waveLeft.toFixed(2)} m`}
          </dd>
        </div>
      </dl>
    </section>
  )
}
