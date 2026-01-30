'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Light (1–3 days/week)' },
  { value: 'moderate', label: 'Moderate (3–5 days/week)' },
  { value: 'active', label: 'Active (6–7 days/week)' },
  { value: 'very_active', label: 'Very active (hard exercise & physical job)' },
];

export default function SignUpPage() {
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState<{ targetCalories: number; targetProtein: number } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') window.location.href = '/';
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTargets(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          weight_kg: Number(weightKg),
          height_cm: Number(heightCm),
          age: Number(age),
          gender,
          activity_level: activityLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign up failed');
        return;
      }
      setTargets({ targetCalories: data.targets.targetCalories, targetProtein: data.targets.targetProtein });
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold text-gray-900">Nutrition Tracker</h1>
        <h2 className="mt-2 text-center text-lg text-gray-600">Create your account</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password (min 6)</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  id="height"
                  type="number"
                  min="1"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700">Activity level</label>
              <select
                id="activity"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
              >
                {ACTIVITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
          {targets && (
            <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
              <p className="font-medium">Account created! Your estimated daily targets:</p>
              <p>Calories: {targets.targetCalories} kcal · Protein: {targets.targetProtein} g</p>
              <p className="mt-2">
                <Link href="/login" className="font-medium text-green-700 underline">
                  Sign in to start tracking
                </Link>
              </p>
            </div>
          )}
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
