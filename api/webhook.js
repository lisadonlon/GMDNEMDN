// Stripe Webhook Handler  
// File: /api/webhook.js

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.rawBody || req.body;
    const signature = req.headers['stripe-signature'];
    
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!STRIPE_WEBHOOK_SECRET) {
      console.log('Stripe webhook secret not configured');
      return res.status(400).json({ error: 'Webhook not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('Payment successful for session:', session.id);
      console.log('Customer email:', session.customer_email);
      console.log('Session metadata:', session.metadata);
      
      // Log the sessionId for access code generation
      if (session.metadata && session.metadata.sessionId) {
        console.log('SessionId for access code:', session.metadata.sessionId);
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook error' });
  }
}