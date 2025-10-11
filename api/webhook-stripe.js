// Stripe Webhook Handler
// File: /api/webhook-stripe.js

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      console.log('Stripe not configured')
      return new Response('Webhook not configured', { status: 400 })
    }

    const stripe = require('stripe')(STRIPE_SECRET_KEY)
    
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.log('Webhook signature verification failed:', err.message)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      console.log('Payment successful for session:', session.id)
      console.log('Customer email:', session.customer_email)
      console.log('Metadata:', session.metadata)
      
      // The access code will be generated when the success page calls /api/generate-access-code
      // with the Stripe session ID
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Webhook error', { status: 500 })
  }
}