"use client";

import React, { useState, useMemo } from 'react';
import { useFinanceStore, Transaction, RecurringBill } from '@/lib/financeStore';

export default function CalendarWidget() {
  const transactions = useFinanceStore(state => state.transactions);
  const recurringBills = useFinanceStore(state => state.recurringBills);
  const currency = useFinanceStore(state => state.currency);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Math for Calendar Grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map transactions to dates
  const txByDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number; list: Transaction[] }> = {};
    transactions.forEach(tx => {
      // Keep only YYYY-MM-DD
      const dateStr = tx.date.split('T')[0];
      if (!map[dateStr]) map[dateStr] = { income: 0, expense: 0, list: [] };
      map[dateStr].list.push(tx);
      const amt = parseFloat(tx.amount as any);
      if (tx.type === 'expense') map[dateStr].expense += amt;
      else if (tx.type === 'income' || tx.type === 'savings') map[dateStr].income += amt;
    });
    return map;
  }, [transactions]);

  // Project future recurring bills
  const billsByDate = useMemo(() => {
    const map: Record<string, RecurringBill[]> = {};
    recurringBills.forEach(bill => {
      if (!bill.is_active) return;
      // Simplistic recurring logic: just put it on the exact next due date for now
      const dateStr = bill.next_due_date.split('T')[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(bill);
    });
    return map;
  }, [recurringBills]);

  // Generate grid cells
  const cells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="h-24 bg-transparent border-b border-r border-slate-100 dark:border-slate-800"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    // Pad to YYYY-MM-DD
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayData = txByDate[dateStr];
    const dayBills = billsByDate[dateStr] || [];

    const isToday = new Date().toDateString() === dateObj.toDateString();
    const isSelected = selectedDate?.toDateString() === dateObj.toDateString();

    cells.push(
      <div 
        key={`day-${day}`}
        onClick={() => setSelectedDate(dateObj)}
        className={`h-24 p-2 flex flex-col border-b border-r border-slate-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 relative ${
          isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-inset ring-indigo-500' : ''
        }`}
      >
        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
          {day}
        </span>
        
        <div className="mt-1 flex-1 overflow-hidden flex flex-col gap-0.5">
          {dayData && dayData.income > 0 && (
            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate bg-emerald-50 dark:bg-emerald-900/30 px-1 py-0.5 rounded">
              +{dayData.income.toLocaleString()}
            </div>
          )}
          {dayData && dayData.expense > 0 && (
            <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 truncate bg-rose-50 dark:bg-rose-900/30 px-1 py-0.5 rounded">
              -{dayData.expense.toLocaleString()}
            </div>
          )}
          {dayBills.length > 0 && (
            <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 truncate bg-amber-50 dark:bg-amber-900/30 px-1 py-0.5 rounded">
              {dayBills.length} Bill{dayBills.length > 1 ? 's' : ''} Due
            </div>
          )}
        </div>
      </div>
    );
  }

  // Format currency
  const fmt = (amt: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amt);

  // Selected date details
  const selectedDateStr = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : null;
  const selectedData = selectedDateStr ? txByDate[selectedDateStr] : null;
  const selectedBills = selectedDateStr ? billsByDate[selectedDateStr] : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cash Flow Calendar</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your income, expenses, and upcoming bills.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 transition-colors">
            ←
          </button>
          <span className="font-semibold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 transition-colors">
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-l border-slate-100 dark:border-slate-800">
            {cells}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-6">
            {!selectedDate ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">📅</div>
                <p>Select a day to view details</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>

                {(!selectedData?.list.length && !selectedBills?.length) ? (
                  <p className="text-slate-500 text-sm text-center py-8">No activity on this date.</p>
                ) : (
                  <div className="space-y-6">
                    {/* Transactions */}
                    {selectedData && selectedData.list.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Transactions</h4>
                        <div className="space-y-3">
                          {selectedData.list.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-xl bg-white dark:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                                  {tx.category_emoji || '📄'}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{tx.category_name || 'Transfer'}</p>
                                  {tx.note && <p className="text-xs text-slate-500">{tx.note}</p>}
                                </div>
                              </div>
                              <span className={`text-sm font-bold ${tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {tx.type === 'expense' ? '-' : '+'}{fmt(parseFloat(tx.amount as any))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bills */}
                    {selectedBills && selectedBills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span>Upcoming Bills</span>
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">
                            {selectedBills.length}
                          </span>
                        </h4>
                        <div className="space-y-3">
                          {selectedBills.map(bill => (
                            <div key={bill.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">📅</span>
                                <div>
                                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{bill.name}</p>
                                  <p className="text-[10px] uppercase font-bold text-amber-600/70">{bill.frequency}</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                {fmt(parseFloat(bill.amount as any))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
