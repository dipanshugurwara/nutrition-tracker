import { NextRequest, NextResponse } from 'next/server';
import { entries, getDailySummary } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (date) {
      const result = entries.getByDate(date);
      return NextResponse.json(result);
    }

    if (startDate && endDate) {
      const result = entries.getByDateRange(startDate, endDate);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Either date or startDate and endDate are required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      date,
      food_description,
      estimated_calories: Number(estimated_calories),
      estimated_protein: Number(estimated_protein),
    });

    // Return the entry along with updated daily summary
    const summary = getDailySummary(date);

    return NextResponse.json({ entry, summary });
  } catch (error: any) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const deleted = entries.delete(Number(id));
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete entry' },
        { status: 500 }
      );
    }

    // Return updated daily summary
    const summary = getDailySummary(entry.date);

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
