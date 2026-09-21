export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// ✅ Updated 20-Tier Plans: 5% to 15% Daily | 12-Day Limit for ₹500-₹2000
const VALID_PLANS = {
  tier_1:  { price: 500,   dailyIncome: 25,    incomeRate: '5.0%', title: 'Starter', cooldownDays: 12 },
  tier_2:  { price: 1000,  dailyIncome: 55,    incomeRate: '5.5%', title: 'Basic', cooldownDays: 12 },
  tier_3:  { price: 2000,  dailyIncome: 120,   incomeRate: '6.0%', title: 'Standard', cooldownDays: 12 },
  tier_4:  { price: 3000,  dailyIncome: 195,   incomeRate: '6.5%', title: 'Premium', cooldownDays: 1 },
  tier_5:  { price: 4000,  dailyIncome: 280,   incomeRate: '7.0%', title: 'Advanced', cooldownDays: 1 },
  tier_6:  { price: 5000,  dailyIncome: 375,   incomeRate: '7.5%', title: 'Elite', cooldownDays: 1 },
  tier_7:  { price: 6000,  dailyIncome: 480,   incomeRate: '8.0%', title: 'Pro', cooldownDays: 1 },
  tier_8:  { price: 8000,  dailyIncome: 680,   incomeRate: '8.5%', title: 'Master', cooldownDays: 1 },
  tier_9:  { price: 10000, dailyIncome: 900,   incomeRate: '9.0%', title: 'Expert', cooldownDays: 1 },
  tier_10: { price: 12000, dailyIncome: 1140,  incomeRate: '9.5%', title: 'Guru', cooldownDays: 1 },
  tier_11: { price: 15000, dailyIncome: 1500,  incomeRate: '10.0%', title: 'Platinum', cooldownDays: 1 },
  tier_12: { price: 18000, dailyIncome: 1890,  incomeRate: '10.5%', title: 'Gold', cooldownDays: 1 },
  tier_13: { price: 20000, dailyIncome: 2200,  incomeRate: '11.0%', title: 'Diamond', cooldownDays: 1 },
  tier_14: { price: 25000, dailyIncome: 2875,  incomeRate: '11.5%', title: 'Ruby', cooldownDays: 1 },
  tier_15: { price: 30000, dailyIncome: 3600,  incomeRate: '12.0%', title: 'Emerald', cooldownDays: 1 },
  tier_16: { price: 35000, dailyIncome: 4375,  incomeRate: '12.5%', title: 'Sapphire', cooldownDays: 1 },
  tier_17: { price: 40000, dailyIncome: 5200,  incomeRate: '13.0%', title: 'Amethyst', cooldownDays: 1 },
  tier_18: { price: 45000, dailyIncome: 6075,  incomeRate: '13.5%', title: 'Topaz', cooldownDays: 1 },
  tier_19: { price: 48000, dailyIncome: 6720,  incomeRate: '14.0%', title: 'Pearl', cooldownDays: 1 },
  tier_20: { price: 50000, dailyIncome: 7500,  incomeRate: '15.0%', title: 'Royal', cooldownDays: 1 },
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, packId, amount } = body;

    if (!uri || !userId || !packId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const plan = VALID_PLANS[packId];
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    if (plan.price !== amount) return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const user = await db.collection('users').findOne({ id: userId });
    if (!user) { await client.close(); return NextResponse.json({ error: 'User not found' }, { status: 404 }); }
    if ((user.balance || 0) < amount) { await client.close(); return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 }); }

    const existingSubs = user.subscriptions || [];
    const isAlreadyActive = existingSubs.some(sub => sub.packId === packId && sub.active && new Date(sub.endDate) > new Date());

    if (isAlreadyActive) {
      await client.close();
      return NextResponse.json({ error: 'You already have this specific plan active!' }, { status: 400 });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const newSubscription = {
      id: 'sub_' + Date.now(),
      packId: packId,
      packTitle: plan.title,
      price: amount,
      dailyIncome: plan.dailyIncome,
      incomeRate: plan.incomeRate,
      cooldownDays: plan.cooldownDays, // ✅ Save cooldown limit to DB
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      active: true,
    };

    await db.collection('users').updateOne(
      { id: userId },
      {
        $inc: { balance: -amount },
        $push: { subscriptions: newSubscription }, 
      }
    );

    await db.collection('transactions').insertOne({
      id: 'tx_sub_' + Date.now(),
      userId,
      type: 'subscription',
      amount: -amount,
      description: `Subscription: ${plan.title} Plan`,
      status: 'approved',
      createdAt: new Date().toISOString(),
    });

    await client.close();
    return NextResponse.json({ success: true, message: 'Subscription activated' });
  } catch (error) {
    console.error('Subscription API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
            }
