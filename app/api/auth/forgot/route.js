export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { sendOTPEmail } from '@/lib/email';

const uri = process.env.MONGODB_URI;

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, mode, otp, newPassword } = body;

    if (!uri) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');
    const usersCollection = db.collection('users');

    // MODE 1: Generate and Send OTP via Email
    if (mode === 'send-otp') {
      const user = await usersCollection.findOne({ email });

      if (!user) {
        await client.close();
        return NextResponse.json({ error: 'Email not registered' }, { status: 404 });
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Save OTP to database
      await usersCollection.updateOne(
        { email },
        { $set: { resetOtp: otpCode, resetOtpExpiry: expiryTime } }
      );

      // Send OTP via email
      try {
        await sendOTPEmail(email, otpCode);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        await client.close();
        return NextResponse.json(
          { error: 'Failed to send OTP email. Please check your email configuration.' },
          { status: 500 }
        );
      }

      await client.close();

      // Don't return the OTP in production!
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email address',
      });
    }

    // MODE 2: Verify OTP and Reset Password
    if (mode === 'reset-password') {
      const user = await usersCollection.findOne({ email });

      if (!user) {
        await client.close();
        return NextResponse.json({ error: 'Email not registered' }, { status: 404 });
      }

      // Check if OTP exists
      if (!user.resetOtp) {
        await client.close();
        return NextResponse.json({ error: 'No OTP requested. Please request a new one.' }, { status: 400 });
      }

      // Check if OTP matches
      if (user.resetOtp !== otp) {
        await client.close();
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      // Check if OTP is expired
      if (new Date(user.resetOtpExpiry) < new Date()) {
        await client.close();
        return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        await client.close();
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Update password and clear OTP fields
      await usersCollection.updateOne(
        { email },
        {
          $set: { password: newPassword },
          $unset: { resetOtp: "", resetOtpExpiry: "" },
        }
      );

      await client.close();
      return NextResponse.json({ 
        success: true, 
        message: 'Password reset successful! You can now login with your new password.' 
      });
    }

    return NextResponse.json({ error: 'Invalid request mode' }, { status: 400 });

  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
