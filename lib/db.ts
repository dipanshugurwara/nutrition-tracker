import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// For Vercel/serverless: use /tmp, for local: use data directory
const dbPath = process.env.DATABASE_PATH || 
  (process.env.VERCEL 
    ? '/tmp/nutrition.db' 
    : path.join(process.cwd(), 'data', 'nutrition.db'));

// Ensure data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  // Create nutrition_entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nutrition_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      food_description TEXT NOT NULL,
      estimated_calories REAL NOT NULL,
      estimated_protein REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create daily_targets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      target_calories REAL NOT NULL DEFAULT 2000,
      target_protein REAL NOT NULL DEFAULT 150,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entries_date ON nutrition_entries(date);
    CREATE INDEX IF NOT EXISTS idx_targets_date ON daily_targets(date);
  `);
}

// Initialize on import
initDatabase();

// Types
export interface NutritionEntry {
  id: number;
  date: string;
  food_description: string;
  estimated_calories: number;
  estimated_protein: number;
  created_at: string;
}

export interface DailyTarget {
  id: number;
  date: string;
  target_calories: number;
  target_protein: number;
  updated_at: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  target_calories: number;
  target_protein: number;
}

// Entry CRUD operations
export const entries = {
  // Get all entries for a specific date
  getByDate(date: string): NutritionEntry[] {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE date = ? ORDER BY created_at DESC');
    return stmt.all(date) as NutritionEntry[];
  },

  // Get entries for a date range
  getByDateRange(startDate: string, endDate: string): NutritionEntry[] {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC');
    return stmt.all(startDate, endDate) as NutritionEntry[];
  },

  // Create a new entry
  create(entry: Omit<NutritionEntry, 'id' | 'created_at'>): NutritionEntry {
    const stmt = db.prepare(`
      INSERT INTO nutrition_entries (date, food_description, estimated_calories, estimated_protein)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      entry.date,
      entry.food_description,
      entry.estimated_calories,
      entry.estimated_protein
    );
    return this.getById(result.lastInsertRowid as number)!;
  },

  // Get entry by ID
  getById(id: number): NutritionEntry | null {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE id = ?');
    return (stmt.get(id) as NutritionEntry) || null;
  },

  // Update an entry
  update(id: number, updates: Partial<Pick<NutritionEntry, 'food_description' | 'estimated_calories' | 'estimated_protein'>>): NutritionEntry | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.food_description !== undefined) {
      fields.push('food_description = ?');
      values.push(updates.food_description);
    }
    if (updates.estimated_calories !== undefined) {
      fields.push('estimated_calories = ?');
      values.push(updates.estimated_calories);
    }
    if (updates.estimated_protein !== undefined) {
      fields.push('estimated_protein = ?');
      values.push(updates.estimated_protein);
    }

    if (fields.length === 0) return existing;

    values.push(id);
    const stmt = db.prepare(`UPDATE nutrition_entries SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  // Delete an entry
  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM nutrition_entries WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
};

// Target CRUD operations
export const targets = {
  // Get target for a specific date
  getByDate(date: string): DailyTarget | null {
    const stmt = db.prepare('SELECT * FROM daily_targets WHERE date = ?');
    return (stmt.get(date) as DailyTarget) || null;
  },

  // Get or create target for a date (returns default if not set)
  getOrCreate(date: string): DailyTarget {
    let target = this.getByDate(date);
    if (!target) {
      target = this.set(date, 2000, 150);
    }
    return target;
  },

  // Set target for a date
  set(date: string, target_calories: number, target_protein: number): DailyTarget {
    const stmt = db.prepare(`
      INSERT INTO daily_targets (date, target_calories, target_protein, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(date) DO UPDATE SET
        target_calories = excluded.target_calories,
        target_protein = excluded.target_protein,
        updated_at = datetime('now')
    `);
    stmt.run(date, target_calories, target_protein);
    return this.getByDate(date)!;
  },

  // Get targets for a date range
  getByDateRange(startDate: string, endDate: string): DailyTarget[] {
    const stmt = db.prepare('SELECT * FROM daily_targets WHERE date >= ? AND date <= ? ORDER BY date');
    return stmt.all(startDate, endDate) as DailyTarget[];
  },
};

// Get daily summary (totals + targets)
export function getDailySummary(date: string): DailySummary {
  const target = targets.getOrCreate(date);
  const dayEntries = entries.getByDate(date);

  const total_calories = dayEntries.reduce((sum, entry) => sum + entry.estimated_calories, 0);
  const total_protein = dayEntries.reduce((sum, entry) => sum + entry.estimated_protein, 0);

  return {
    date,
    total_calories,
    total_protein,
    target_calories: target.target_calories,
    target_protein: target.target_protein,
  };
}

// Get summaries for a date range (for calendar view)
export function getSummariesForDateRange(startDate: string, endDate: string): DailySummary[] {
  const dateTargets = targets.getByDateRange(startDate, endDate);
  const dateEntries = entries.getByDateRange(startDate, endDate);

  // Group entries by date
  const entriesByDate = new Map<string, NutritionEntry[]>();
  for (const entry of dateEntries) {
    if (!entriesByDate.has(entry.date)) {
      entriesByDate.set(entry.date, []);
    }
    entriesByDate.get(entry.date)!.push(entry);
  }

  // Create summaries
  const summaries: DailySummary[] = [];
  const dateSet = new Set<string>();

  // Add dates from entries
  for (const date of entriesByDate.keys()) {
    dateSet.add(date);
  }

  // Add dates from targets
  for (const target of dateTargets) {
    dateSet.add(target.date);
  }

  for (const date of dateSet) {
    const target = targets.getOrCreate(date);
    const dayEntries = entriesByDate.get(date) || [];

    const total_calories = dayEntries.reduce((sum, entry) => sum + entry.estimated_calories, 0);
    const total_protein = dayEntries.reduce((sum, entry) => sum + entry.estimated_protein, 0);

    summaries.push({
      date,
      total_calories,
      total_protein,
      target_calories: target.target_calories,
      target_protein: target.target_protein,
    });
  }

  return summaries.sort((a, b) => a.date.localeCompare(b.date));
}

export default db;
