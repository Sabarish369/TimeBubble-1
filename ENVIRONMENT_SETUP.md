# Environment Variables Setup for Production

This document outlines the required environment variables for the TimeBubble application to work properly in production, especially for payment processing.

## Required Environment Variables

### Firebase Configuration (Client-side)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Admin SDK (Server-side)
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
```

### Payment Processing
```
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxx_or_sk_test_xxxxx
STRIPE_LIFETIME_PRICE_ID=price_xxxxx

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENV=sandbox_or_live
```

## Important Notes

1. **Firebase Private Key**: The private key must be properly escaped with `\n` characters. In production environments, ensure the entire key is on one line with proper escape sequences.

2. **Firebase Admin SDK**: The application uses a centralized Firebase Admin initialization that handles errors gracefully. If Firebase Admin fails to initialize, payment processing will still work but user upgrades may need to be handled client-side.

3. **Production Deployment**: Ensure all environment variables are set in your deployment platform (Vercel, Netlify, etc.) before deploying.

4. **Error Handling**: The payment system is designed to be resilient - if Firebase Admin fails, the payment will still be processed but the user upgrade may need manual intervention.

## Troubleshooting

### "The default Firebase app does not exist" Error
This error occurs when:
- Environment variables are missing or incorrectly formatted
- Firebase Admin SDK credentials are invalid
- The private key is not properly escaped

### Payment Processing Issues
- Check that all PayPal/Stripe environment variables are set
- Verify that Firebase Admin credentials are correct
- Check server logs for specific initialization errors

## Testing

To test the Firebase Admin initialization:
1. Check the server logs during startup
2. Look for "Firebase Admin SDK initialized successfully" message
3. If initialization fails, check the error details in the logs
