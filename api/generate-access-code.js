// Simple Code Generator for Annual Access
// File: /api/generate-access-code.js

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
    const { stripeSessionId, email } = await request.json()
    
    if (!stripeSessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Stripe session ID required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate a unique access code
    const accessCode = generateAnnualAccessCode(stripeSessionId, email)
    
    return new Response(JSON.stringify({
      success: true,
      accessCode: accessCode.code,
      expiresAt: accessCode.expiresAt,
      instructions: 'Copy this code and paste it into the app to activate your annual subscription'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Code generation error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Code generation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

function generateAnnualAccessCode(stripeSessionId, email = '') {
  // Create expiration date (1 year from now)
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  
  // Create a deterministic but secure code based on:
  // - Stripe session ID (unique per payment)
  // - Current year (changes annually)
  // - Secret salt (for security)
  const currentYear = new Date().getFullYear()
  const secretSalt = process.env.ACCESS_CODE_SECRET || 'medical-device-navigator-2025'
  
  // Combine inputs for hash
  const hashInput = `${stripeSessionId}-${currentYear}-${secretSalt}-${email}`
  
  // Simple hash function (in production, use crypto.subtle.digest)
  const code = hashInput
    .split('')
    .reduce((hash, char) => {
      const charCode = char.charCodeAt(0)
      return ((hash << 5) - hash + charCode) & 0xffffffff
    }, 0)
    .toString(36)
    .toUpperCase()
    .slice(-12) // Take last 12 characters
    .replace(/[0O]/g, '8') // Replace confusing characters
    .replace(/[1IL]/g, '9')
  
  // Format as XXX-XXX-XXX-XXX for easy typing
  const formattedCode = code.match(/.{1,3}/g)?.join('-') || code
  
  return {
    code: formattedCode,
    expiresAt: expiresAt.toISOString(),
    year: currentYear
  }
}