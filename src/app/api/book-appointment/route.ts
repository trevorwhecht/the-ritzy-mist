import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { zipCode } = await request.json();

    // Store the zip code in your database or session
    // You could use any database here (MongoDB, PostgreSQL, etc.)
    
    // Optional: Use Google Calendar API to pre-fill appointment details
    const calendar = google.calendar({
      version: 'v3',
      auth: process.env.GOOGLE_API_KEY
    });

    // You could create a draft event or store the data for later
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
} 