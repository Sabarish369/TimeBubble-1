
// This is an example route to demonstrate sending a notification.
// In your actual app, you would trigger this from your application logic,
// for example, when a user's time bubble is about to start.

import { NextResponse } from 'next/server';
import webPush, { type PushSubscription } from 'web-push';

// This would be your database or cache in a real app
const subscriptions = new Map<string, PushSubscription>();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webPush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID keys not configured. Push notifications will not work.");
}


export async function POST(request: Request) {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return NextResponse.json({ error: 'VAPID keys not configured on the server.' }, { status: 500 });
    }
  
    try {
        const { id, title = 'TimeBubble', body = 'Reminder incoming!', url = '/' } = await request.json();

        // This is where you would retrieve the subscription from your database
        // For this example, we're using the in-memory map from the save-subscription route.
        // NOTE: This will not work across server restarts. You need a persistent database.
        const sub = subscriptions.get(id); 

        if (!sub) {
            console.log("All subscriptions on send:", subscriptions);
            return NextResponse.json({ error: `No subscription found for user ${id}. Stored subscriptions: ${subscriptions.size}` }, { status: 404 });
        }

        await webPush.sendNotification(
            sub,
            JSON.stringify({ title, body, url })
        );

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("Error sending push notification:", e);
        // If a subscription is invalid, you should remove it from your database.
        if (e.statusCode === 410) {
            // e.endpoint can be used to find and delete the subscription
        }
        return NextResponse.json({ error: 'Failed to send push notification.' }, { status: 500 });
    }
}
