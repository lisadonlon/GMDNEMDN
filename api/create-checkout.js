// Enhanced Stripe Integration
// File: /api/create-checkout.js

export default async function handler(req, res) {
  console.log('=== Stripe checkout request started ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { sessionId, email } = req.body;
    console.log('Request data:', { sessionId, email });
    
    if (!sessionId) {
      console.log('ERROR: No session ID provided');
      res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
      return;
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    console.log('Environment check:');
    console.log('- Stripe key exists:', !!STRIPE_SECRET_KEY);
    console.log('- Stripe key prefix:', STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.substring(0, 20) + '...' : 'none');
    console.log('- Environment variables count:', Object.keys(process.env).length);
    console.log('- Node env:', process.env.NODE_ENV);
    
    if (!STRIPE_SECRET_KEY) {
      console.log('Stripe not configured - using demo mode');
      
      res.status(200).json({
        success: true,
        demo: true,
        sessionId: sessionId,
        message: 'Demo mode - payment simulated'
      });
      return;
    }

    console.log('Initializing Stripe...');
    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully');
    
    console.log('Creating checkout session...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Medical Device Navigator - Annual Access Code',
            description: 'One-year access code for GMDN-EMDN mappings and all features',
          },
          unit_amount: 200, // €2.00 in cents
        },
        quantity: 1,
      }],
      mode: 'payment', // One-time payment, not subscription
      success_url: `${req.headers.origin || 'https://medicaldevicecodes1.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://medicaldevicecodes1.vercel.app'}/`,
      customer_email: email || undefined,
      metadata: {
        sessionId: sessionId,
        product: 'medical-device-annual-code'
      },
      allow_promotion_codes: true,
    });

    console.log('Checkout session created:', session.id);
    console.log('Checkout URL:', session.url);

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      stripeSessionId: session.id
    });

  } catch (error) {
    console.error('=== Stripe error details ===');
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Payment setup failed',
      details: error.message,
      errorType: error.type || 'unknown'
    });
  }
}