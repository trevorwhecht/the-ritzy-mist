import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('SendGrid API key is missing');
}
sgMail.setApiKey(apiKey || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, groupSize, address, city, state, zipCode, inquiry } = body;

    let messageContent = `📧 New Contact Form Submission\n`;
    messageContent += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    messageContent += `👤 Contact Information:\n`;
    messageContent += `   Name: ${firstName} ${lastName}\n`;
    messageContent += `   Email: ${email}\n`;
    messageContent += `   Phone: ${phone}\n\n`;

    if (groupSize) {
      messageContent += `👥 Group Booking Details:\n`;
      messageContent += `   Group Size: ${groupSize} people\n`;
      messageContent += `   Location: ${address}\n`;
      messageContent += `            ${city}, ${state} ${zipCode}\n\n`;
    }

    messageContent += `💬 Inquiry:\n${inquiry}\n\n`;

    const msg = {
      to: 'theritzymist@gmail.com',
      from: {
        email: 'theritzymist@gmail.com',
        name: 'The Ritzy Mist'
      },
      subject: groupSize ? `New Group Booking Inquiry (${groupSize} people)` : 'New Contact Form Submission',
      text: messageContent,
      html: messageContent.replace(/\n/g, '<br>'),
      replyTo: email
    };

    try {
      await sgMail.send(msg);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('SendGrid Error Details:', {
        message: error.message,
        response: error.response?.body,
        code: error.code,
        headers: error.response?.headers,
        apiKey: apiKey ? 'Present' : 'Missing',
        errors: error.response?.body?.errors
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to send email. Please try again later.',
          details: error.response?.body?.errors?.[0]?.message || error.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request.' },
      { status: 500 }
    );
  }
} 