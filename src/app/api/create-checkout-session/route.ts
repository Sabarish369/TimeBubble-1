import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Paid plans are no longer available. All features are free.' },
    { status: 410 },
  );
}
