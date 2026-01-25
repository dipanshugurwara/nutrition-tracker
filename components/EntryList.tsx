'use client';

interface Entry {
  id: number;
  date: string;
  food_description: string;
  estimated_calories: number;
  estimated_protein: number;
  created_at: string;
}

interface EntryListProps {
  entries: Entry[];
  onDelete?: (id: number) => void;
}

export default function EntryList({ entries, onDelete }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No entries yet. Add your first meal above!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Recent Entries</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {entries.map((entry) => (
          <div key={entry.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{entry.food_description}</p>
                <div className="mt-2 flex gap-4 text-sm text-gray-600">
                  <span className="font-medium">{Math.round(entry.estimated_calories)} cal</span>
                  <span className="font-medium">{entry.estimated_protein.toFixed(1)}g protein</span>
                </div>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(entry.id)}
                  className="ml-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
