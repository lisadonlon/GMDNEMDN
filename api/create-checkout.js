// Enhanced Stripe Integration
// File: /api/create-checkout.js

export const config = {
  runtime: 'nodejs',  // Changed from 'edge' to 'nodejs' for Stripe compatibility
}

export default async function handler(request) {
  console.log('=== Stripe checkout request started ===');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  
  const { method } = request
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { sessionId, email } = await request.json()
    console.log('Request data:', { sessionId, email });
    
    if (!sessionId) {
      console.log('ERROR: No session ID provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'Session ID required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
    console.log('Stripe key exists:', !!STRIPE_SECRET_KEY);
    console.log('Stripe key prefix:', STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'none');
    
    if (!STRIPE_SECRET_KEY) {
      console.log('Stripe not configured - using demo mode')
      
      // Demo mode response for development
      return new Response(JSON.stringify({
        success: true,
        demo: true,
        sessionId: sessionId,
        message: 'Demo mode - payment simulated'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Initializing Stripe...');
    // Real Stripe integration
    const stripe = require('stripe')(STRIPE_SECRET_KEY)
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
      success_url: `${request.headers.get('origin') || 'http://localhost:5175'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin') || 'http://localhost:5175'}/`,
      customer_email: email || undefined,
      metadata: {
        sessionId: sessionId,
        product: 'medical-device-annual-code'
      },
      allow_promotion_codes: true,
    });

    console.log('Checkout session created:', session.id);
    console.log('Checkout URL:', session.url);

    return new Response(JSON.stringify({
      success: true,
      checkoutUrl: session.url,
      stripeSessionId: session.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== Stripe error details ===');
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Payment setup failed',
      details: error.message,
      errorType: error.type || 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}