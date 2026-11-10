import { useId } from 'react'

const WIDTH = 240
const HEIGHT = 104
const PAD = { left: 10, right: 10, top: 22, bottom: 28 }

const TODAY_KEY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Dublin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

const HOUR_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Dublin',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function currentHour() {
  const parts = HOUR_FORMATTER.formatToParts(new Date())
  const hours = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minutes = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return (hours % 24) + minutes / 60
}

function smoothPath(coords) {
  if (coords.length < 2) return ''

  let path = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i - 1] ?? coords[i]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2] ?? p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return path
}

export default function TideCurve({ tides = [], points = [], dateKey }) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  if (!Array.isArray(points) || points.length < 2) {
    return (
      <p className="py-5 text-center text-[10px] text-slate-500">Tide data unavailable</p>
    )
  }

  const heights = points.map((point) => point.height)
  let min = Math.min(...heights)
  let max = Math.max(...heights)
  if (max - min < 0.1) {
    min -= 0.1
    max += 0.1
  }

  const range = max - min
  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const baseline = PAD.top + plotHeight
  const xOf = (hour) => PAD.left + (Math.max(0, Math.min(24, hour)) / 24) * plotWidth
  const yOf = (height) => PAD.top + (1 - (height - min) / range) * plotHeight

  const coords = points.map((point) => ({ x: xOf(point.hour), y: yOf(point.height) }))
  const line = smoothPath(coords)
  const first = coords[0]
  const last = coords[coords.length - 1]
  const area = `${line} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`
  const nowHour = dateKey === TODAY_KEY ? currentHour() : null

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mt-1 h-[92px] w-full"
      role="img"
      aria-label="Tide curve showing high and low tides"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <line
        x1={PAD.left}
        x2={WIDTH - PAD.right}
        y1={baseline}
        y2={baseline}
        stroke="#334155"
        strokeWidth="0.8"
      />

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {nowHour != null ? (
        <line
          x1={xOf(nowHour)}
          x2={xOf(nowHour)}
          y1={PAD.top}
          y2={baseline}
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.75"
        />
      ) : null}

      {tides.map((tide, index) => {
        const x = xOf(tide.hour)
        const y = yOf(tide.height)
        const isHigh = tide.type === 'high'
        const anchor = x < WIDTH * 0.2 ? 'start' : x > WIDTH * 0.8 ? 'end' : 'middle'

        return (
          <g key={`${tide.type}-${tide.time}-${index}`}>
            <circle
              cx={x}
              cy={y}
              r={isHigh ? 3.2 : 2.6}
              fill={isHigh ? '#38bdf8' : '#0f172a'}
              stroke={isHigh ? '#38bdf8' : '#94a3b8'}
              strokeWidth="1.2"
            />
            <text
              x={x}
              y={isHigh ? y - 10 : y + 12}
              textAnchor={anchor}
              fill={isHigh ? '#e2e8f0' : '#94a3b8'}
              style={{ fontSize: 8, fontWeight: 600 }}
            >
              {tide.time}
            </text>
            <text
              x={x}
              y={isHigh ? y - 3 : y + 20}
              textAnchor={anchor}
              fill="#64748b"
              style={{ fontSize: 7 }}
            >
              {tide.height.toFixed(1)}m
            </text>
          </g>
        )
      })}

      <text x={PAD.left} y={HEIGHT - 6} fill="#475569" style={{ fontSize: 6.5 }}>
        00
      </text>
      <text
        x={WIDTH / 2}
        y={HEIGHT - 6}
        textAnchor="middle"
        fill="#475569"
        style={{ fontSize: 6.5 }}
      >
        12
      </text>
      <text
        x={WIDTH - PAD.right}
        y={HEIGHT - 6}
        textAnchor="end"
        fill="#475569"
        style={{ fontSize: 6.5 }}
      >
        24
      </text>
    </svg>
  )
}
