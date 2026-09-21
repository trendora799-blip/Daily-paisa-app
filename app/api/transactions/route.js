export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET(req) {
  try {
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const query = userId ? { userId } : {};
    const txs = await db.collection('transactions').find(query).toArray();
    await client.close();
    return NextResponse.json(txs.reverse());
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, status } = await req.json();
    if (!['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const originalTx = await db.collection('transactions').findOne({ id });
    if (!originalTx) { await client.close(); return NextResponse.json({ error: 'Transaction not found' }, { status: 404 }); }

    const result = await db.collection('transactions').updateOne(
      { id: id, status: 'pending' },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );

    if (result.modifiedCount === 0) {
      await client.close();
      return NextResponse.json({ error: 'Already processed!' }, { status: 400 });
    }

    const user = await db.collection('users').findOne({ id: originalTx.userId });
    if (!user) { await client.close(); return NextResponse.json({ success: true }); }

    // --- LOGIC FOR DEPOSITS ---
    if (originalTx.type === 'deposit' && status === 'approved') {
      const newTotalDeposits = (user.totalDeposits || 0) + originalTx.amount;

      let newVipLevel = 1;
      if (newTotalDeposits >= 50000) newVipLevel = 6;
      else if (newTotalDeposits >= 15000) newVipLevel = 5;
      else if (newTotalDeposits >= 5000) newVipLevel = 4;
      else if (newTotalDeposits >= 2000) newVipLevel = 3;
      else if (newTotalDeposits >= 500) newVipLevel = 2;

      await db.collection('users').updateOne(
        { id: user.id },
        {
          $inc: { balance: originalTx.amount, earnings: originalTx.amount, totalDeposits: originalTx.amount },
          $set: { vipLevel: newVipLevel }
        }
      );

      // ✅ 5% Referral Commission Logic
      if (user.referredBy) {
        const referrer = await db.collection('users').findOne({ id: user.referredBy });
        if (referrer) {
          const commission = originalTx.amount * 0.05; // 5% Commission

          // Add to referrer's Total Balance AND Earnings (Withdrawable Balance)
          await db.collection('users').updateOne(
            { id: referrer.id },
            { $inc: { balance: commission, earnings: commission, referralEarnings: commission } }
          );

          // Record the commission in the referrer's transaction history
          await db.collection('transactions').insertOne({
            id: 'tx_ref_' + Date.now(),
            userId: referrer.id,
            type: 'referral_commission',
            amount: commission,
            description: `5% Commission from ${user.name}'s deposit of ₹${originalTx.amount}`,
            status: 'approved',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // --- LOGIC FOR WITHDRAWALS ---
    if (originalTx.type === 'withdrawal' && status === 'rejected') {
      await db.collection('users').updateOne(
        { id: user.id },
        { $inc: { balance: originalTx.amount } }
      );
    }

    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    await client.db('daily-paisa').collection('transactions').deleteOne({ id });
    await client.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
                             }
