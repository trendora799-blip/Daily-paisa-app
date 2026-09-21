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

    // Fetch as an array for the User App
    const links = await db.collection('social_links')
      .find({ active: { $ne: false } })
      .sort({ order: 1 })
      .toArray();

    await client.close();
    return NextResponse.json(links);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
