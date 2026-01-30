import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { users, profiles } from '@/lib/db';
import { getCalculatedTargets } from '@/lib/calculate';
import type { Gender, ActivityLevel } from '@/lib/db';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      weight_kg,
      height_cm,
      age,
      gender,
      activity_level,
    } = body;

    if (!email || !password || weight_kg == null || height_cm == null || age == null || !gender || !activity_level) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, weight_kg, height_cm, age, gender, activity_level' },
        { status: 400 }
      );
    }

    const emailStr = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const w = Number(weight_kg);
    const h = Number(height_cm);
    const a = Number(age);
    if (w <= 0 || h <= 0 || a <= 0 || a > 120) {
      return NextResponse.json({ error: 'Invalid weight, height, or age' }, { status: 400 });
    }
    const g = gender as Gender;
    const act = activity_level as ActivityLevel;
    if (!['male', 'female'].includes(g) || !['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(act)) {
      return NextResponse.json({ error: 'Invalid gender or activity_level' }, { status: 400 });
    }

    if (users.getByEmail(emailStr)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const user = users.create(emailStr, passwordHash);

    const { targetCalories, targetProtein } = getCalculatedTargets(w, h, a, g, act);
    profiles.upsert({
      user_id: user.id,
      weight_kg: w,
      height_cm: h,
      age: a,
      gender: g,
      activity_level: act,
      target_calories: targetCalories,
      target_protein: targetProtein,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      targets: { targetCalories, targetProtein },
    });
  } catch (e: any) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: e.message || 'Sign up failed' }, { status: 500 });
  }
}
