"use client";

import React, { useMemo } from 'react';
import { useFinanceStore } from '@/lib/financeStore';

const ALL_BADGES = [
  { id: 'first_tx', name: 'First Step', description: 'Logged your very first transaction', icon: '🌱' },
  { id: 'tx_10', name: 'Getting Serious', description: 'Logged 10 transactions', icon: '🏃' },
  { id: 'tx_50', name: 'Money Master', description: 'Logged 50 transactions', icon: '👑' },
  { id: 'streak_3', name: 'On Fire', description: '3-day logging streak', icon: '🔥' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day logging streak', icon: '⚔️' },
  { id: 'streak_30', name: 'Unstoppable', description: '30-day logging streak', icon: '🚀' },
  { id: 'big_saver', name: 'Big Saver', description: 'Saved $100 or more at once', icon: '💰' },
];

export default function AchievementsWidget() {
  const currentStreak = useFinanceStore(state => state.currentStreak);
  const longestStreak = useFinanceStore(state => state.longestStreak);
  const badges = useFinanceStore(state => state.badges);

  const unlockedBadgeIds = useMemo(() => new Set(badges.map(b => b.id)), [badges]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Streak Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-secondary/20 bg-gradient-to-br from-surface to-secondary/10 p-6 shadow-xl">
        <div className="absolute -right-4 -top-4 text-9xl opacity-10">🔥</div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-secondary">Current Streak</h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-black text-primary">{currentStreak}</span>
              <span className="text-lg font-bold text-on-surface-variant">days</span>
            </div>
            <p className="mt-2 text-xs font-medium text-on-surface-variant">
              Longest streak: <span className="font-black text-primary">{longestStreak} days</span>
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 shadow-inner">
            <span className={`text-4xl transition-all duration-300 ${currentStreak > 0 ? 'scale-110 drop-shadow-md' : 'grayscale opacity-50'}`}>
              🔥
            </span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">military_tech</span>
          Your Badges
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ALL_BADGES.map((badgeDef) => {
            const isUnlocked = unlockedBadgeIds.has(badgeDef.id);
            const unlockedData = badges.find(b => b.id === badgeDef.id);

            return (
              <div 
                key={badgeDef.id}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300 ${
                  isUnlocked 
                    ? 'border-secondary/40 bg-secondary/5 shadow-md hover:scale-105' 
                    : 'border-outline-variant/30 bg-surface-container-lowest grayscale hover:bg-surface-container-low opacity-60'
                }`}
              >
                <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-inner ${isUnlocked ? 'bg-secondary/20 drop-shadow-lg' : 'bg-surface-container-high'}`}>
                  {badgeDef.icon}
                </div>
                <h4 className={`text-xs font-black ${isUnlocked ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {badgeDef.name}
                </h4>
                <p className="mt-1 text-[10px] text-on-surface-variant leading-tight">
                  {badgeDef.description}
                </p>
                {isUnlocked && unlockedData?.unlocked_at && (
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-md">
                    <span className="material-symbols-outlined text-sm font-black">check</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
