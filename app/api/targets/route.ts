import { NextRequest, NextResponse } from 'next/server';
import { targets, getDailySummary, getSummariesForDateRange } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (date) {
      const target = targets.getOrCreate(date);
      return NextResponse.json(target);
    }
    if (startDate && endDate) {
      const summaries = getSummariesForDateRange(startDate, endDate);
      return NextResponse.json(summaries);
    }
    return NextResponse.json({ error: 'Either date or startDate and endDate are required' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error fetching targets:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, target_calories, target_protein } = body;

    if (!date || target_calories === undefined || target_protein === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, target_calories, target_protein' },
        { status: 400 }
      );
    }

    const target = targets.set(date, Number(target_calories), Number(target_protein));
    const summary = getDailySummary(date);
    return NextResponse.json({ target, summary });
  } catch (error: unknown) {
    console.error('Error setting target:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to set target' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
