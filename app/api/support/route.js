export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, userName, userEmail, subject, message, screenshot } = body;

    if (!uri) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    if (!subject || !message) return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const supportTicket = {
      id: 'ticket_' + Date.now(),
      userId,
      userName,
      userEmail,
      subject,
      message,
      screenshot: screenshot || null, // ✅ Save screenshot (base64)
      status: 'open',
      adminReply: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('support_tickets').insertOne(supportTicket);
    await client.close();

    return NextResponse.json({ 
      message: 'Support ticket submitted successfully', 
      ticketId: supportTicket.id 
    });
  } catch (error) {
    console.error('Support API Error:', error);
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!uri || !userId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const client = new MongoClient(uri, { tls: true, serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db('daily-paisa');

    const tickets = await db.collection('support_tickets')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    await client.close();

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Support GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
  }
