// Stripe Webhook Handler
// File: /api/stripe-webhook.js

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const { method } = request
  
  if (method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const signature = request.headers.get('stripe-signature')
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
    
    if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
      console.log('Stripe webhook not configured')
      return new Response('Webhook not configured', { status: 400 })
    }

    const stripe = require('stripe')(STRIPE_SECRET_KEY)
    const body = await request.text()
    
    let event
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log('Payment completed for session:', session.id)
        
        // Extract metadata
        const userSessionId = session.metadata?.sessionId
        const customerEmail = session.customer_email || session.customer_details?.email
        
        // Generate access code for the customer
        try {
          const accessCodeResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-access-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stripeSessionId: session.id,
              email: customerEmail || ''
            })
          })
          
          const codeData = await accessCodeResponse.json()
          
          if (codeData.success) {
            console.log('Access code generated:', {
              sessionId: session.id,
              customerEmail,
              accessCode: codeData.accessCode,
              expiresAt: codeData.expiresAt
            })
            
            // In production, you would:
            // 1. Send the access code via email
            // 2. Log for customer support
            // 3. Display on success page
          }
        } catch (error) {
          console.error('Failed to generate access code:', error)
        }
        
        break
        
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
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