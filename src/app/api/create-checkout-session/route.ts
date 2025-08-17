
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

// Ensure the Stripe secret key is provided
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const priceId = process.env.STRIPE_LIFETIME_PRICE_ID;
    if (!priceId) {
        throw new Error('Stripe Price ID is not configured.');
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade/canceled`,
      client_reference_id: userId,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error('Error creating Stripe session:', err);
    return NextResponse.json({ error: 'Error creating checkout session.' }, { status: 500 });
  }
}
