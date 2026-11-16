// Cloudflare Worker in front of the static site.
//
// Everything except /api/contact is served straight from dist/ by the asset router
// (see wrangler.jsonc). The one dynamic route takes the contact form and forwards it
// to a Telegram bot, so no mail server and no third-party form service is involved.
//
// Secrets (never in the repository):
//   TELEGRAM_BOT_TOKEN   the token BotFather gives you, e.g. 1234567890:AA...
//   TELEGRAM_CHAT_ID     the chat the bot writes to (your own user id, or a group id)
// Locally they live in .dev.vars (see .dev.vars.example); in production set them with
//   npx wrangler secret put TELEGRAM_BOT_TOKEN
//   npx wrangler secret put TELEGRAM_CHAT_ID
// or in the Cloudflare dashboard under Settings → Variables and Secrets.

const LIMITS = { name: 100, email: 150, message: 4000 };
const MIN_MESSAGE = 10;
// A real person needs at least a few seconds to fill the form in; a bot posts instantly.
const MIN_FILL_MS = 3000;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// Telegram's HTML mode: only these four characters have to be escaped
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

async function contact(request, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ error: 'not_configured' }, 503);

  // the form is only ever posted from this site itself
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ error: 'bad_origin' }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  // honeypot: a field no human ever sees, so anything in it is a bot
  if (clean(body.company, 50)) return json({ ok: true });
  if (Number(body.startedAt) && Date.now() - Number(body.startedAt) < MIN_FILL_MS) return json({ ok: true });

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const message = clean(body.message, LIMITS.message);
  const lang = clean(body.lang, 5);
  if (!name || !looksLikeEmail(email) || message.length < MIN_MESSAGE) return json({ error: 'invalid' }, 422);

  const country = request.headers.get('cf-ipcountry') || '—';
  const text = [
    '<b>Neue Nachricht vom Portfolio</b>',
    '',
    `<b>Name:</b> ${esc(name)}`,
    `<b>E-Mail:</b> ${esc(email)}`,
    `<b>Sprache:</b> ${esc(lang || '—')}  ·  <b>Land:</b> ${esc(country)}`,
    '',
    esc(message),
  ].join('\n');

  let res;
  try {
    res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Telegram unreachable: the form shows the email address as a fallback
    return json({ error: 'send_failed' }, 502);
  }

  if (!res.ok) {
    // never pass Telegram's answer on: it can contain the token
    console.error('telegram sendMessage failed', res.status);
    return json({ error: 'send_failed' }, 502);
  }
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Always HTTPS. On a custom domain Cloudflare can do this itself, but a
    // workers.dev address answers plain HTTP unless the Worker sends people on.
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol === 'http:' && !local) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      return contact(request, env);
    }

    // everything else: the built site, with clean URLs and the 404 page
    const res = await env.ASSETS.fetch(request);

    // Say the encoding in the header too, not only in the <meta> tag: a browser that
    // reads the header first then never has to guess, and SEO checkers ask for it.
    const type = res.headers.get('content-type') || '';
    if (type.startsWith('text/html') && !type.includes('charset')) {
      const out = new Response(res.body, res);
      out.headers.set('content-type', 'text/html; charset=utf-8');
      return out;
    }
    return res;
  },
};
