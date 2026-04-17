/**
 * Cloudflare Pages Function: /api/subscribe
 * Captures email signups, adds them as contacts in Resend,
 * and sends a welcome email from tumak@tumakmusic.com.
 *
 * Environment variables:
 *   RESEND_API_KEY       — required. Resend API key.
 *   RESEND_AUDIENCE_ID   — optional. If unset, the first audience on the account is used.
 *   WELCOME_EMAIL_OFF    — optional. Set to "1" to skip the welcome email.
 */

const ALLOWED_ORIGINS = [
  'https://tumakmusic.com',
  'https://www.tumakmusic.com',
];

function corsFor(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : (origin.endsWith('.tumakmusic.pages.dev') ? origin : 'https://tumakmusic.com');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function sendWelcomeEmail(apiKey, to) {
  const payload = {
    from: 'Tumak <tumak@tumakmusic.com>',
    to: [to],
    subject: "You're in.",
    text: [
      "Hey,",
      "",
      "Thanks for subscribing. You'll hear from me when a new session drops or when there's something real to share. No fluff, no spam.",
      "",
      "In the meantime, you can catch the latest work here:",
      "https://youtube.com/@TumakMusic",
      "",
      "Talk soon,",
      "Tumak",
    ].join('\n'),
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#f5f5f5;background:#0a0a0a;">
        <h1 style="font-family:'Gagalin',sans-serif;color:#f0850a;font-size:32px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Tumak</h1>
        <p style="font-size:16px;line-height:1.7;color:#cccccc;margin:0 0 18px;">Hey,</p>
        <p style="font-size:16px;line-height:1.7;color:#cccccc;margin:0 0 18px;">
          Thanks for subscribing. You'll hear from me when a new session drops or when there's something real to share. No fluff, no spam.
        </p>
        <p style="font-size:16px;line-height:1.7;color:#cccccc;margin:0 0 24px;">
          In the meantime, you can catch the latest work on
          <a href="https://youtube.com/@TumakMusic" style="color:#14b8a6;text-decoration:none;font-weight:600;">YouTube</a>.
        </p>
        <p style="font-size:16px;line-height:1.7;color:#cccccc;margin:0;">Talk soon,<br>Tumak</p>
      </div>
    `,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('Welcome email send failed:', res.status, errBody);
  }
}

export async function onRequestPost(context) {
  const cors = corsFor(context.request);

  try {
    const body = await context.request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return json({ error: 'Valid email required.' }, 400, cors);
    }

    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return json({ error: 'Server configuration error.' }, 500, cors);
    }

    // Resolve audience ID: explicit env var, or auto-discover the first audience
    let audienceId = context.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      const audRes = await fetch('https://api.resend.com/audiences', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const audData = await audRes.json();
      if (audData.data && audData.data.length > 0) {
        audienceId = audData.data[0].id;
      } else {
        console.error('No Resend audiences found');
        return json({ error: 'Server configuration error.' }, 500, cors);
      }
    }

    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', JSON.stringify(data));
      return json({ error: 'Could not subscribe. Try again later.' }, 502, cors);
    }

    // Fire-and-forget welcome email (don't block the response on this)
    if (context.env.WELCOME_EMAIL_OFF !== '1') {
      if (context.waitUntil) {
        context.waitUntil(sendWelcomeEmail(apiKey, email));
      } else {
        // Best-effort if waitUntil is unavailable
        sendWelcomeEmail(apiKey, email).catch(err => console.error('Welcome email error:', err));
      }
    }

    return json({ success: true }, 200, cors);

  } catch (err) {
    console.error('Subscribe error:', err);
    return json({ error: 'Something went wrong.' }, 500, cors);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsFor(context.request),
      'Access-Control-Max-Age': '86400',
    },
  });
}
