import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { profiles } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const profile = profiles.getByUserId(userId);
  return NextResponse.json({
    user: { id: session.user.id, email: session.user.email },
    profile: profile
      ? {
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          age: profile.age,
          gender: profile.gender,
          activity_level: profile.activity_level,
          target_calories: profile.target_calories,
          target_protein: profile.target_protein,
        }
      : null,
  });
}
