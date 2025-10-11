// Vercel Edge Function for Stripe payment processing
// File: /api/payment.js

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const { method } = request
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (method === 'POST') {
    try {
      const { sessionId, email } = await request.json()
      
      // Create Stripe checkout session for €2 payment
      const checkoutSession = await createStripeCheckout(sessionId, email)
      
      return new Response(JSON.stringify({
        success: true,
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment initialization failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  return new Response('Method not allowed', { 
    status: 405, 
    headers: corsHeaders 
  })
}

async function createStripeCheckout(sessionId, email) {
  // This would integrate with Stripe
  // For now, return a mock response
  
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured')
  }

  // Stripe integration would go here
  const mockCheckoutSession = {
    id: 'cs_' + Math.random().toString(36).substr(2),
    url: `https://checkout.stripe.com/pay/mock-${sessionId}`
  }
  
  return mockCheckoutSession
}