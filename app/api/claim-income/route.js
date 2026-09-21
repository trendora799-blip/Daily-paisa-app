export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!uri || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      await client.close();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Prevent double claiming
    if (user.lastClaimDate === today) {
      await client.close();
      return NextResponse.json({ error: 'Already claimed today! Come back tomorrow.' }, { status: 400 });
    }

    const activeSubs = user.subscriptions?.filter(sub => sub.active) || [];
    const totalDailyIncome = activeSubs.reduce((sum, sub) => sum + (sub.dailyIncome || 0), 0);

    if (totalDailyIncome === 0) {
      await client.close();
      return NextResponse.json({ error: 'No active subscriptions to claim from.' }, { status: 400 });
    }

    // 1️⃣ Add money to balance and earnings
    await db.collection('users').updateOne(
      { id: userId },
      {
        $inc: { balance: totalDailyIncome, earnings: totalDailyIncome },
        $set: { lastClaimDate: today }
      }
    );

    // 2️⃣ ✅ NEW: Save a transaction record so it shows in Transaction History
    await db.collection('transactions').insertOne({
      id: 'tx_income_' + Date.now(),
      userId: userId,
      type: 'daily_income',
      amount: totalDailyIncome,
      description: `Daily income from ${activeSubs.length} active subscription(s)`,
      status: 'approved',
      createdAt: new Date().toISOString(),
    });

    await client.close();

    return NextResponse.json({
      success: true,
      amount: totalDailyIncome,
      newBalance: (user.balance || 0) + totalDailyIncome
    });

  } catch (error) {
    console.error('Claim Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
