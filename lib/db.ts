import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH ||
  (process.env.VERCEL
    ? '/tmp/nutrition.db'
    : path.join(process.cwd(), 'data', 'nutrition.db'));

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

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

const SCHEMA_VERSION = 3;

export function initDatabase() {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (key TEXT PRIMARY KEY, value INTEGER)`);
  const row = db.prepare("SELECT value FROM schema_version WHERE key = 'version'").get() as { value: number } | undefined;
  const version = row?.value ?? 0;

  if (version < SCHEMA_VERSION) {
    db.pragma('foreign_keys = OFF');
    db.exec(`DROP TABLE IF EXISTS nutrition_entries`);
    db.exec(`DROP TABLE IF EXISTS daily_targets`);
    db.exec(`DROP TABLE IF EXISTS user_profiles`);
    db.exec(`DROP TABLE IF EXISTS users`);
    db.pragma('foreign_keys = ON');
    db.exec(`INSERT OR REPLACE INTO schema_version (key, value) VALUES ('version', ${SCHEMA_VERSION})`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS nutrition_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      food_description TEXT NOT NULL,
      estimated_calories REAL NOT NULL,
      estimated_protein REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS daily_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      target_calories REAL NOT NULL DEFAULT 2000,
      target_protein REAL NOT NULL DEFAULT 150,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_entries_date ON nutrition_entries(date);
    CREATE INDEX IF NOT EXISTS idx_targets_date ON daily_targets(date);
  `);
}

initDatabase();

export const entries = {
  getByDate(date: string): NutritionEntry[] {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE date = ? ORDER BY created_at DESC');
    return stmt.all(date) as NutritionEntry[];
  },
  getByDateRange(startDate: string, endDate: string): NutritionEntry[] {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC');
    return stmt.all(startDate, endDate) as NutritionEntry[];
  },
  create(entry: Omit<NutritionEntry, 'id' | 'created_at'>): NutritionEntry {
    const stmt = db.prepare(`
      INSERT INTO nutrition_entries (date, food_description, estimated_calories, estimated_protein)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(entry.date, entry.food_description, entry.estimated_calories, entry.estimated_protein);
    return entries.getById(result.lastInsertRowid as number)!;
  },
  getById(id: number): NutritionEntry | null {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE id = ?');
    return (stmt.get(id) as NutritionEntry) || null;
  },
  update(id: number, updates: Partial<Pick<NutritionEntry, 'food_description' | 'estimated_calories' | 'estimated_protein'>>): NutritionEntry | null {
    const existing = entries.getById(id);
    if (!existing) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    if (updates.food_description !== undefined) { fields.push('food_description = ?'); values.push(updates.food_description); }
    if (updates.estimated_calories !== undefined) { fields.push('estimated_calories = ?'); values.push(updates.estimated_calories); }
    if (updates.estimated_protein !== undefined) { fields.push('estimated_protein = ?'); values.push(updates.estimated_protein); }
    if (fields.length === 0) return existing;
    values.push(id);
    const stmt = db.prepare(`UPDATE nutrition_entries SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return entries.getById(id);
  },
  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM nutrition_entries WHERE id = ?');
    return stmt.run(id).changes > 0;
  },
};

export const targets = {
  getByDate(date: string): DailyTarget | null {
    const stmt = db.prepare('SELECT * FROM daily_targets WHERE date = ?');
    return (stmt.get(date) as DailyTarget) || null;
  },
  getOrCreate(date: string): DailyTarget {
    let t = targets.getByDate(date);
    if (!t) t = targets.set(date, 2000, 150);
    return t;
  },
  set(date: string, target_calories: number, target_protein: number): DailyTarget {
    const stmt = db.prepare(`
      INSERT INTO daily_targets (date, target_calories, target_protein, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(date) DO UPDATE SET target_calories = excluded.target_calories, target_protein = excluded.target_protein, updated_at = datetime('now')
    `);
    stmt.run(date, target_calories, target_protein);
    return targets.getByDate(date)!;
  },
  getByDateRange(startDate: string, endDate: string): DailyTarget[] {
    const stmt = db.prepare('SELECT * FROM daily_targets WHERE date >= ? AND date <= ? ORDER BY date');
    return stmt.all(startDate, endDate) as DailyTarget[];
  },
};

export function getDailySummary(date: string): DailySummary {
  const target = targets.getOrCreate(date);
  const dayEntries = entries.getByDate(date);
  const total_calories = dayEntries.reduce((s, e) => s + e.estimated_calories, 0);
  const total_protein = dayEntries.reduce((s, e) => s + e.estimated_protein, 0);
  return { date, total_calories, total_protein, target_calories: target.target_calories, target_protein: target.target_protein };
}

export function getSummariesForDateRange(startDate: string, endDate: string): DailySummary[] {
  const dateTargets = targets.getByDateRange(startDate, endDate);
  const dateEntries = entries.getByDateRange(startDate, endDate);
  const entriesByDate = new Map<string, NutritionEntry[]>();
  for (const e of dateEntries) {
    if (!entriesByDate.has(e.date)) entriesByDate.set(e.date, []);
    entriesByDate.get(e.date)!.push(e);
  }
  const dateSet = new Set<string>();
  for (const d of entriesByDate.keys()) dateSet.add(d);
  for (const t of dateTargets) dateSet.add(t.date);
  const summaries: DailySummary[] = [];
  for (const date of dateSet) {
    const target = targets.getOrCreate(date);
    const dayEntries = entriesByDate.get(date) || [];
    summaries.push({
      date,
      total_calories: dayEntries.reduce((s, e) => s + e.estimated_calories, 0),
      total_protein: dayEntries.reduce((s, e) => s + e.estimated_protein, 0),
      target_calories: target.target_calories,
      target_protein: target.target_protein,
    });
  }
  return summaries.sort((a, b) => a.date.localeCompare(b.date));
}

export default db;
