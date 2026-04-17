import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // 1. Attempt to add to Resend Audience if Audience ID is provided
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    let contactCreated = false;

    if (audienceId) {
      const { error: contactError } = await resend.contacts.create({
        email: email,
        unsubscribed: false,
        audienceId: audienceId,
      });
      if (!contactError) contactCreated = true;
    }

    // 2. Notify the developer (Always do this for now so they see signups immediately)
    await resend.emails.send({
      from: 'NightRecall <onboarding@resend.dev>',
      to: 'bongjun0289@gmail.com',
      subject: `New Waitlist Signup: ${email}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>New Waitlist Signup! 🚀</h2>
          <p>Email: <strong>${email}</strong></p>
          <p>Audience Status: ${contactCreated ? 'Added to Resend Audience' : 'Not added (Check Audience ID)'}</p>
          <hr>
          <p style="font-size: 12px; color: #888;">NightRecall Auto-Notification</p>
        </div>
      `
    });

    // 3. Send welcome email to user (Optional - using Resend's default verified domain for now)
    try {
      await resend.emails.send({
        from: 'NightRecall <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to the NightRecall Waitlist! 🌙',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #10332C; background: #F0EFEC; border-radius: 24px;">
            <h1 style="font-size: 24px;">Thanks for joining the waitlist!</h1>
            <p style="font-size: 16px; line-height: 1.6;">We're working hard on NightRecall, the 1-minute nightly ritual to help you remember everything you learn.</p>
            <p style="font-size: 16px; line-height: 1.6;">We'll notify you as soon as we're ready for early access.</p>
            <br>
            <p style="font-weight: bold;">— The NightRecall Team</p>
          </div>
        `
      });
    } catch (e) {
      console.error('Welcome email failed:', e);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Waitlist API Error:', err);
    return res.status(500).json({ error: 'Failed to join waitlist. Please try again later.' });
  }
}
