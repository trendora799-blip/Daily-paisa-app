export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// ✅ Padded to 8 items each so the wheel divides perfectly into 45-degree segments
const STANDARD_REWARDS = [5, 10, 20, 30, 5, 10, 20, 30];
const EXTRA_REWARDS = [30, 50, 50, 100, 100, 150, 150, 200];
const REFERRAL_REWARDS = [50, 100, 100, 150, 150, 200, 200, 200];

export async function POST(req) {
  try {
    const { userId, spinType } = await req.json();
    if (!uri || !userId || !['standard', 'extra', 'referral'].includes(spinType)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');
    const usersCol = db.collection('users');
    const txCol = db.collection('transactions');

    const user = await usersCol.findOne({ id: userId });
    if (!user) { await client.close(); return NextResponse.json({ error: 'User not found' }, { status: 404 }); }

    const today = new Date().toISOString().split('T')[0];
    const totalDeposits = user.totalDeposits || 0;
    const teamDeposits = user.teamDeposits || 0; // Fallback to totalDeposits if teamDeposits isn't tracked yet
    const referralCount = user.team ? user.team.length :0;

    let reward = 0;
    let rewardPool = [];
    let updateField = '';
    let txDescription = '';

    // 1. Validate Eligibility & Set Reward Pool
    if (spinType === 'standard') {
      if (totalDeposits < 500) throw new Error('Minimum deposit of ₹500 required to unlock spins!');
      if (user.lastSpinDate === today) throw new Error('You have already used your Daily Spin today!');
      rewardPool = STANDARD_REWARDS;
      updateField = 'lastSpinDate';
      txDescription = 'Daily Basic Spin Win';
    } 
    else if (spinType === 'extra') {
      if (totalDeposits < 1000) throw new Error('Deposit ₹1000+ to unlock the Extra Spin!');
      if (user.lastExtraSpinDate === today) throw new Error('You have already used your Extra Spin today!');
      rewardPool = EXTRA_REWARDS;
      updateField = 'lastExtraSpinDate';
      txDescription = 'Extra High-roller Spin Win';
    } 
    else if (spinType === 'referral') {
      if (referralCount < 10) throw new Error('Refer 10+ users to unlock the Referral Spin!');
      if (teamDeposits < 1000 && totalDeposits < 1000) throw new Error('Your referrals must deposit ₹1000+ to unlock this!');
      if (user.lastReferralSpinDate === today) throw new Error('You have already used your Referral Spin today!');
      rewardPool = REFERRAL_REWARDS;
      updateField = 'lastReferralSpinDate';
      txDescription = 'Referral Bonus Spin Win';
    }

    // 2. Pick Random Reward
    reward = rewardPool[Math.floor(Math.random() * rewardPool.length)];

    // 3. Update User Balance and the specific spin date
    const updateData = { 
      $inc: { balance: reward, earnings: reward },
      $set: { [updateField]: today }
    };
    await usersCol.updateOne({ id: userId }, updateData);

    // 4. Record in Transaction History
    await txCol.insertOne({
      id: `tx_spin_${spinType}_${Date.now()}`,
      userId,
      type: 'spin_win',
      amount: reward,
      description: txDescription,
      status: 'approved',
      createdAt: new Date().toISOString(),
    });

    await client.close();

    return NextResponse.json({
      success: true,
      reward,
      newBalance: (user.balance || 0) + reward,
      spinType,
      message: `🎊 You won ₹${reward} from the ${spinType} spin!`
    });

  } catch (error) {
    console.error('Spin API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!uri || !userId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const user = await client.db('daily-paisa').collection('users').findOne({ id: userId });
    await client.close();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const today = new Date().toISOString().split('T')[0];
    const totalDeposits = user.totalDeposits || 0;
    const teamDeposits = user.teamDeposits || 0;
    const referralCount = user.team ? user.team.length : 0;

    return NextResponse.json({ 
      totalDeposits,
      teamDeposits,
      referralCount,
      canStandard: totalDeposits >= 500 && user.lastSpinDate !== today,
      canExtra: totalDeposits >= 1000 && user.lastExtraSpinDate !== today,
      canReferral: referralCount >= 10 && (teamDeposits >= 1000 || totalDeposits >= 1000) && user.lastReferralSpinDate !== today
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
          }
