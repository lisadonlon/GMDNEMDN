// Success page handler
// File: /api/payment-success.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  console.log('=== Payment success verification started ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      console.log('ERROR: No session ID provided');
      res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
      return;
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    console.log('Stripe key exists:', !!STRIPE_SECRET_KEY);
    
    if (!STRIPE_SECRET_KEY) {
      console.log('Demo mode - no Stripe key');
      res.status(200).json({
        success: true,
        demo: true,
        accessCode: 'DEMO-CODE-TEST-2025',
        customerEmail: 'demo@example.com',
        currency: 'EUR',
        amountPaid: '2.00',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      return;
    }

    console.log('Initializing Stripe...');
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    
    console.log('Retrieving checkout session:', session_id);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    console.log('Session status:', session.payment_status);
    console.log('Session customer email:', session.customer_details?.email);
    
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed');
      res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
      return;
    }

    // Generate access code
    const accessCode = generateAnnualAccessCode(session_id);
    
    console.log('Payment verified successfully');
    console.log('Generated access code:', accessCode);
    
    res.status(200).json({
      success: true,
      accessCode: accessCode,
      customerEmail: session.customer_details?.email || session.customer_email || '',
      currency: 'EUR',
      amountPaid: '2.00',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      sessionId: session_id
    });

  } catch (error) {
    console.error('=== Payment verification error ===');
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      details: error.message
    });
  }
}

// Generate access code using the same algorithm as the webhook
function generateAnnualAccessCode(sessionId) {
  // Use Web Crypto API instead of Node.js crypto
  const ACCESS_CODE_SECRET = process.env.ACCESS_CODE_SECRET || 'default-secret';
  
  const currentYear = new Date().getFullYear();
  const baseString = `${sessionId}-${currentYear}-${ACCESS_CODE_SECRET}`;
  
  // Simple hash function for demo (in production, use proper crypto)
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex and pad
  const hexHash = Math.abs(hash).toString(16).padStart(12, '0').toUpperCase();
  const code = hexHash.substring(0, 12);
  
  return `${code.substring(0, 3)}-${code.substring(3, 6)}-${code.substring(6, 9)}-${code.substring(9, 12)}`;
}