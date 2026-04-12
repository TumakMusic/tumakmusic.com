/**
 * Cloudflare Pages Function: /api/subscribe
 * Captures email signups and adds them as contacts in Resend.
 *
 * Environment variable required:
 *   RESEND_API_KEY - your Resend API key (set in Cloudflare Pages > Settings > Environment Variables)
 */

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://tumakmusic.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await context.request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(
        JSON.stringify({ error: 'Valid email required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Resolve audience ID: explicit env var, or auto-discover the first audience
    let audienceId = context.env.RESEND_AUDIENCE_ID;

    if (!audienceId) {
      const audRes = await fetch('https://api.resend.com/audiences', {
        headers: { 'Authorization': 'Bearer ' + apiKey },
      });
      const audData = await audRes.json();
      if (audData.data && audData.data.length > 0) {
        audienceId = audData.data[0].id;
      } else {
        console.error('No Resend audiences found');
        return new Response(
          JSON.stringify({ error: 'Server configuration error.' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    const res = await fetch('https://api.resend.com/audiences/' + audienceId + '/contacts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        unsubscribed: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Could not subscribe. Try again later.' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (err) {
    console.error('Subscribe error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://tumakmusic.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
