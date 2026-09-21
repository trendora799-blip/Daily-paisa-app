export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id') || searchParams.get('userId');

    if (!uri || !userId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const user = await db.collection('users').findOne({ id: userId });

    if (!user) {
      await client.close();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ==========================================
    // 💰 AUTOMATIC DAILY INCOME LOGIC (ON-DEMAND)
    // ==========================================
    const now = new Date();

    // Safe fallback: If the user doesn't have this field yet, use 'now' 
    // to prevent giving massive retroactive payouts to old users.
    const lastCreditedString = user.lastIncomeCreditedAt || now.toISOString();
    const lastCredited = new Date(lastCreditedString);

    // Calculate how many FULL days have passed (24 hours = 86400000 ms)
    const diffTime = now - lastCredited;
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysPassed >= 1 && user.subscriptions && user.subscriptions.length > 0) {
      // Filter for subscriptions that are active AND not yet expired
      const activeSubs = user.subscriptions.filter(
        sub => sub.active === true && new Date(sub.endDate) > now
      );

      if (activeSubs.length > 0) {
        // Sum up the daily income from ALL active subscriptions
        const totalDailyIncome = activeSubs.reduce(
          (sum, sub) => sum + (Number(sub.dailyIncome) || 0), 
          0
        );

        const incomeToAdd = totalDailyIncome * daysPassed;

        if (incomeToAdd > 0) {
          // Update the database atomically
          await db.collection('users').updateOne(
            { id: userId },
            { 
              $inc: { 
                balance: incomeToAdd, 
                earnings: incomeToAdd 
              },
              $set: { lastIncomeCreditedAt: now.toISOString() }
            }
          );

          // Update the local user object so the frontend sees the new balance immediately
          user.balance = (user.balance || 0) + incomeToAdd;
          user.earnings = (user.earnings || 0) + incomeToAdd;
          user.lastIncomeCreditedAt = now.toISOString();
        }
      }
    }
    // ==========================================

    // Calculate VIP level
    const deposits = Number(user.totalDeposits) || 0;
    let vipLevel = 1;
    if (deposits >= 50000) vipLevel = 6;
    else if (deposits >= 15000) vipLevel = 5;
    else if (deposits >= 5000) vipLevel = 4;
    else if (deposits >= 2000) vipLevel = 3;
    else if (deposits >= 500) vipLevel = 2;

    const { password, ...safeUser } = user;

    await client.close();

    return NextResponse.json({
      user: {
        ...safeUser,
        vipLevel,
        team: user.team || [],
        referredBy: user.referredBy || null
      }
    });

  } catch (error) {
    console.error('User API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
