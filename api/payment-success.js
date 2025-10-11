// Success page handler
// File: /api/payment-success.js

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const { method } = request
  const url = new URL(request.url)
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const sessionId = url.searchParams.get('session_id')
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No session ID provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
    
    if (!STRIPE_SECRET_KEY) {
      // Demo mode
      return new Response(JSON.stringify({
        success: true,
        demo: true,
        message: 'Demo payment completed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = require('stripe')(STRIPE_SECRET_KEY)
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status === 'paid') {
      // Generate access code for successful payment
      const accessCodeResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-access-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeSessionId: session.id,
          email: session.customer_email || session.customer_details?.email || ''
        })
      })
      
      const codeData = await accessCodeResponse.json()
      
      return new Response(JSON.stringify({
        success: true,
        customerEmail: session.customer_email || session.customer_details?.email,
        userSessionId: session.metadata?.sessionId,
        amountPaid: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        accessCode: codeData.success ? codeData.accessCode : null,
        expiresAt: codeData.success ? codeData.expiresAt : null,
        instructions: codeData.success ? codeData.instructions : 'Please contact support for your access code'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment not completed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Payment success verification error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Payment verification failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}