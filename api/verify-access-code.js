// Code Verification API
// File: /api/verify-access-code.js

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
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
    const { accessCode } = await request.json()
    
    if (!accessCode || accessCode.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please enter a valid access code'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Clean the code (remove spaces, dashes, make uppercase)
    const cleanCode = accessCode.replace(/[-\s]/g, '').toUpperCase()
    
    // Verify the code format and validity
    const verification = verifyAccessCode(cleanCode)
    
    if (verification.valid) {
      return new Response(JSON.stringify({
        success: true,
        valid: true,
        expiresAt: verification.expiresAt,
        daysRemaining: verification.daysRemaining,
        message: `Access code verified! Valid until ${new Date(verification.expiresAt).toLocaleDateString()}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({
        success: false,
        valid: false,
        error: verification.error
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Code verification error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Code verification failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

function verifyAccessCode(cleanCode) {
  try {
    // Check code format (should be 12 characters)
    if (cleanCode.length !== 12) {
      return {
        valid: false,
        error: 'Invalid code format. Code should be 12 characters.'
      }
    }

    // Extract year from code pattern
    // This is a simplified verification - in production you'd have more sophisticated validation
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1
    
    // Check if this looks like a valid code pattern
    const codePattern = /^[A-Z0-9]{12}$/
    if (!codePattern.test(cleanCode)) {
      return {
        valid: false,
        error: 'Invalid code format. Please check your code and try again.'
      }
    }

    // For demo purposes, we'll accept codes that match a pattern
    // In production, you'd validate against the generation algorithm
    const secretSalt = process.env.ACCESS_CODE_SECRET || 'medical-device-navigator-2025'
    
    // Simple validation: check if code could be valid for current or last year
    // This is simplified - real implementation would recreate the hash
    const isValidPattern = cleanCode.includes('8') || cleanCode.includes('9') // Our replacement chars
    
    if (!isValidPattern) {
      return {
        valid: false,
        error: 'Invalid access code. Please check your code and try again.'
      }
    }

    // Calculate expiration (assuming code was generated this year)
    const expiresAt = new Date()
    expiresAt.setFullYear(currentYear + 1)
    
    // Check if expired
    const now = new Date()
    if (now > expiresAt) {
      return {
        valid: false,
        error: 'This access code has expired. Please purchase a new annual subscription.'
      }
    }

    // Calculate days remaining
    const msPerDay = 24 * 60 * 60 * 1000
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / msPerDay)

    return {
      valid: true,
      expiresAt: expiresAt.toISOString(),
      daysRemaining: daysRemaining
    }

  } catch (error) {
    return {
      valid: false,
      error: 'Code verification failed. Please try again.'
    }
  }
}