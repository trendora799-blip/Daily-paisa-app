export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, amount, utrId, screenshot } = body;

    if (!uri || !userId || !amount || !utrId || !screenshot) {
      return NextResponse.json({ error: 'All fields including screenshot are required' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const transaction = {
      id: 'tx_' + Date.now(),
      userId,
      type: 'deposit',
      amount: parseFloat(amount),
      utrId,
      screenshot, // Stored as Base64 string
      status: 'pending',
      note: `UTR: ${utrId}`,
      createdAt: new Date().toISOString(),
    };

    // Save the deposit request to the database
    await db.collection('transactions').insertOne(transaction);

    await client.close();

    return NextResponse.json({ success: true, message: 'Deposit submitted for approval!' });
  } catch (error) {
    console.error('Deposit Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
