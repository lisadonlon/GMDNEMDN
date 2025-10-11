// Vercel Edge Function for usage tracking
// File: /api/usage-tracker.js

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const { method } = request
  const url = new URL(request.url)
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    if (method === 'POST') {
      // Track usage session
      const { sessionId, action } = await request.json()
      
      // Store in edge KV or simple timestamp tracking
      const timestamp = Date.now()
      const sessionData = {
        sessionId,
        action,
        timestamp,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
      
      // For demo purposes, we'll use local storage on client
      // In production, use Vercel KV or similar
      
      return new Response(JSON.stringify({
        success: true,
        sessionData,
        remainingTime: calculateRemainingTime(sessionData)
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (method === 'GET') {
      // Check usage status
      const sessionId = url.searchParams.get('sessionId')
      
      return new Response(JSON.stringify({
        success: true,
        isPremium: false, // Check against payment records
        remainingTime: 600000, // 10 minutes in ms
        usageCount: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

function calculateRemainingTime(sessionData) {
  const TEN_MINUTES = 10 * 60 * 1000 // 10 minutes in milliseconds
  const elapsed = Date.now() - sessionData.timestamp
  return Math.max(0, TEN_MINUTES - elapsed)
}