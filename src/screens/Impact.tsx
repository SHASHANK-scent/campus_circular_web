import { BarChart3, Leaf, LineChart as LineIcon, Recycle, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge, money, PageTitle } from '../components/Layout'
import { aggregateImpact } from '../lib/impact'
import { useApp } from '../store/AppStore'

const colors = ['#059669', '#f59e0b', '#0f766e', '#64748b', '#e11d48']

export const Impact = () => {
  const { state } = useApp()
  const metrics = aggregateImpact(state)
  return (
    <>
      <PageTitle eyebrow="The circular campus in numbers" title="Campus impact dashboard">
        <Badge tone="green">
          <Leaf className="mr-1 inline h-3.5 w-3.5" /> Computed from live demo state
        </Badge>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Active members', metrics.activeMembers, <Users key="users" />],
          ['Resources shared', metrics.resourcesShared, <Recycle key="recycle" />],
          ['Successful exchanges', metrics.successfulExchanges, <BarChart3 key="bar" />],
          ['On-time returns', `${metrics.onTimePercent}%`, <LineIcon key="line" />],
          ['Money saved', money(metrics.moneySaved), <span key="money">₹</span>],
          ['Items reused', metrics.itemsReused, <Recycle key="reuse" />],
          ['Ownership avoided', `${metrics.ownershipAvoided.toFixed(1)} kg`, <Leaf key="leaf" />],
        ].map(([label, value, icon]) => (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={label as string}
          >
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {label as string}
              </span>
              <span className="h-5 w-5">{icon}</span>
            </div>
            <p className="mt-4 text-3xl font-black">{value as string | number}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Exchanges over time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.exchangesOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="exchanges" stroke="#059669" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Popular categories">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.popularCategories.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="exchanges" fill="#0f766e" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="On-time versus late returns">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={metrics.returnSplit} dataKey="value" nameKey="name" outerRadius={85} label>
                {metrics.returnSplit.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Community leaders
          </p>
          <h2 className="mt-1 text-xl font-black">Top lenders</h2>
          <div className="mt-5 space-y-3">
            {metrics.topLenders.slice(0, 5).map((lender, index) => (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3" key={lender.name}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                  #{index + 1}
                </span>
                <span className="flex-1 text-sm font-bold">{lender.name}</span>
                <span className="text-xs font-black text-emerald-700">
                  {lender.exchanges} exchanges
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-lg font-black">{title}</h2>
    <div className="mt-4 h-64">{children}</div>
  </div>
)
