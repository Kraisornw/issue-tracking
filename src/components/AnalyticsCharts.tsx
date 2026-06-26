'use client';

import { useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  ComposedChart,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Curated colors for standard visual hierarchy
const COLORS = {
  blue: '#2563eb', // indigo/blue accent
  emerald: '#10b981',
  amber: '#d97706',
  rose: '#e11d48',
  indigo: '#4f46e5',
  purple: '#7c3aed',
  teal: '#0d9488',
  slate: '#64748b'
};

// Custom tooltip renderer for Light Mode
const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 text-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-md">
        {label && <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>}
        {payload.map((pld: any, idx: number) => (
          <p key={idx} className="text-sm font-semibold flex items-center gap-2" style={{ color: pld.color || pld.fill }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color || pld.fill }}></span>
            <span>{pld.name}:</span>
            <span>{valuePrefix}{pld.value}{valueSuffix}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Status Distribution (Donut Chart)
interface StatusDistributionProps {
  data: { name: string; value: number }[];
}
export function StatusDistribution({ data }: StatusDistributionProps) {
  const statusColors: Record<string, string> = {
    'Completed': '#10b981',   // green (emerald-600)
    'Closed': '#10b981',      // green fallback
    'In Progress': '#f97316', // orange (orange-500)
    'Pending': '#fca5a5'      // light red (red-300)
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-800">Issue Status Distribution</CardTitle>
        <CardDescription className="text-xs text-slate-450">Current status splits</CardDescription>
      </CardHeader>
      <CardContent className="h-60 flex flex-col justify-center">
        {total === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">No data available</div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || COLORS.indigo} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center flex flex-col justify-center">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{total}</span>
              <span className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">Issues</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 2. Bar Chart Widget (for Projects, Priorities, etc.)
interface BarChartWidgetProps {
  title: string;
  desc: string;
  data: { name: string; count: number }[];
  dataKey?: string;
  color?: string;
  layout?: 'horizontal' | 'vertical';
}
export function BarChartWidget({ 
  title, 
  desc, 
  data, 
  dataKey = 'count', 
  color = COLORS.indigo,
  layout = 'vertical' 
}: BarChartWidgetProps) {
  
  const displayData = data.slice(0, 8); // Limit to top 8 items for visual cleanliness
  
  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-800">{title}</CardTitle>
        <CardDescription className="text-xs text-slate-450">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="h-60 pt-4">
        {displayData.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {layout === 'vertical' ? (
              <BarChart data={displayData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} tickLine={false} axisLine={false} interval={0} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} name="Issues Count" barSize={12} />
              </BarChart>
            ) : (
              <BarChart data={displayData} layout="horizontal" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} name="Issues Count" barSize={14} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// 3. Monthly Trends (Opened vs Closed)
interface MonthlyTrendsProps {
  data: { month: string; opened: number; closed: number }[];
}
export function MonthlyTrends({ data }: MonthlyTrendsProps) {
  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-800">Issues Trend</CardTitle>
        <CardDescription className="text-xs text-slate-455">Monthly created vs resolved issues</CardDescription>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        {data.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#475569' }}
              />
              <Line type="monotone" dataKey="opened" stroke={COLORS.indigo} strokeWidth={2} dot={{ r: 4 }} name="all Issues" activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="closed" stroke={COLORS.emerald} strokeWidth={2} dot={{ r: 4 }} name="Completed" activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// 4. Resolution Time Trend
interface ResolutionTimeTrendProps {
  data: { month: string; avgDays: number }[];
}
export function ResolutionTimeTrend({ data }: ResolutionTimeTrendProps) {
  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-800">Resolution Time Trend</CardTitle>
        <CardDescription className="text-xs text-slate-455">Average days to complete issues by month</CardDescription>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        {data.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip valueSuffix=" Days" />} />
              <Line type="monotone" dataKey="avgDays" stroke={COLORS.purple} strokeWidth={2.5} dot={{ r: 4 }} name="Avg Resolution Time" activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// 5. Pareto Analysis (80/20 Rule for Category)
interface ParetoAnalysisProps {
  data: { category: string; count: number; cumulativePercent: number }[];
}
export function ParetoAnalysis({ data }: ParetoAnalysisProps) {
  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-800">Pareto Analysis (80/20 Rule)</CardTitle>
        <CardDescription className="text-xs text-slate-455">Identify categories causing 80% of issues</CardDescription>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        {data.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: -10, right: -10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Issues Count', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '9px' } }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', style: { fill: '#64748b', fontSize: '9px' } }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
              <Bar yAxisId="left" dataKey="count" fill={COLORS.indigo} radius={[4, 4, 0, 0]} name="Issues Count" barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" stroke={COLORS.rose} strokeWidth={2} dot={{ r: 4 }} name="Cumulative %" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// 6. Aging Analysis Chart (Open Issues)
interface AgingAnalysisProps {
  data: { range: string; count: number }[];
}
export function AgingAnalysisChart({ data }: AgingAnalysisProps) {
  // Map ranges to colors to show progressive risk
  const colors = [COLORS.emerald, COLORS.blue, COLORS.amber, COLORS.rose];

  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-slate-800">Aging Analysis</CardTitle>
        <CardDescription className="text-xs text-slate-455">Aging of pending issues in brackets</CardDescription>
      </CardHeader>
      <CardContent className="h-60 pt-4">
        {data.every(d => d.count === 0) ? (
          <div className="text-center text-xs text-slate-400 py-12">No pending issues aging</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip valueSuffix=" Issues" />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Pending Issues" barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// 7. Recent Issues by Topic (7, 14, 30 Days)
interface RecentIssuesByTopicProps {
  data: {
    last7Days: { name: string; count: number }[];
    last14Days: { name: string; count: number }[];
    last30Days: { name: string; count: number }[];
  };
}

export function RecentIssuesByTopic({ data }: RecentIssuesByTopicProps) {
  const [range, setRange] = useState<'7' | '14' | '30'>('7');

  const chartData = range === '7' 
    ? data.last7Days 
    : range === '14' 
      ? data.last14Days 
      : data.last30Days;

  return (
    <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-bold text-slate-800">Recent Issues by Topic</CardTitle>
          <CardDescription className="text-xs text-slate-450">Issues logged in recent time ranges</CardDescription>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(['7', '14', '30'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
                range === r
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r}D
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        {chartData.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-16">No issues logged in this range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} tickLine={false} axisLine={false} interval={0} />
              <Tooltip content={<CustomTooltip valueSuffix=" Issues" />} />
              <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Issues Count" barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

