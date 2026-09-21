import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';

const uri = process.env.MONGODB_URI;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!uri) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const withdrawals = await db.collection('withdrawals')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    await client.close();
    return NextResponse.json(withdrawals);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
