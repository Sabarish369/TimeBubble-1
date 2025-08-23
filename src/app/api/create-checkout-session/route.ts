
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

// This function will now handle all logic and error checking.
export async function POST(req: NextRequest) {
  // Check for the secret key at the beginning of the request.
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set.');
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
  
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Use environment variable or a fallback for the Price ID
    const priceId = process.env.STRIPE_LIFETIME_PRICE_ID || 'price_1PKOyDRp4yLqXGqQtYyAol8C';
    if (!priceId) {
        console.error('STRIPE_LIFETIME_PRICE_ID is not configured and no fallback is available.');
        return NextResponse.json({ error: 'Stripe Price ID is not configured.' }, { status: 500 });
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
    // This will now catch any error, including from req.json(), and return a proper JSON response.
    return NextResponse.json({ error: err.message || 'Error creating checkout session.' }, { status: 500 });
  }
}
