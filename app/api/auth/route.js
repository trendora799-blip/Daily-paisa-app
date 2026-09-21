export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function POST(req) {
  try {
    const body = await req.json();
    const { mode } = body;

    if (!uri) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');
    const usersCollection = db.collection('users');

    // ==========================================
    // 1. REGISTER MODE
    // ==========================================
    if (mode === 'register') {
      const { name, email, phone, password, referralCode } = body;

      if (!name || !email || !phone || !password) {
        await client.close();
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }

      const existingEmail = await usersCollection.findOne({ email });
      if (existingEmail) {
        await client.close();
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 400 });
      }

      const existingPhone = await usersCollection.findOne({ phone });
      if (existingPhone) {
        await client.close();
        return NextResponse.json({ error: 'This mobile number is already registered.' }, { status: 400 });
      }

      const userId = 'u_' + Date.now();
      const userReferralCode = name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

      let referredBy = null;

      if (referralCode && referralCode.trim() !== '') {
        const referrer = await usersCollection.findOne({ 
          referralCode: referralCode.trim().toUpperCase() 
        });

        if (referrer && referrer.id) {
          referredBy = referrer.id;

          await usersCollection.updateOne(
            { id: referrer.id },
            { 
              $addToSet: { team: userId },
              $set: { updatedAt: new Date().toISOString() }
            }
          );
        }
      }

      const newUser = {
        id: userId,
        name,
        email,
        phone,
        password,
        balance: 0,
        earnings: 0,
        totalDeposits: 0,
        totalDeducted: 0,
        totalWithdrawn: 0,
        referralEarnings: 0,
        referralCode: userReferralCode,
        referredBy: referredBy,
        team: [],
        isAdmin: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await usersCollection.insertOne(newUser);
      await client.close();

      const { password: _, ...safeUser } = newUser;
      return NextResponse.json({ message: 'Registration successful', user: safeUser });
    }

    // ==========================================
    // 2. LOGIN MODE
    // ==========================================
    if (mode === 'login') {
      const { email, password } = body;
      const user = await usersCollection.findOne({ email });

      if (!user || user.password !== password) {
        await client.close();
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      if (user.isBanned) {
        await client.close();
        return NextResponse.json({ error: 'Your account has been banned.' }, { status: 403 });
      }

      await client.close();
      const { password: _, ...safeUser } = user;

      const response = NextResponse.json({ 
        message: 'Login successful',
        user: safeUser 
      });

      response.cookies.set('dailypaisa_auth', JSON.stringify(safeUser), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    await client.close();
    return NextResponse.json({ error: 'Invalid request mode' }, { status: 400 });

  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
                     }
