'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DailySummary from '@/components/DailySummary';
import EntryList from '@/components/EntryList';
import { formatDateDisplay } from '@/lib/utils';

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

export default function DayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetProtein, setTargetProtein] = useState(150);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch target
      const targetRes = await fetch(`/api/targets?date=${date}`);
      const target = await targetRes.json();
      setTargetCalories(target.target_calories);
      setTargetProtein(target.target_protein);
      
      // Fetch entries
      const entriesRes = await fetch(`/api/entries?date=${date}`);
      const dayEntries = await entriesRes.json();
      
      // Calculate totals
      const total_calories = dayEntries.reduce((sum: number, e: Entry) => sum + e.estimated_calories, 0);
      const total_protein = dayEntries.reduce((sum: number, e: Entry) => sum + e.estimated_protein, 0);
      
      setSummary({
        date,
        total_calories,
        total_protein,
        target_calories: target.target_calories,
        target_protein: target.target_protein,
      });
      
      setEntries(dayEntries);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const response = await fetch(`/api/entries?id=${id}`, {
        method: 'DELETE',
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

  const handleSaveTarget = async () => {
    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          target_calories: targetCalories,
          target_protein: targetProtein,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setEditingTarget(false);
      }
    } catch (error) {
      console.error('Error saving target:', error);
      alert('Failed to save target');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Nutrition Tracker</h1>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/calendar"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Calendar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Date Header */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {formatDateDisplay(date)}
            </h2>
          </div>

          {/* Daily Summary */}
          {summary && (
            <DailySummary
              totalCalories={summary.total_calories}
              targetCalories={summary.target_calories}
              totalProtein={summary.total_protein}
              targetProtein={summary.target_protein}
            />
          )}

          {/* Target Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Daily Targets</h3>
              {!editingTarget ? (
                <button
                  onClick={() => setEditingTarget(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Edit Targets
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingTarget(false);
                      setTargetCalories(summary?.target_calories || 2000);
                      setTargetProtein(summary?.target_protein || 150);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTarget}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {editingTarget ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Calories
                  </label>
                  <input
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetProtein}
                    onChange={(e) => setTargetProtein(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <span className="font-medium">Target Calories: </span>
                  <span>{Math.round(summary?.target_calories || 2000)}</span>
                </div>
                <div>
                  <span className="font-medium">Target Protein: </span>
                  <span>{(summary?.target_protein || 150).toFixed(1)}g</span>
                </div>
              </div>
            )}
          </div>

          {/* Entries List */}
          <EntryList entries={entries} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}
