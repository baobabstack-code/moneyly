import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Transaction, Category } from '@/lib/financeStore';

interface AnalyticsWidgetProps {
  transactions: Transaction[];
  categories: Category[];
  accentColor?: string;
}

export default function AnalyticsWidget({ transactions, categories, accentColor = 'green' }: AnalyticsWidgetProps) {
  // 1. Prepare data for Area Chart (Spending over the last 30 days)
  const areaData = useMemo(() => {
    const dataMap = new Map<string, number>();
    const today = new Date();
    
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap.set(dateStr, 0);
    }

    // Accumulate expenses
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const dateStr = tx.date.split('T')[0];
        if (dataMap.has(dateStr)) {
          dataMap.set(dateStr, dataMap.get(dateStr)! + Number(tx.amount));
        }
      }
    });

    return Array.from(dataMap.entries()).map(([date, amount]) => {
      const d = new Date(date);
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        amount
      };
    });
  }, [transactions]);

  // 2. Prepare data for Doughnut Chart (Spending by Category)
  const pieData = useMemo(() => {
    const catMap = new Map<number, { name: string, value: number, color: string }>();
    
    transactions.forEach(tx => {
      if (tx.type === 'expense' && tx.category_id) {
        const existing = catMap.get(tx.category_id);
        if (existing) {
          existing.value += Number(tx.amount);
        } else {
          const cat = categories.find(c => c.id === tx.category_id);
          catMap.set(tx.category_id, {
            name: cat ? `${cat.emoji} ${cat.name}` : tx.category_name || 'Other',
            value: Number(tx.amount),
            color: cat?.color || '#8884d8'
          });
        }
      }
    });

    return Array.from(catMap.values()).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Map theme accent color to hex
  const themeColors: Record<string, string> = {
    green: '#10b981',
    purple: '#9333ea',
    blue: '#2563eb',
    orange: '#d97706',
    red: '#e11d48'
  };
  const strokeColor = themeColors[accentColor] || themeColors.green;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Area Chart: 30-Day Trend */}
      <div className="bg-surface p-5 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col h-[350px]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">trending_up</span>
          30-Day Spending Trend
        </h3>
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-outline-variant/30" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'currentColor' }} 
                className="text-on-surface-variant"
                minTickGap={20}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'currentColor' }} 
                className="text-on-surface-variant"
                tickFormatter={(value) => `$${value}`}
              />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: strokeColor, fontWeight: 'bold' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spent']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke={strokeColor} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doughnut Chart: Top Categories */}
      <div className="bg-surface p-5 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col h-[350px]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">pie_chart</span>
          Top Expenses by Category
        </h3>
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spent']}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-on-surface-variant/50">
              <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
              <p className="text-sm">No expenses to categorize yet.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
