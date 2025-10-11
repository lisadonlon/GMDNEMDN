// Vercel Edge Function for feedback collection
// File: /api/feedback.js

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
      const feedbackData = await request.json()
      
      // Validate required fields
      const { type, message, email, gmdnCode, emdnCode, userAgent } = feedbackData
      
      if (!type || !message) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Type and message are required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create feedback entry
      const feedback = {
        id: generateId(),
        type, // 'error_report' or 'mapping_suggestion'
        message,
        email: email || 'anonymous',
        gmdnCode: gmdnCode || null,
        emdnCode: emdnCode || null,
        timestamp: new Date().toISOString(),
        userAgent: userAgent || request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        status: 'pending'
      }

      // Send email notification (using Vercel's email service or webhook)
      await sendFeedbackNotification(feedback)
      
      // Store feedback (in production, use database or file storage)
      console.log('Feedback received:', feedback)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: feedback.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to submit feedback'
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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

async function sendFeedbackNotification(feedback) {
  // Option 1: Use Vercel's webhook to send to your email
  // Option 2: Use a service like EmailJS
  // Option 3: Store in a simple database for review
  
  // For now, we'll just log it
  console.log('Feedback notification:', {
    type: feedback.type,
    message: feedback.message.substring(0, 100),
    timestamp: feedback.timestamp
  })
  
  // In production, implement actual email/notification system
}