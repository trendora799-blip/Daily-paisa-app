export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function POST(req) {
  try {
    const { email, otp, purpose, newPassword, userData } = await req.json();

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const otpRecord = await db.collection('otps').findOne({ email, otp, purpose });

    if (!otpRecord) {
      await client.close();
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await client.close();
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (purpose === 'register') {
      // Create new user
      const userId = 'u_' + Date.now();
      const userReferralCode = userData.name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

      let referredBy = null;
      if (userData.referralCode && userData.referralCode.trim() !== '') {
        const referrer = await db.collection('users').findOne({ referralCode: userData.referralCode.trim().toUpperCase() });
        if (referrer && referrer.id) {
          referredBy = referrer.id;
          await db.collection('users').updateOne(
            { id: referrer.id },
            { $addToSet: { team: userId } }
          );
        }
      }

      const newUser = {
        id: userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        balance: 0,
        earnings: 0,
        totalDeposits: 0,
        totalDeducted: 0,
        totalWithdrawn: 0,
        referralEarnings: 0,
        referralCode: userReferralCode,
        referredBy,
        team: [],
        isAdmin: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
      };

      await db.collection('users').insertOne(newUser);
    } 
    else if (purpose === 'reset') {
      if (!newPassword || newPassword.length < 6) {
        await client.close();
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      await db.collection('users').updateOne({ email }, { $set: { password: newPassword } });
    }

    // Delete OTP after successful verification
    await db.collection('otps').deleteOne({ email, otp, purpose });

    if (purpose === 'login' || purpose === 'register') {
      const user = await db.collection('users').findOne({ email });
      const { password: _, ...safeUser } = user;

      const response = NextResponse.json({ message: 'OTP verified', user: safeUser });
      response.cookies.set('dailypaisa_auth', JSON.stringify(safeUser), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      await client.close();
      return response;
    }

    await client.close();
    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
