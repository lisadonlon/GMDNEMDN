# 🔥 Stripe Setup Guide - Complete Walkthrough

## 📋 **Quick Setup Checklist**
- [ ] Create Stripe account
- [ ] Get API keys
- [ ] Configure Vercel environment variables
- [ ] Install Stripe dependency
- [ ] Test payments
- [ ] Set up webhooks
- [ ] Go live

## 🚀 **Step-by-Step Setup**

### **1. Create Stripe Account (5 minutes)**
1. **Visit**: https://stripe.com
2. **Click "Start now"** 
3. **Sign up** with your email
4. **Verify email** 
5. **Complete business information**:
   - Business name: "Medical Device Navigator" (or your choice)
   - Website: Your domain (or leave blank for now)
   - Business type: "Individual" or "Company"

### **2. Get Your API Keys (2 minutes)**
Once logged in to Stripe Dashboard:

1. **Go to**: Dashboard → **Developers** → **API Keys**
2. **Note these keys** (you'll need them for Vercel):

```
Test Mode Keys (for development):
- Publishable key: pk_test_51...
- Secret key: sk_test_51...

Live Mode Keys (for production):
- Publishable key: pk_live_51...
- Secret key: sk_live_51...
```

⚠️ **Important**: 
- **Publishable key** = Safe for frontend code
- **Secret key** = Keep private, server-only

### **3. Configure Vercel Environment Variables (3 minutes)**

In your Vercel project dashboard:

1. **Go to**: Project Settings → **Environment Variables**
2. **Add these variables**:

```env
STRIPE_SECRET_KEY=sk_test_51xxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx (we'll get this in step 6)
```

**For Production**: Use `sk_live_` and `pk_live_` keys

### **4. Install Dependencies (1 minute)**

```bash
npm install stripe
```

✅ **Already done** - I added it to your package.json

### **5. Test Your Setup (5 minutes)**

Deploy to Vercel and test:

```bash
# Deploy your changes
git add .
git commit -m "Add Stripe integration"
git push

# Or deploy directly
npx vercel --prod
```

**Test the payment flow**:
1. Visit your deployed app
2. Wait for 10-minute timer or click "Upgrade"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future date for expiry
5. Any 3-digit CVC

### **6. Set Up Webhooks (3 minutes)**

In Stripe Dashboard:

1. **Go to**: Developers → **Webhooks**
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://your-app.vercel.app/api/stripe-webhook`
4. **Select events**:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. **Copy the webhook secret** (starts with `whsec_`)
6. **Add to Vercel** environment variables as `STRIPE_WEBHOOK_SECRET`

### **7. Go Live (2 minutes)**

When ready for real payments:

1. **In Stripe Dashboard**:
   - Complete account verification
   - Add bank account details
   - Switch to "Live mode"

2. **Update Vercel environment variables**:
   - Replace test keys with live keys
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY=pk_live_...`

## 💰 **Pricing & Fees**

### **Stripe Fees**:
- **EU Cards**: 1.4% + €0.25 per transaction
- **Non-EU Cards**: 2.9% + €0.25 per transaction

### **Your €2.00 Payment**:
- **Revenue**: €2.00
- **Stripe Fee**: ~€0.28 (EU) or ~€0.31 (Non-EU)
- **Net Profit**: ~€1.72 (86% margin)

### **Monthly Breakdown** (100 customers):
- **Gross Revenue**: €200
- **Stripe Fees**: ~€28-31
- **Net Revenue**: ~€169-172
- **Vercel Hosting**: €0 (free tier)
- **Total Profit**: ~€169-172/month

## 🧪 **Test Cards**

Use these for testing (they won't charge real money):

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 9987` | Lost card |

**Expiry**: Any future date  
**CVC**: Any 3 digits  
**ZIP**: Any valid postal code

## 🔒 **Security Best Practices**

✅ **Already Implemented**:
- Secret keys stored in environment variables
- Webhook signature verification
- CORS headers configured
- Input validation

✅ **Additional Security**:
- SSL/HTTPS (automatic with Vercel)
- PCI compliance (handled by Stripe)
- No card data touches your servers

## 🚨 **Troubleshooting**

### **Common Issues**:

1. **"Stripe not configured"**
   - Check environment variables in Vercel
   - Ensure keys start with `sk_test_` or `sk_live_`

2. **Webhook failures**
   - Verify endpoint URL is correct
   - Check webhook secret matches
   - Look at Vercel function logs

3. **Payment not completing**
   - Check success URL is correct
   - Verify payment success page loads
   - Check browser localStorage

### **Debug Commands**:

```bash
# Check Vercel environment variables
vercel env ls

# View function logs
vercel logs

# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## 📊 **Monitoring & Analytics**

Track these metrics in Stripe Dashboard:

1. **Revenue**: Total payments received
2. **Conversion Rate**: Successful vs failed payments  
3. **Geographic Distribution**: Where customers are located
4. **Popular Payment Methods**: Card types used

## 🎉 **You're Ready!**

Your Stripe integration includes:

✅ **€2.00 one-time payment**  
✅ **Secure checkout flow**  
✅ **Automatic premium activation**  
✅ **Webhook confirmation**  
✅ **Success/failure handling**  
✅ **Test mode support**  
✅ **Production ready**  

**Next Step**: Deploy to Vercel and start testing! 🚀

---

**Need Help?** 
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: Available 24/7 in dashboard
- Test everything thoroughly before going live