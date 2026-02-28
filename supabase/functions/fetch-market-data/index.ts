import { createClient } from 'npm:@supabase/supabase-js@2'

const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Use service role to bypass RLS — this is a server-side ingest function
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Map of clean symbol names → Polygon ticker format
const SYMBOLS = [
  { ticker: 'VOO',   symbol: 'VOO' },
  { ticker: 'VXX',   symbol: 'VXX' },
]

interface Snapshot {
  date: string
  symbol: string
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

async function fetchPreviousClose(ticker: string, symbol: string): Promise<Snapshot | null> {
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=${POLYGON_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.length) {
    console.warn(`No data returned for ${ticker}:`, data.status, data.error ?? '')
    return null
  }

  const r = data.results[0]
  return {
    date: new Date(r.t).toISOString().split('T')[0],
    symbol,
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v ?? null,
  }
}

Deno.serve(async () => {
  try {
    const results = await Promise.all(
      SYMBOLS.map(({ ticker, symbol }) => fetchPreviousClose(ticker, symbol))
    )

    const rows = results.filter((r): r is Snapshot => r !== null)

    if (rows.length === 0) {
      return Response.json({ message: 'No data fetched — market may be closed' })
    }

    const { error } = await supabase
      .from('market_snapshots')
      .upsert(rows, { onConflict: 'date,symbol' })

    if (error) throw error

    console.log(`Upserted ${rows.length} rows:`, rows.map(r => `${r.symbol} ${r.date} close=${r.close}`))
    return Response.json({ upserted: rows.length, rows })
  } catch (err) {
    console.error('fetch-market-data error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
})
