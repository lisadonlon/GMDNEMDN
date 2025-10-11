#!/usr/bin/env node
/**
 * Debug script to check ICD API credentials
 */

const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  console.log('✓ .env file found');
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      const cleanKey = key.trim();
      const cleanValue = value.trim().replace(/^["']|["']$/g, '');
      if (cleanKey === 'ICD_CLIENT_ID') process.env.ICD_CLIENT_ID = cleanValue;
      if (cleanKey === 'ICD_CLIENT_SECRET') process.env.ICD_CLIENT_SECRET = cleanValue;
    }
  });
} else {
  console.log('✗ .env file not found');
}

console.log('\nCredentials check:');
console.log('==================');
console.log('Client ID:', process.env.ICD_CLIENT_ID ? `${process.env.ICD_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
console.log('Client Secret:', process.env.ICD_CLIENT_SECRET ? `${process.env.ICD_CLIENT_SECRET.substring(0, 10)}...` : 'NOT SET');
console.log('Client ID length:', process.env.ICD_CLIENT_ID ? process.env.ICD_CLIENT_ID.length : 0);
console.log('Client Secret length:', process.env.ICD_CLIENT_SECRET ? process.env.ICD_CLIENT_SECRET.length : 0);

// Check for common issues
const issues = [];
if (!process.env.ICD_CLIENT_ID) issues.push('Client ID is missing');
if (!process.env.ICD_CLIENT_SECRET) issues.push('Client Secret is missing');
if (process.env.ICD_CLIENT_ID && process.env.ICD_CLIENT_ID.includes('your_client_id')) issues.push('Client ID is still placeholder');
if (process.env.ICD_CLIENT_SECRET && process.env.ICD_CLIENT_SECRET.includes('your_client_secret')) issues.push('Client Secret is still placeholder');

if (issues.length > 0) {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('\n✓ Credentials appear to be configured correctly');
}

// Test the format
if (process.env.ICD_CLIENT_ID && process.env.ICD_CLIENT_SECRET) {
  console.log('\nCredential format check:');
  console.log('========================');
  console.log('Client ID format:', /^[a-f0-9-_]+$/i.test(process.env.ICD_CLIENT_ID) ? '✓ Valid' : '⚠️  Contains unexpected characters');
  console.log('Client Secret format:', /^[A-Za-z0-9+/=]+$/.test(process.env.ICD_CLIENT_SECRET) ? '✓ Valid base64' : '⚠️  Not standard base64 format');
}