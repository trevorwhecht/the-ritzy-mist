import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://localhost:3000/api/auth/callback/google'
);

export async function GET() {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',  // This gets us a refresh token
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent'  // Forces consent screen to get new refresh token
  });

  return NextResponse.redirect(url);
} 