// Vercel Serverless Function: /api/track
// Public, unauthenticated event-ingest endpoint used by js/app.js for product analytics.
//
// Accepts: POST { event, template?, mode?, choice?, visitor_id?, meta? }
//   event       — required string, e.g. 'page_view', 'template_select', 'generate', 'polish',
//                 'pdf', 'word', 'copy_used', 'reset_opened', 'reset_choice', 'generate_error'
//   template    — optional template id (e.g. 'essay_argumentative')
//   mode        — optional one of: 'generate' | 'polish' | 'pdf' | 'word' | 'copy' | ...
//   choice      — optional one of: 'all' | 'text' | 'template' (for reset_choice events)
//   visitor_id  — optional client-generated UUID stored in localStorage `cd_vid`
//   meta        — optional small JSON object (e.g. ua, lang, isMobile) — currently ignored server-side
//
// Backward-compatible writes (do NOT change shapes — stats.js reads these):
//   cd:stats:template          HINCRBY  `${template}::${mode}`
//   cd:stats:mode              HINCRBY  mode
//   cd:stats:daily:${ymd}      HINCRBY  mode
//
// New writes (additive):
//   cd:stats:event             HINCRBY  event
//   cd:stats:event_daily:${ymd}  HINCRBY  event
//   cd:stats:uv:${ymd}         PFADD    visitor_id   (HyperLogLog → cheap UV estimate)
//
// Without Upstash env vars, returns 200 { ok:true, stored:false } so the frontend never sees errors.
// Simple per-IP rate limit: > 30 requests/second from one IP → 429.

// ---------- in-memory per-IP rate limiter (best-effort; per Vercel instance) ----------
const ipBuckets = new Map(); // ip -> { windowStart, count }
const RATE_WINDOW_MS = 1000;
const RATE_MAX = 30;

function clientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (xf) return String(xf).split(',')[0].trim();
    return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function tooManyRequests(ip) {
    const now = Date.now();
    const b = ipBuckets.get(ip);
    if (!b || now - b.windowStart > RATE_WINDOW_MS) {
        ipBuckets.set(ip, { windowStart: now, count: 1 });
        // opportunistic cleanup so the map can't grow without bound
        if (ipBuckets.size > 2000) {
            for (const [k, v] of ipBuckets) {
                if (now - v.windowStart > 60_000) ipBuckets.delete(k);
            }
        }
        return false;
    }
    b.count += 1;
    return b.count > RATE_MAX;
}

// ---------- redis helpers ----------
async function redis(url, token, ...parts) {
    // Upstash REST API: /COMMAND/arg1/arg2/...
    const path = parts.map(p => encodeURIComponent(String(p))).join('/');
    const r = await fetch(`${url}/${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!r.ok) throw new Error(`upstash ${r.status}`);
    return r.json();
}

// ---------- request body parsing (Vercel may give object or raw string) ----------
async function readJsonBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string' && req.body.length) {
        try { return JSON.parse(req.body); } catch { return {}; }
    }
    return await new Promise((resolve) => {
        let buf = '';
        req.on('data', c => { buf += c; if (buf.length > 8192) { req.destroy(); resolve({}); } });
        req.on('end', () => { try { resolve(JSON.parse(buf || '{}')); } catch { resolve({}); } });
        req.on('error', () => resolve({}));
    });
}

// ---------- sanitisation ----------
const SAFE_RE = /^[a-zA-Z0-9_\-:.]{1,80}$/;
function safeStr(s) {
    if (typeof s !== 'string') return null;
    if (!SAFE_RE.test(s)) return null;
    return s;
}

export default async function handler(req, res) {
    // Same-origin only; we don't need CORS (frontend is on the same Vercel deployment).
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'POST only' });
    }

    // ---- rate limit (best-effort) ----
    const ip = clientIp(req);
    if (tooManyRequests(ip)) {
        return res.status(429).json({ ok: false, error: 'Too many requests' });
    }

    // ---- parse body ----
    const body = await readJsonBody(req);
    const event    = safeStr(body.event);
    const template = safeStr(body.template);
    const mode     = safeStr(body.mode);
    const choice   = safeStr(body.choice);
    const vid      = safeStr(body.visitor_id);

    if (!event) {
        return res.status(400).json({ ok: false, error: 'event required' });
    }

    // ---- env (graceful degrade if Upstash not configured) ----
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        // Still log to Vercel function logs so the operator can find raw events if they ever need to.
        try { console.log('CD_EVENT', JSON.stringify({ event, template, mode, choice, vid, ip })); } catch {}
        return res.status(200).json({ ok: true, stored: false, reason: 'upstash_not_configured' });
    }

    // ---- build write set ----
    const ymd = new Date().toISOString().slice(0, 10);
    const writes = [];

    // 1) Always: new flat event counters
    writes.push(redis(url, token, 'hincrby', 'cd:stats:event', event, 1));
    writes.push(redis(url, token, 'hincrby', `cd:stats:event_daily:${ymd}`, event, 1));
    // Auto-expire per-day event counters after ~60 days so Redis doesn't grow forever.
    writes.push(redis(url, token, 'expire', `cd:stats:event_daily:${ymd}`, 60 * 24 * 3600));

    // 2) Reset choice sub-counter (so the dashboard can show all/text/template distribution easily)
    if (event === 'reset_choice' && choice && (choice === 'all' || choice === 'text' || choice === 'template')) {
        writes.push(redis(url, token, 'hincrby', 'cd:stats:reset_choice', choice, 1));
    }

    // 3) Backward-compatible writes (only for events that already had a template+mode)
    //    These keys are read by the legacy stats.js logic — DO NOT change their shape.
    if (template && mode) {
        writes.push(redis(url, token, 'hincrby', 'cd:stats:template', `${template}::${mode}`, 1));
        writes.push(redis(url, token, 'hincrby', 'cd:stats:mode', mode, 1));
        writes.push(redis(url, token, 'hincrby', `cd:stats:daily:${ymd}`, mode, 1));
        writes.push(redis(url, token, 'expire', `cd:stats:daily:${ymd}`, 60 * 24 * 3600));
    }

    // 4) UV estimation via HyperLogLog (cheap, ~12KB per key max)
    if (vid) {
        writes.push(redis(url, token, 'pfadd', `cd:stats:uv:${ymd}`, vid));
        writes.push(redis(url, token, 'expire', `cd:stats:uv:${ymd}`, 60 * 24 * 3600));
    }

    try {
        await Promise.all(writes);
        return res.status(200).json({ ok: true, stored: true });
    } catch (err) {
        // Never let analytics break the frontend.
        try { console.log('CD_EVENT_FAIL', err?.message || 'unknown'); } catch {}
        return res.status(200).json({ ok: true, stored: false, reason: 'backend_error' });
    }
}
