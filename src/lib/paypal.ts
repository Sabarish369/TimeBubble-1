/**
 * Server-side PayPal helpers.
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();

const baseUrl = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
    // @ts-ignore
    cache: 'no-store',
  });
  if (!res.ok) {
    const errorMessage = 'Failed to obtain PayPal access token\n\nIf you continue to experience payment issues, please contact our support team at timebubblehelp@gmail.com';
    throw new Error(errorMessage);
  }
  const data = await res.json();
  return data.access_token as string;
}

export async function createPayPalOrder(params: { amount: string; currency?: string; description?: string; referenceId: string; origin?: string; }): Promise<{ id: string; approvalUrl: string }> {
  const accessToken = await getAccessToken();
  
  // Use provided origin, environment variable, or detect from headers
  const siteUrl = params.origin || process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.referenceId,
          description: params.description || 'TimeBubble Lifetime Pro',
          amount: {
            currency_code: params.currency || 'USD',
            value: params.amount,
          },
        },
      ],
      application_context: {
        brand_name: 'TimeBubble',
        user_action: 'PAY_NOW',
        return_url: `${siteUrl}/upgrade/success`,
        cancel_url: `${siteUrl}/upgrade`,
      },
    }),
    // @ts-ignore
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorMessage = `Failed to create PayPal order: ${text}\n\nIf you continue to experience payment issues, please contact our support team at timebubblehelp@gmail.com`;
    throw new Error(errorMessage);
  }
  const data = await res.json();
  
  // Extract approval URL from links
  const approvalLink = data.links?.find((link: any) => link.rel === 'approve');
  if (!approvalLink) {
    throw new Error('PayPal approval URL not found in response');
  }
  
  return { id: data.id, approvalUrl: approvalLink.href };
}

export async function capturePayPalOrder(orderId: string): Promise<any> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    // @ts-ignore
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorMessage = `Failed to capture PayPal order: ${text}\n\nIf you continue to experience payment issues, please contact our support team at timebubblehelp@gmail.com`;
    throw new Error(errorMessage);
  }
  return await res.json();
}

export function isPayPalConfigured(): boolean {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}


