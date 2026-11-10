import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip } from 'react-leaflet'
import { ANCHOR, GROUPS_ALLOWED_OUTER_BAY, POLYGONS } from '../constants'

export default function HarborMap({ group, approved }) {
  const showOuter = GROUPS_ALLOWED_OUTER_BAY.includes(group)
  const color = approved ? '#34d399' : '#fb7185'
  const fill = approved ? '#34d399' : '#fb7185'

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-700/70 bg-slate-900/40 p-2">
      <div className="flex items-center justify-between px-2 py-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          Active boundary map
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          {showOuter ? 'Inner harbour + outer bay' : 'Inner harbour only'}
        </span>
      </div>

      <div className="min-h-[360px] flex-1 overflow-hidden rounded-xl">
        <MapContainer
          center={[ANCHOR.lat, ANCHOR.lon]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showOuter ? (
            <Polygon
              positions={POLYGONS.outerBay.positions}
              pathOptions={{
                color,
                weight: 2,
                dashArray: '6 6',
                fillColor: fill,
                fillOpacity: 0.08,
              }}
            >
              <Tooltip sticky>{POLYGONS.outerBay.name}</Tooltip>
            </Polygon>
          ) : null}

          <Polygon
            positions={POLYGONS.innerHarbor.positions}
            pathOptions={{
              color,
              weight: 2,
              fillColor: fill,
              fillOpacity: 0.18,
            }}
          >
            <Tooltip sticky>{POLYGONS.innerHarbor.name}</Tooltip>
          </Polygon>

          <CircleMarker
            center={[ANCHOR.lat, ANCHOR.lon]}
            radius={8}
            pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 1, weight: 2 }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {ANCHOR.label}
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>

      <p className="px-2 pb-1 pt-2 text-[10px] text-slate-500">
        Boundary outlines are approximate charting guides — confirm against local harbour notices.
      </p>
    </section>
  )
}
