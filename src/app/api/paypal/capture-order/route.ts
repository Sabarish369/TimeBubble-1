import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Paid checkout is disabled. All features are available for free.' },
    { status: 410 },
  );
}
