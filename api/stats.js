// Vercel Serverless Function: /api/stats
// Returns aggregate template usage stats for the operator.
//
// Access:   GET /api/stats?key=YOUR_PASSWORD
// Env vars: STATS_PASSWORD              — required, gates access
//           UPSTASH_REDIS_REST_URL      — required (set up in Vercel → Storage → Upstash)
//           UPSTASH_REDIS_REST_TOKEN    — required
//
// Without Upstash env vars, the endpoint reports it's not configured and points to the setup guide.

async function redisHGetAll(url, token, key) {
    const r = await fetch(`${url}/hgetall/${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!r.ok) return {};
    const data = await r.json();
    // Upstash returns { result: ['field1','v1','field2','v2',...] }
    const arr = data.result || [];
    const out = {};
    for (let i = 0; i < arr.length; i += 2) out[arr[i]] = parseInt(arr[i + 1], 10) || 0;
    return out;
}

function sortByCount(obj) {
    return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ key: k, count: v }));
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- Access control ----
    const expected = process.env.STATS_PASSWORD;
    if (!expected) {
        return res.status(503).json({
            error: 'Stats endpoint not configured. Set STATS_PASSWORD env var in Vercel to enable.'
        });
    }
    const provided = req.query?.key;
    if (provided !== expected) {
        // Constant-ish response time, no hint of why
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // ---- Storage availability ----
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        return res.status(503).json({
            error: 'Aggregate storage not configured.',
            hint: 'Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars in Vercel. See README.md for the 3-step Upstash setup.',
            fallback: 'Until then, see Vercel Dashboard → your project → Logs → search "CD_EVENT" for raw per-request events.'
        });
    }

    // ---- Pull aggregates ----
    const today  = new Date().toISOString().slice(0, 10);
    const ymd7   = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        ymd7.push(d.toISOString().slice(0, 10));
    }

    try {
        const [templateTotals, modeTotals, ...dailyDocs] = await Promise.all([
            redisHGetAll(url, token, 'cd:stats:template'),
            redisHGetAll(url, token, 'cd:stats:mode'),
            ...ymd7.map(d => redisHGetAll(url, token, `cd:stats:daily:${d}`))
        ]);

        // Roll up "template::mode" hash into a flat top-templates ranking (sum all modes per template)
        const perTemplate = {};
        for (const [k, v] of Object.entries(templateTotals)) {
            const [tpl] = k.split('::');
            perTemplate[tpl] = (perTemplate[tpl] || 0) + v;
        }

        const daily = {};
        ymd7.forEach((d, i) => { daily[d] = dailyDocs[i]; });

        const grandTotal = Object.values(modeTotals).reduce((a, b) => a + b, 0);

        return res.status(200).json({
            generated_at: new Date().toISOString(),
            grand_total_api_calls: grandTotal,
            top_templates_overall: sortByCount(perTemplate),
            template_mode_breakdown: sortByCount(templateTotals),
            mode_totals: modeTotals,
            last_7_days_utc: daily,
            note: 'Counts include both generate and polish/pdf/word events. PDF/Word are tracked client-side via app.js trackTemplateUse() — wire those into a separate /api/track endpoint if you want them in Redis too.'
        });
    } catch (err) {
        return res.status(502).json({ error: 'Stats backend error', detail: err?.message || 'unknown' });
    }
}
