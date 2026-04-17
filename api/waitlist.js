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

    // 3. Send welcome email to user
    try {
      await resend.emails.send({
        from: 'NightRecall <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to the NightRecall Waitlist! 🌙',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background-color: #F0EFEC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
              .wrapper { width: 100%; table-layout: fixed; background-color: #F0EFEC; padding-bottom: 60px; }
              .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #10332C; }
              .header { padding: 40px 0 20px; text-align: center; background-color: #F0EFEC; }
              .logo { width: 42px; height: 42px; }
              .content { padding: 40px 50px; background-color: #ffffff; border-radius: 40px 40px 0 0; }
              .title { font-size: 28px; font-weight: 800; line-height: 1.2; margin-bottom: 24px; color: #10332C; letter-spacing: -0.02em; }
              .text { font-size: 16px; line-height: 1.7; margin-bottom: 30px; color: #4A5568; }
              .footer { padding: 30px; text-align: center; font-size: 12px; color: #A0AEC0; background-color: #F0EFEC; }
              .highlight { color: #10332C; font-weight: 700; }
              .button { display: inline-block; padding: 16px 32px; background-color: #10332C; color: #F0EFEC !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
            </style>
          </head>
          <body>
            <center class="wrapper">
              <table class="main" width="100%">
                <tr>
                  <td class="header">
                    <img src="https://night-recall.vercel.app/assets/logo.png" alt="NightRecall" class="logo">
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    <h1 class="title">Locking in your<br>growth tonight.</h1>
                    <p class="text">
                      Hello, <br><br>
                      Thanks for joining the <span class="highlight">NightRecall</span> waitlist. <br><br>
                      We’re building a bridge between daily learning and lifelong memory. No more forgotten notes or wasted hours. Just one perfect question each night, right when your brain is ready to encode it forever.
                    </p>
                    <p class="text">
                      We’ll notify you the moment early access is ready for your account.
                    </p>
                    <div style="text-align: center; margin-top: 40px;">
                      <a href="https://night-recall.vercel.app" class="button">Visit Our Website</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    <p>© 2026 NightRecall. The 1-minute nightly ritual.</p>
                    <p>You received this because you joined the waitlist at night-recall.vercel.app</p>
                  </td>
                </tr>
              </table>
            </center>
          </body>
          </html>
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
