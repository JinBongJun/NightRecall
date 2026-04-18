import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function createMailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function getWelcomeHtml() {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Welcome to NightRecall</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        a { color: #10332C; text-decoration: underline; }
        .btn:hover { background-color: #1A4D43 !important; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F0EFEC; -webkit-text-size-adjust: 100%;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0EFEC;">
        <tr>
          <td align="center" style="padding: 40px 10px 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid rgba(16, 51, 44, 0.08); box-shadow: 0 8px 30px rgba(16, 51, 44, 0.04); overflow: hidden;">
              <tr>
                <td height="6" style="background-color: #10332C; font-size: 0; line-height: 0;">&nbsp;</td>
              </tr>
              <tr>
                <td align="center" style="padding: 40px 0 30px 0;">
                  <img src="https://night-recall.vercel.app/assets/logo.png" alt="NightRecall" width="48" height="48" style="display: block; width: 48px; height: 48px; border: 0;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 0 50px 50px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="color: #10332C; font-size: 32px; line-height: 1.25; font-weight: 800; letter-spacing: -0.04em;">
                        Locking in your<br>growth tonight.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 36px 0 0 0; color: #4A5568; font-size: 17px; line-height: 1.8; text-align: center;">
                        Hello there,<br><br>
                        We're building <strong>NightRecall</strong> to be the bridge between daily learning and lifelong memory.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 0 0 0; color: #4A5568; font-size: 17px; line-height: 1.8; text-align: center;">
                        The 1-minute nightly ritual is almost ready for you. No more forgotten notes. Just one perfect question each night, right when your brain is hardwired to encode it forever.
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 48px 0 10px 0;">
                        <table border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" bgcolor="#10332C" style="border-radius: 14px;">
                              <a href="https://night-recall.vercel.app" class="btn" style="display: inline-block; padding: 20px 40px; color: #F0EFEC !important; text-decoration: none; font-size: 16px; font-weight: 700;">Visit Our Website</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 30px; background-color: #F8F7F4; border-top: 1px solid #EEEEEE; color: #A0AEC0; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6;">
                  <p style="margin: 0; font-weight: 700; color: #10332C; opacity: 0.5;">NightRecall</p>
                  <p style="margin: 4px 0 0 0;">The 1-minute nightly ritual to remember everything.</p>
                </td>
              </tr>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <td align="center" style="padding: 24px; color: #A0AEC0; font-family: Arial, sans-serif; font-size: 11px;">
                  You received this because you joined the waitlist at <a href="https://night-recall.vercel.app" style="color: #A0AEC0;">night-recall.vercel.app</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export default async function handler(req, res) {
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
    const transporter = createMailTransporter();
    const gmailUser = process.env.GMAIL_USER;
    const audienceId = process.env.RESEND_AUDIENCE_ID || '43aa31c4-3ceb-481b-9ec5-c0363e981be5';
    let contactCreated = false;

    if (audienceId) {
      try {
        const { error: contactError } = await resend.contacts.create({
          email,
          unsubscribed: false,
          audienceId,
        });
        if (!contactError) {
          contactCreated = true;
        }
      } catch (contactErr) {
        console.error('Failed to add contact to audience:', contactErr);
      }
    }

    if (transporter && gmailUser) {
      await transporter.sendMail({
        from: `"NightRecall" <${gmailUser}>`,
        to: gmailUser,
        subject: `New Waitlist Signup: ${email}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>New Waitlist Signup!</h2>
            <p>Email: <strong>${email}</strong></p>
            <p>Audience Status: ${contactCreated ? 'Added to Resend Audience' : 'Not added (check audience configuration)'}</p>
            <hr>
            <p style="font-size: 12px; color: #888;">NightRecall Auto-Notification</p>
          </div>
        `,
      });

      try {
        await transporter.sendMail({
          from: `"NightRecall" <${gmailUser}>`,
          to: email,
          subject: 'Welcome to the NightRecall Waitlist!',
          html: getWelcomeHtml(),
        });
      } catch (mailErr) {
        console.error('Welcome email failed:', mailErr);
      }
    } else {
      console.warn('Gmail mailer not configured. Skipping email delivery.');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Waitlist API Error:', err);
    return res.status(500).json({ error: 'Failed to join waitlist. Please try again later.' });
  }
}
