import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// For Vercel/serverless: use /tmp, for local: use data directory
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

// Types
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Gender = 'male' | 'female';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface UserProfile {
  user_id: number;
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
  target_calories: number;
  target_protein: number;
  created_at: string;
  updated_at: string;
}

export interface NutritionEntry {
  id: number;
  user_id: number;
  date: string;
  food_description: string;
  estimated_calories: number;
  estimated_protein: number;
  created_at: string;
}

export interface DailyTarget {
  id: number;
  user_id: number;
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

const SCHEMA_VERSION = 2;

export function initDatabase() {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (key TEXT PRIMARY KEY, value INTEGER)`);
  const row = db.prepare("SELECT value FROM schema_version WHERE key = 'version'").get() as { value: number } | undefined;
  const version = row?.value ?? 0;

  if (version < SCHEMA_VERSION) {
    db.pragma('foreign_keys = OFF');
    db.exec(`DROP TABLE IF EXISTS nutrition_entries`);
    db.exec(`DROP TABLE IF EXISTS daily_targets`);
    db.pragma('foreign_keys = ON');
    db.exec(`INSERT OR REPLACE INTO schema_version (key, value) VALUES ('version', ${SCHEMA_VERSION})`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      weight_kg REAL NOT NULL,
      height_cm REAL NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
      activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
      target_calories REAL NOT NULL,
      target_protein REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS nutrition_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      food_description TEXT NOT NULL,
      estimated_calories REAL NOT NULL,
      estimated_protein REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS daily_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      target_calories REAL NOT NULL,
      target_protein REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_entries_user_date ON nutrition_entries(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_targets_user_date ON daily_targets(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
}

initDatabase();

// Users
export const users = {
  getByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return (stmt.get(email) as User) || null;
  },
  getById(id: number): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return (stmt.get(id) as User) || null;
  },
  create(email: string, passwordHash: string): User {
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(email, passwordHash);
    return users.getById(result.lastInsertRowid as number)!;
  },
};

// User profiles
export const profiles = {
  getByUserId(userId: number): UserProfile | null {
    const stmt = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?');
    return (stmt.get(userId) as UserProfile) || null;
  },
  upsert(profile: Omit<UserProfile, 'created_at' | 'updated_at'>): UserProfile {
    const stmt = db.prepare(`
      INSERT INTO user_profiles (user_id, weight_kg, height_cm, age, gender, activity_level, target_calories, target_protein, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        weight_kg = excluded.weight_kg,
        height_cm = excluded.height_cm,
        age = excluded.age,
        gender = excluded.gender,
        activity_level = excluded.activity_level,
        target_calories = excluded.target_calories,
        target_protein = excluded.target_protein,
        updated_at = datetime('now')
    `);
    stmt.run(
      profile.user_id,
      profile.weight_kg,
      profile.height_cm,
      profile.age,
      profile.gender,
      profile.activity_level,
      profile.target_calories,
      profile.target_protein
    );
    return profiles.getByUserId(profile.user_id)!;
  },
};

// Entries (user-scoped)
export const entries = {
  getByDate(userId: number, date: string): NutritionEntry[] {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE user_id = ? AND date = ? ORDER BY created_at DESC');
    return stmt.all(userId, date) as NutritionEntry[];
  },
  getByDateRange(userId: number, startDate: string, endDate: string): NutritionEntry[] {
    const stmt = db.prepare('SELECT * FROM nutrition_entries WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC');
    return stmt.all(userId, startDate, endDate) as NutritionEntry[];
  },
  create(entry: Omit<NutritionEntry, 'id' | 'created_at'>): NutritionEntry {
    const stmt = db.prepare(`
      INSERT INTO nutrition_entries (user_id, date, food_description, estimated_calories, estimated_protein)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      entry.user_id,
      entry.date,
      entry.food_description,
      entry.estimated_calories,
      entry.estimated_protein
    );
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
    return entries.getById(id);
  },
  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM nutrition_entries WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
};

// Targets (user-scoped)
export const targets = {
  getByDate(userId: number, date: string): DailyTarget | null {
    const stmt = db.prepare('SELECT * FROM daily_targets WHERE user_id = ? AND date = ?');
    return (stmt.get(userId, date) as DailyTarget) || null;
  },
  getOrCreate(userId: number, date: string, defaultCalories: number, defaultProtein: number): DailyTarget {
    let t = targets.getByDate(userId, date);
    if (!t) {
      t = targets.set(userId, date, defaultCalories, defaultProtein);
    }
    return t;
  },
  set(userId: number, date: string, target_calories: number, target_protein: number): DailyTarget {
    const stmt = db.prepare(`
      INSERT INTO daily_targets (user_id, date, target_calories, target_protein, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, date) DO UPDATE SET
        target_calories = excluded.target_calories,
        target_protein = excluded.target_protein,
        updated_at = datetime('now')
    `);
    stmt.run(userId, date, target_calories, target_protein);
    return targets.getByDate(userId, date)!;
  },
  getByDateRange(userId: number, startDate: string, endDate: string): DailyTarget[] {
    const stmt = db.prepare('SELECT * FROM daily_targets WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date');
    return stmt.all(userId, startDate, endDate) as DailyTarget[];
  },
};

export function getDailySummary(
  userId: number,
  date: string,
  defaultCalories: number,
  defaultProtein: number
): DailySummary {
  const target = targets.getOrCreate(userId, date, defaultCalories, defaultProtein);
  const dayEntries = entries.getByDate(userId, date);
  const total_calories = dayEntries.reduce((s, e) => s + e.estimated_calories, 0);
  const total_protein = dayEntries.reduce((s, e) => s + e.estimated_protein, 0);
  return {
    date,
    total_calories,
    total_protein,
    target_calories: target.target_calories,
    target_protein: target.target_protein,
  };
}

export function getSummariesForDateRange(
  userId: number,
  startDate: string,
  endDate: string,
  defaultCalories: number,
  defaultProtein: number
): DailySummary[] {
  const dateTargets = targets.getByDateRange(userId, startDate, endDate);
  const dateEntries = entries.getByDateRange(userId, startDate, endDate);
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
    const target = targets.getOrCreate(userId, date, defaultCalories, defaultProtein);
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
