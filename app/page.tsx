'use client';

import { useEffect, useState } from 'react';
import { getTodayDate } from '@/lib/utils';
import DailySummary from '@/components/DailySummary';
import FoodEntryForm from '@/components/FoodEntryForm';
import EntryList from '@/components/EntryList';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

interface Entry {
  id: number;
  date: string;
  food_description: string;
  estimated_calories: number;
  estimated_protein: number;
  created_at: string;
}

interface Summary {
  date: string;
  total_calories: number;
  total_protein: number;
  target_calories: number;
  target_protein: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const today = getTodayDate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const summaryRes = await fetch(`/api/targets?date=${today}`, { credentials: 'include' });
      if (summaryRes.status === 401) {
        window.location.href = '/login';
        return;
      }
      const target = await summaryRes.json();

      const entriesRes = await fetch(`/api/entries?date=${today}`, { credentials: 'include' });
      if (entriesRes.status === 401) {
        window.location.href = '/login';
        return;
      }
      const dayEntries = await entriesRes.json();

      const total_calories = (Array.isArray(dayEntries) ? dayEntries : []).reduce((sum: number, e: Entry) => sum + e.estimated_calories, 0);
      const total_protein = (Array.isArray(dayEntries) ? dayEntries : []).reduce((sum: number, e: Entry) => sum + e.estimated_protein, 0);

      setSummary({
        date: today,
        total_calories,
        total_protein,
        target_calories: target.target_calories ?? 2000,
        target_protein: target.target_protein ?? 150,
      });
      setEntries(Array.isArray(dayEntries) ? dayEntries : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
      return;
    }
    if (status === 'authenticated') fetchData();
  }, [status]);

  const handleEntryAdded = () => {
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const response = await fetch(`/api/entries?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setEntries(entries.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }
  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Nutrition Tracker</h1>
            <div className="flex items-center gap-4">
              <Link href="/calendar" className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                Calendar
              </Link>
              {session?.user?.email && (
                <span className="text-sm text-gray-600">{session.user.email}</span>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Daily Summary */}
          {summary && (
            <DailySummary
              totalCalories={summary.total_calories}
              targetCalories={summary.target_calories}
              totalProtein={summary.total_protein}
              targetProtein={summary.target_protein}
            />
          )}

          {/* Food Entry Form */}
          <FoodEntryForm onEntryAdded={handleEntryAdded} date={today} />

          {/* Recent Entries */}
          <EntryList entries={entries} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}
