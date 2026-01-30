'use client';

import { useState } from 'react';

interface FoodEntryFormProps {
  onEntryAdded: () => void;
  date: string;
}

export default function FoodEntryForm({ onEntryAdded, date }: FoodEntryFormProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimated, setEstimated] = useState<{ calories: number; protein: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (!description.trim()) {
      setError('Please enter a food description');
      return;
    }

    setLoading(true);
    setError(null);
    setEstimated(null);

    try {
      const response = await fetch('/api/estimate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to estimate nutrition');
      }

      const data = await response.json();
      setEstimated({ calories: data.calories, protein: data.protein });
    } catch (err: any) {
      setError(err.message || 'Failed to estimate nutrition');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!estimated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date,
          food_description: description,
          estimated_calories: estimated.calories,
          estimated_protein: estimated.protein,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save entry');
      }

      // Reset form
      setDescription('');
      setEstimated(null);
      onEntryAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = (type: 'calories' | 'protein', delta: number) => {
    if (!estimated) return;
    setEstimated({
      ...estimated,
      [type]: Math.max(0, estimated[type] + delta),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Add Food Entry</h2>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          What did you eat?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Grilled chicken breast with rice and vegetables"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder:text-gray-500"
          rows={3}
          disabled={loading}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!estimated ? (
        <button
          onClick={handleEstimate}
          disabled={loading || !description.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Estimating...' : 'Estimate Calories & Protein'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Estimated Nutrition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Calories</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={estimated.calories}
                    onChange={(e) => setEstimated({ ...estimated, calories: Math.max(0, Number(e.target.value)) })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  <button
                    onClick={() => handleAdjust('calories', -10)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleAdjust('calories', 10)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Protein (g)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={estimated.protein}
                    onChange={(e) => setEstimated({ ...estimated, protein: Math.max(0, Number(e.target.value)) })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  <button
                    onClick={() => handleAdjust('protein', -5)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjust('protein', 5)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEstimated(null);
                setError(null);
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
