'use client';

import { 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Hourglass, 
  Percent, 
  CalendarDays,
  Gauge
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardSummary } from '@/types';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Issues',
      value: summary.totalIssues,
      icon: ClipboardList,
      color: 'text-indigo-600 border-indigo-200 bg-indigo-50/60',
      glow: 'group-hover:border-indigo-400/50 group-hover:shadow-indigo-100/80',
      desc: 'All imported tickets'
    },
    {
      title: 'Pending Issues',
      value: summary.openIssues,
      icon: Clock,
      color: 'text-amber-600 border-amber-200 bg-amber-50/60',
      glow: 'group-hover:border-amber-400/50 group-hover:shadow-amber-100/80',
      desc: 'Waiting for action'
    },
    {
      title: 'In Progress',
      value: summary.inProgressIssues,
      icon: Hourglass,
      color: 'text-blue-600 border-blue-200 bg-blue-50/60',
      glow: 'group-hover:border-blue-400/50 group-hover:shadow-blue-100/80',
      desc: 'Actively being fixed'
    },
    {
      title: 'Completed Issues',
      value: summary.closedIssues,
      icon: CheckCircle2,
      color: 'text-emerald-600 border-emerald-200 bg-emerald-50/60',
      glow: 'group-hover:border-emerald-400/50 group-hover:shadow-emerald-100/80',
      desc: 'Resolved and verified'
    },
    {
      title: 'Overdue Issues',
      value: summary.overdueIssues,
      icon: CalendarDays,
      color: summary.overdueIssues > 0 ? 'text-rose-600 border-rose-200 bg-rose-50/60' : 'text-slate-500 border-slate-200 bg-slate-50/60',
      glow: summary.overdueIssues > 0 ? 'group-hover:border-rose-400/50 group-hover:shadow-rose-100/80' : 'group-hover:border-slate-300',
      desc: 'Passed their due date'
    },
    {
      title: 'High Priority',
      value: summary.criticalIssues,
      icon: AlertTriangle,
      color: summary.criticalIssues > 0 ? 'text-red-600 border-red-200 bg-red-50/60' : 'text-slate-500 border-slate-200 bg-slate-50/60',
      glow: summary.criticalIssues > 0 ? 'group-hover:border-red-400/50 group-hover:shadow-red-100/80' : 'group-hover:border-slate-300',
      desc: 'High priority open issues'
    },
    {
      title: 'Resolution Rate',
      value: `${summary.resolutionRate}%`,
      icon: Percent,
      color: 'text-teal-600 border-teal-200 bg-teal-50/60',
      glow: 'group-hover:border-teal-400/50 group-hover:shadow-teal-100/80',
      desc: 'Closed vs total issues'
    },
    {
      title: 'Avg Resolution Time',
      value: `${summary.averageResolutionTimeDays} Days`,
      icon: Clock,
      color: 'text-purple-600 border-purple-200 bg-purple-50/60',
      glow: 'group-hover:border-purple-400/50 group-hover:shadow-purple-100/80',
      desc: 'Average duration to close'
    },
    {
      title: 'SLA Compliance',
      value: `${summary.slaCompliance}%`,
      icon: Gauge,
      color: summary.slaCompliance >= 85 ? 'text-emerald-600 border-emerald-200 bg-emerald-50/60' : 'text-orange-600 border-orange-200 bg-orange-50/60',
      glow: summary.slaCompliance >= 85 ? 'group-hover:border-emerald-400/50 group-hover:shadow-emerald-100/80' : 'group-hover:border-orange-400/50 group-hover:shadow-orange-100/80',
      desc: 'Resolved within due date'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        
        return (
          <Card 
            key={idx} 
            className={`group bg-white border border-slate-200/80 transition-all duration-300 xl:col-span-3 hover:translate-y-[-2px] shadow-sm shadow-slate-100/60 hover:shadow-md ${card.glow}`}
          >
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{card.value}</h3>
                </div>
                <div className={`p-2.5 rounded-lg border ${card.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 group-hover:text-slate-500 transition-colors">
                {card.desc}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
