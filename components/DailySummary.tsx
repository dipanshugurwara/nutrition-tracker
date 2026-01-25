'use client';

import { getStatusColor } from '@/lib/utils';

interface DailySummaryProps {
  totalCalories: number;
  targetCalories: number;
  totalProtein: number;
  targetProtein: number;
}

export default function DailySummary({
  totalCalories,
  targetCalories,
  totalProtein,
  targetProtein,
}: DailySummaryProps) {
  const caloriesPercentage = Math.min(100, (totalCalories / targetCalories) * 100);
  const proteinPercentage = Math.min(100, (totalProtein / targetProtein) * 100);
  
  const caloriesStatus = getStatusColor(totalCalories, targetCalories, 'calories');
  const proteinStatus = getStatusColor(totalProtein, targetProtein, 'protein');

  const getStatusColorClass = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
    }
  };

  const getTextColorClass = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return 'text-green-700';
      case 'yellow':
        return 'text-yellow-700';
      case 'red':
        return 'text-red-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Calories Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Calories</h3>
          <span className={`text-2xl font-bold ${getTextColorClass(caloriesStatus)}`}>
            {Math.round(totalCalories)} / {Math.round(targetCalories)}
          </span>
        </div>
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getStatusColorClass(caloriesStatus)}`}
              style={{ width: `${caloriesPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {totalCalories < targetCalories
              ? `${Math.round(targetCalories - totalCalories)} remaining`
              : `${Math.round(totalCalories - targetCalories)} over`}
          </span>
          <span>{Math.round(caloriesPercentage)}%</span>
        </div>
      </div>

      {/* Protein Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Protein</h3>
          <span className={`text-2xl font-bold ${getTextColorClass(proteinStatus)}`}>
            {totalProtein.toFixed(1)}g / {targetProtein.toFixed(1)}g
          </span>
        </div>
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getStatusColorClass(proteinStatus)}`}
              style={{ width: `${proteinPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {totalProtein < targetProtein
              ? `${(targetProtein - totalProtein).toFixed(1)}g remaining`
              : `${(totalProtein - targetProtein).toFixed(1)}g over`}
          </span>
          <span>{Math.round(proteinPercentage)}%</span>
        </div>
      </div>
    </div>
  );
}
