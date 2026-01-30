import { NextRequest, NextResponse } from 'next/server';
import { entries, getDailySummary, profiles } from '@/lib/db';
import { requireAuth } from '@/lib/auth-api';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.userId;

  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (date) {
      const result = entries.getByDate(userId, date);
      return NextResponse.json(result);
    }

    if (startDate && endDate) {
      const result = entries.getByDateRange(userId, startDate, endDate);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Either date or startDate and endDate are required' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.userId;

  try {
    const body = await request.json();
    const { date, food_description, estimated_calories, estimated_protein } = body;

    if (!date || !food_description || estimated_calories === undefined || estimated_protein === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, food_description, estimated_calories, estimated_protein' },
        { status: 400 }
      );
    }

    const entry = entries.create({
      user_id: userId,
      date,
      food_description,
      estimated_calories: Number(estimated_calories),
      estimated_protein: Number(estimated_protein),
    });

    const profile = profiles.getByUserId(userId);
    const defCal = profile?.target_calories ?? 2000;
    const defPro = profile?.target_protein ?? 150;
    const summary = getDailySummary(userId, date, defCal, defPro);

    return NextResponse.json({ entry, summary });
  } catch (error: unknown) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const userId = authResult.userId;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const entry = entries.getById(Number(id));
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }
    if (entry.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = entries.delete(Number(id));
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete entry' },
        { status: 500 }
      );
    }

    const profile = profiles.getByUserId(userId);
    const defCal = profile?.target_calories ?? 2000;
    const defPro = profile?.target_protein ?? 150;
    const summary = getDailySummary(userId, entry.date, defCal, defPro);

    return NextResponse.json({ success: true, summary });
  } catch (error: unknown) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
