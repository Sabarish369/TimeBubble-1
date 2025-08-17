
import { NextResponse } from 'next/server';
import type { PushSubscription } from 'web-push';

// In a real production app, you would store subscriptions in a database.
// For this example, we'll use an in-memory Map. This will reset on server restart.
const subscriptions = new Map<string, PushSubscription>();

export async function POST(request: Request) {
  try {
    const { id, subscription } = await request.json();

    if (!id || !subscription) {
      return NextResponse.json({ error: 'Bad request: Missing id or subscription.' }, { status: 400 });
    }

    // Store the subscription
    subscriptions.set(id, subscription);
    console.log(`Subscription saved for user: ${id}`);
    
    // You can now access the full list of subscriptions via this variable
    console.log('All subscriptions:', subscriptions);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
