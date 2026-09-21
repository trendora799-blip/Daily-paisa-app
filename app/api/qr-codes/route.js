export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET() {
  try {
    if (!uri) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    // Fetch only active QR codes
    const codes = await db.collection('qr-codes').find({ active: true }).toArray();
    await client.close();

    return NextResponse.json(codes);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
                                                         }
