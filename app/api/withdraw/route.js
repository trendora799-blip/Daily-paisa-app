export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!uri || !userId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const user = await db.collection('users').findOne({ id: userId });
    await client.close();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const totalDeposits = user.totalDeposits || 0;
    let vipLevel = 1;
    if (totalDeposits >= 50000) vipLevel = 6;
    else if (totalDeposits >= 15000) vipLevel = 5;
    else if (totalDeposits >= 5000) vipLevel = 4;
    else if (totalDeposits >= 2000) vipLevel = 3;
    else if (totalDeposits >= 500) vipLevel = 2;

    const activeSubs = (user.subscriptions || []).filter(sub => sub.active && new Date(sub.endDate) > new Date());
    const highestActivePlanPrice = activeSubs.length > 0 ? Math.max(...activeSubs.map(s => s.price)) : 0;

    // ✅ No cooldown - users can withdraw daily
    const cooldownHours = 0; 

    const limits = {
      1: { min: 150, max: 200, cooldownHours },
      2: { min: 150, max: 500, cooldownHours },
      3: { min: 150, max: 1500, cooldownHours },
      4: { min: 150, max: 5000, cooldownHours },
      5: { min: 150, max: 15000, cooldownHours },
      6: { min: 150, max: 50000, cooldownHours },
    };

    return NextResponse.json({ vipLevel, totalDeposits, limits: limits[vipLevel] || limits[1], cooldownHours });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, amount, bankAccount, ifscCode, accountHolderName } = await req.json();
    if (!uri || !userId || !amount || !bankAccount || !ifscCode || !accountHolderName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const user = await db.collection('users').findOne({ id: userId });
    if (!user) { await client.close(); return NextResponse.json({ error: 'User not found' }, { status: 404 }); }

    // ✅ MINIMUM WITHDRAWAL: ₹150
    if (amount < 150) {
      await client.close();
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₹150' }, { status: 400 });
    }

    // ✅ Calculate Withdrawable Balance (ONLY earnings, NOT deposits)
    const totalEarnings = user.earnings || 0;
    const totalWithdrawn = user.totalWithdrawn || 0;
    const withdrawableBalance = totalEarnings - totalWithdrawn;

    if (amount > withdrawableBalance) {
      await client.close();
      return NextResponse.json({ 
        error: `You can only withdraw money earned from profits (spins, referrals, subscriptions). Your withdrawable balance is ₹${withdrawableBalance}. Deposited funds cannot be withdrawn.` 
      }, { status: 400 });
    }

    if ((user.balance || 0) < amount) { 
      await client.close(); 
      return NextResponse.json({ error: 'Insufficient total balance' }, { status: 400 }); 
    }

    const pendingWithdrawal = await db.collection('withdrawals').findOne({ userId: userId, status: 'pending' });
    if (pendingWithdrawal) {
      await client.close();
      return NextResponse.json({ error: 'You already have a pending withdrawal request.' }, { status: 400 });
    }

    const withdrawalId = 'wd_' + Date.now();
    const withdrawal = {
      id: withdrawalId,
      userId, amount: parseFloat(amount), accountHolderName, bankAccount, ifscCode,
      status: 'pending', createdAt: new Date().toISOString(),
    };
    await db.collection('withdrawals').insertOne(withdrawal);

    await db.collection('users').updateOne(
      { id: userId },
      { 
        $inc: { balance: -parseFloat(amount), totalWithdrawn: parseFloat(amount) }, 
        $set: { lastWithdrawalDate: new Date().toISOString() } 
      }
    );

    await db.collection('transactions').insertOne({
      id: 'tx_' + withdrawalId,
      userId, type: 'withdrawal', amount: -parseFloat(amount),
      description: `Withdrawal to ${accountHolderName} (${bankAccount})`,
      status: 'pending', createdAt: new Date().toISOString(),
    });

    await client.close();
    return NextResponse.json({ success: true, message: 'Withdrawal requested successfully' });
  } catch (error) {
    console.error('Withdraw API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
  }
