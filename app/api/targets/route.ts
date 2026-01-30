import { NextRequest, NextResponse } from 'next/server';
import { targets, getDailySummary, getSummariesForDateRange, profiles } from '@/lib/db';
import { requireAuth } from '@/lib/auth-api';

function getDefaults(userId: number) {
  const profile = profiles.getByUserId(userId);
  return {
    defaultCalories: profile?.target_calories ?? 2000,
    defaultProtein: profile?.target_protein ?? 150,
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.userId;
  const { defaultCalories, defaultProtein } = getDefaults(userId);

  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (date) {
      const target = targets.getOrCreate(userId, date, defaultCalories, defaultProtein);
      return NextResponse.json(target);
    }

    if (startDate && endDate) {
      const summaries = getSummariesForDateRange(userId, startDate, endDate, defaultCalories, defaultProtein);
      return NextResponse.json(summaries);
    }

    return NextResponse.json(
      { error: 'Either date or startDate and endDate are required' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch targets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.userId;
  const { defaultCalories, defaultProtein } = getDefaults(userId);

  try {
    const body = await request.json();
    const { date, target_calories, target_protein } = body;

    if (!date || target_calories === undefined || target_protein === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, target_calories, target_protein' },
        { status: 400 }
      );
    }

    const target = targets.set(
      userId,
      date,
      Number(target_calories),
      Number(target_protein)
    );

    const summary = getDailySummary(userId, date, defaultCalories, defaultProtein);

    return NextResponse.json({ target, summary });
  } catch (error: unknown) {
    console.error('Error setting target:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to set target' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
