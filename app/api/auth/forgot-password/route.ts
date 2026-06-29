import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { getWhatsappClient } from '@/lib/whatsapp-daemon';
import { getWhatsappSettings } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const { username, email } = await req.json();

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and Email are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || !['OWNER', 'ADMIN'].includes(user.role.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid owner account' }, { status: 400 });
    }

    if (!(user as any).email || (user as any).email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match owner email' }, { status: 400 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    // Store token
    await (prisma as any).passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    let sentVia = 'console';

    // 1. Try WhatsApp first
    const socket = await getWhatsappClient();
    const settings = await getWhatsappSettings();
    if (socket && settings.status === 'connected' && settings.ownerPhone) {
      try {
        const jid = `91${settings.ownerPhone}@s.whatsapp.net`;
        await socket.sendMessage(jid, { 
          text: `*Security Alert: Password Reset Requested*\n\nA password reset was requested for your owner account. Click the link below to reset your password:\n\n${resetUrl}\n\n_If you did not request this, please ignore this message._` 
        });
        sentVia = 'whatsapp';
        console.log("Reset link sent via WhatsApp");
      } catch (waError) {
        console.error("WhatsApp failed, falling back to email:", waError);
      }
    }

    // 2. Fallback to Email
    if (sentVia === 'console') {
      try {
        await sendEmail({
          to: (user as any).email,
          subject: 'Password Reset Request',
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>A password reset was requested for your owner account.</p>
            <p>Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
          </div>`
        });
        sentVia = 'email';
        console.log("Reset link sent via Email/Console");
      } catch (emailError) {
        console.error("Email failed:", emailError);
        return NextResponse.json({ error: 'Failed to send reset link. Please check server logs.' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Reset link sent successfully', method: sentVia });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
