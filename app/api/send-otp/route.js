export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function POST(req) {
  try {
    const { email, purpose } = await req.json();

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const existingUser = await db.collection('users').findOne({ email });

    if (purpose === 'login' || purpose === 'reset') {
      if (!existingUser) {
        await client.close();
        return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
      }
    } else if (purpose === 'register') {
      if (existingUser) {
        await client.close();
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection('otps').updateOne(
      { email, purpose },
      { $set: { otp, expiresAt, createdAt: new Date().toISOString() } },
      { upsert: true }
    );
    await client.close();

    const subject = purpose === 'login' ? 'Your Daily Paisa Login OTP' : 
                    purpose === 'register' ? 'Your Daily Paisa Registration OTP' : 
                    'Your Password Reset OTP';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #3b82f6; text-align: center;">${subject}</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="letter-spacing: 5px; color: #1e293b; background: #e2e8f0; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px;">${otp}</h1>
        <p style="color: #64748b; font-size: 14px; text-align: center;">This OTP is valid for 10 minutes. Do not share this with anyone.</p>
      </div>
    `;

    // ✅ Use Brevo HTTP API instead of SMTP
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      throw new Error('Failed to send email via Brevo API');
    }

    return NextResponse.json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
        }
