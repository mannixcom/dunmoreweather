const UPSTREAM = 'http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast'

export default async function handler(request) {
  try {
    const incoming = new URL(request.url)
    const params = new URLSearchParams()
    params.set('lat', incoming.searchParams.get('lat') ?? '52.152')
    params.set('long', incoming.searchParams.get('long') ?? '-6.994')

    const response = await fetch(`${UPSTREAM}?${params.toString()}`, {
      headers: { Accept: 'application/xml' },
    })
    const body = await response.text()

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    })
  } catch {
    return Response.json({ error: 'Met Éireann upstream unavailable' }, { status: 502 })
  }
}

export const config = { path: '/api/met-eireann' }
