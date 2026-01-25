'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDaysInMonth, getFirstDayOfMonth, getCombinedStatusColor } from '@/lib/utils';

interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  target_calories: number;
  target_protein: number;
}

interface CalendarProps {
  summaries: DailySummary[];
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

export default function Calendar({ summaries, currentMonth, onMonthChange }: CalendarProps) {
  const [internalDate, setInternalDate] = useState(new Date());
  const currentDate = currentMonth || internalDate;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const summariesMap = new Map(summaries.map(s => [s.date, s]));

  const getSummaryForDate = (day: number): DailySummary | null => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    return summariesMap.get(dateStr) || null;
  };

  const getDayColor = (day: number): string => {
    const summary = getSummaryForDate(day);
    if (!summary) return 'bg-white hover:bg-gray-50';

    const status = getCombinedStatusColor(
      summary.total_calories,
      summary.target_calories,
      summary.total_protein,
      summary.target_protein
    );

    switch (status) {
      case 'green':
        return 'bg-green-100 hover:bg-green-200 border-green-300';
      case 'yellow':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
      case 'red':
        return 'bg-red-100 hover:bg-red-200 border-red-300';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const days = [];
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
        >
          ← Prev
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-20" />;
          }

          const summary = getSummaryForDate(day);
          const dateStr = new Date(year, month, day).toISOString().split('T')[0];
          const colorClass = getDayColor(day);

          return (
            <Link
              key={day}
              href={`/day/${dateStr}`}
              className={`h-20 border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-colors ${colorClass} ${
                isToday(day) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <span className={`font-semibold ${isToday(day) ? 'text-blue-600' : 'text-gray-800'}`}>
                {day}
              </span>
              {summary && (
                <div className="text-xs mt-1 text-center">
                  <div className="font-medium">{Math.round(summary.total_calories)} cal</div>
                  <div className="text-gray-600">{summary.total_protein.toFixed(0)}g</div>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>On target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>One over</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Both over</span>
        </div>
      </div>
    </div>
  );
}
