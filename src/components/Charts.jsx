import {
  ResponsiveContainer, LineChart, BarChart, AreaChart,
  Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

function darken(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}

export function ActivityHeatmap({ title, activeDates, color }) {
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
          <div
            key={i}
            className="aspect-square rounded-sm flex items-center justify-center"
            style={{
              backgroundColor: cell.active ? color : '#111111',
              border: `1px solid ${color}`,
              boxSizing: 'border-box',
              fontSize: 9,
              fontVariantNumeric: 'tabular-nums',
              color: cell.active ? activeText : inactiveText,
            }}
          >
            {cell.day}
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
