import {
  ResponsiveContainer, LineChart, BarChart, AreaChart,
  Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { BIBLE_BOOKS } from '../lib/bible'

function darken(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}

export function ActivityHeatmap({ title, activeDates, color, onDateClick }) {
  const today = new Date()

  // Always show exactly 28 days ending today — no future cells, no alignment tricks
  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 27 + i)
    const dateStr = d.toLocaleDateString('en-CA')
    return { day: d.getDate(), dateStr, active: activeDates.has(dateStr) }
  })

  const inactiveText = darken(color, 0.3)
  const activeText   = darken(color, 0.55)

  return (
    <Card title={title}>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => onDateClick?.(cell.dateStr)}
            className="aspect-square rounded-sm flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-neutral-500 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: cell.active ? color : '#111111',
              border: `1px solid ${color}`,
              boxSizing: 'border-box',
              fontSize: 14,
              fontVariantNumeric: 'tabular-nums',
              color: cell.active ? activeText : inactiveText,
              cursor: 'pointer',
            }}
          >
            {cell.day}
          </button>
        ))}
      </div>
    </Card>
  )
}

const MORNING_COLOR = '#60a5fa'
const EVENING_COLOR = '#c084fc'

export function MoodGrid({ data }) {
  const today = new Date()

  const byDate = {}
  for (const row of data) byDate[row.date] = row

  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 27 + i)
    const dateStr = d.toLocaleDateString('en-CA')
    const entry = byDate[dateStr] ?? {}
    return { day: d.getDate(), morning: entry.morning ?? null, evening: entry.evening ?? null }
  })

  return (
    <Card title="Daily Mood">
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#111111',
              border: '1px solid #1e1e1e',
              borderRadius: 3,
              position: 'relative',
              aspectRatio: '3/4',
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 12,
              color: '#737373',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {cell.day}
            </span>
            {cell.morning != null && (
              <span style={{
                position: 'absolute',
                bottom: 3,
                left: 4,
                fontSize: 15,
                color: MORNING_COLOR,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
              }}>
                {cell.morning}
              </span>
            )}
            {cell.evening != null && (
              <span style={{
                position: 'absolute',
                bottom: 3,
                right: 4,
                fontSize: 15,
                color: EVENING_COLOR,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
              }}>
                {cell.evening}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

const GRID = '#262626'
const AXIS = '#525252'

const fmt = (d) => {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1]} ${+day}`
}

const tip = {
  contentStyle: { background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#a3a3a3' },
  itemStyle: { color: '#d4d4d4' },
  labelFormatter: fmt,
}

const axis = { fill: AXIS, fontSize: 11 }

function Card({ title, children }) {
  return (
    <div className="bg-neutral-900 rounded-xl p-5 space-y-3">
      <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

const margin = { top: 4, right: 8, bottom: 0, left: -16 }

export function MoodChart({ data }) {
  return (
    <Card title="Mood">
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={axis} tickLine={false} />
          <YAxis domain={[1, 10]} ticks={[1,3,5,7,10]} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          <Line type="monotone" dataKey="morning" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Morning" connectNulls />
          <Line type="monotone" dataKey="evening" stroke="#c084fc" strokeWidth={1.5} dot={false} name="Evening" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function TemperatureChart({ data }) {
  return (
    <Card title="Feels Like Temp (°F)">
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={axis} tickLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          <Line type="monotone" dataKey="feels_like_max_f" stroke="#f97316" strokeWidth={1.5} dot={false} name="High" connectNulls />
          <Line type="monotone" dataKey="feels_like_min_f" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Low" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function DaylightChart({ data }) {
  return (
    <Card title="Daylight Hours">
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={margin}>
          <CartesianGrid stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={axis} tickLine={false} />
          <YAxis domain={['auto', 'auto']} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          <Area type="monotone" dataKey="daylight_hours" stroke="#fbbf24" fill="#fbbf2415" strokeWidth={1.5} dot={false} name="Hours" connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function PrecipitationChart({ data }) {
  return (
    <Card title="Precipitation (in)">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={axis} tickLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          <Bar dataKey="precipitation_in" fill="#6366f1" radius={[2, 2, 0, 0]} name="Inches" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function VOOChart({ data }) {
  return (
    <Card title="VOO (S&P 500)">
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={axis} tickLine={false} />
          <YAxis domain={['auto', 'auto']} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          <Line type="monotone" dataKey="VOO" stroke="#34d399" strokeWidth={1.5} dot={false} name="Close" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function VXXChart({ data }) {
  return (
    <Card title="VXX (Volatility)">
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={axis} tickLine={false} />
          <YAxis domain={['auto', 'auto']} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          <Line type="monotone" dataKey="VXX" stroke="#f87171" strokeWidth={1.5} dot={false} name="Close" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

const OT_BOOKS = BIBLE_BOOKS.slice(0, 39)
const NT_BOOKS = BIBLE_BOOKS.slice(39)
const SCRIPTURE_ACCENT = '#4ade80'

function bookAbbrev(name) {
  if (name === 'Song of Solomon') return 'SoS'
  const numbered = name.match(/^(\d)\s+(.+)/)
  if (numbered) return `${numbered[1]}${numbered[2].slice(0, 2)}`
  return name.slice(0, 3)
}

// Greedy row packing: split books into numRows rows, balancing chapter totals per row
function computeRows(books, numRows) {
  const total = books.reduce((s, b) => s + b.chapters, 0)
  const target = total / numRows
  const rows = []
  let current = []
  let currentTotal = 0

  for (const book of books) {
    if (current.length > 0 && currentTotal + book.chapters / 2 > target && rows.length < numRows - 1) {
      rows.push({ books: current, total: currentTotal })
      current = [book]
      currentTotal = book.chapters
    } else {
      current.push(book)
      currentTotal += book.chapters
    }
  }
  if (current.length) rows.push({ books: current, total: currentTotal })
  return rows
}

export function ScriptureCoverageMap({ readings }) {
  const bookStats = {}
  for (const r of readings) {
    for (const sel of (r.selections ?? [])) {
      if (!bookStats[sel.book]) bookStats[sel.book] = { chaptersRead: new Set(), lastReadAt: null }
      for (const ch of (sel.chapters ?? [])) bookStats[sel.book].chaptersRead.add(ch)
      const d = new Date(r.read_at)
      if (!bookStats[sel.book].lastReadAt || d > bookStats[sel.book].lastReadAt)
        bookStats[sel.book].lastReadAt = d
    }
  }

  const now = new Date()

  function tileStyle(book) {
    const stats = bookStats[book.name]
    const chaptersRead = stats ? stats.chaptersRead.size : 0
    const pct = chaptersRead / book.chapters
    const daysSince = stats?.lastReadAt ? (now - stats.lastReadAt) / 86400000 : Infinity
    const isRecent = daysSince <= 90
    return {
      bg:     pct > 0 && isRecent ? '#052e16' : '#111',
      border: pct === 0 ? '#1f1f1f' : isRecent ? SCRIPTURE_ACCENT : '#166534',
      text:   pct === 0 ? '#404040' : isRecent ? SCRIPTURE_ACCENT : '#4ade8066',
      bar:    isRecent ? SCRIPTURE_ACCENT : '#166534',
      pct,
      chaptersRead,
    }
  }

  function TreemapSection({ books, numRows, containerHeight }) {
    const rows = computeRows(books, numRows)
    const sectionTotal = books.reduce((s, b) => s + b.chapters, 0)

    return (
      <div style={{ height: containerHeight, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((row, ri) => {
          const rowHeight = Math.round((row.total / sectionTotal) * containerHeight)
          return (
            <div key={ri} style={{ display: 'flex', flex: `0 0 ${rowHeight}px`, gap: 2 }}>
              {row.books.map(book => {
                const widthPct = (book.chapters / row.total) * 100
                const { bg, border, text, bar, pct, chaptersRead } = tileStyle(book)
                return (
                  <div
                    key={book.name}
                    title={`${book.name} — ${chaptersRead}/${book.chapters} ch`}
                    style={{
                      flex: `0 0 calc(${widthPct}% - 1px)`,
                      backgroundColor: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      cursor: 'default',
                      userSelect: 'none',
                      gap: 2,
                      padding: '2px 2px',
                    }}
                  >
                    <span style={{ color: text, fontSize: 9, fontFamily: 'monospace', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {bookAbbrev(book.name)}
                    </span>
                    <div style={{ width: '75%', height: 2, backgroundColor: '#262626', borderRadius: 1, flexShrink: 0 }}>
                      {pct > 0 && (
                        <div style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: bar, borderRadius: 1 }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card title="Scripture Coverage">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">Old Testament</p>
          <TreemapSection books={OT_BOOKS} numRows={6} containerHeight={240} />
        </div>
        <div>
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">New Testament</p>
          <TreemapSection books={NT_BOOKS} numRows={4} containerHeight={130} />
        </div>
        <div className="flex items-center gap-5 pt-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#052e16', border: `1px solid ${SCRIPTURE_ACCENT}` }} />
            <span className="text-[10px] text-neutral-500">read (&lt;90 days)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#111', border: '1px solid #166534' }} />
            <span className="text-[10px] text-neutral-500">read (older)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#111', border: '1px solid #1f1f1f' }} />
            <span className="text-[10px] text-neutral-500">not read</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
