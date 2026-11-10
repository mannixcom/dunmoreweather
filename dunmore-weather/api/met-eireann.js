const UPSTREAM = 'http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast'

export default async function handler(req, res) {
  try {
    const params = new URLSearchParams()
    params.set('lat', req.query?.lat ?? '52.152')
    params.set('long', req.query?.long ?? '-6.994')

    const response = await fetch(`${UPSTREAM}?${params.toString()}`, {
      headers: { Accept: 'application/xml' },
    })
    const body = await response.text()

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600')
    res.status(response.status).send(body)
  } catch {
    res.status(502).json({ error: 'Met Éireann upstream unavailable' })
  }
}
