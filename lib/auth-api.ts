import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { userId: Number(session.user.id) };
}
