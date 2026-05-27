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

// PFCOUNT for HyperLogLog UV estimation. Returns 0 on any error (missing key, network etc.).
async function redisPFCount(url, token, key) {
    const r = await fetch(`${url}/pfcount/${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!r.ok) return 0;
    const data = await r.json();
    return parseInt(data.result, 10) || 0;
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
    const ymd7   = []; // [today, yesterday, ..., 6 days ago] — index 0 is most recent
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        ymd7.push(d.toISOString().slice(0, 10));
    }

    try {
        const [
            templateTotals,
            modeTotals,
            eventTotals,
            resetChoiceTotals,
            dailyModeArr,
            dailyEventArr,
            dailyUvArr
        ] = await Promise.all([
            redisHGetAll(url, token, 'cd:stats:template'),
            redisHGetAll(url, token, 'cd:stats:mode'),
            redisHGetAll(url, token, 'cd:stats:event'),
            redisHGetAll(url, token, 'cd:stats:reset_choice'),
            Promise.all(ymd7.map(d => redisHGetAll(url, token, `cd:stats:daily:${d}`))),
            Promise.all(ymd7.map(d => redisHGetAll(url, token, `cd:stats:event_daily:${d}`))),
            Promise.all(ymd7.map(d => redisPFCount(url, token, `cd:stats:uv:${d}`)))
        ]);

        // Roll up "template::mode" hash into a flat top-templates ranking (sum all modes per template)
        const perTemplate = {};
        for (const [k, v] of Object.entries(templateTotals)) {
            const [tpl] = k.split('::');
            perTemplate[tpl] = (perTemplate[tpl] || 0) + v;
        }

        const daily = {};
        const dailyEvents = {};
        ymd7.forEach((d, i) => {
            daily[d]       = dailyModeArr[i]  || {};
            dailyEvents[d] = dailyEventArr[i] || {};
        });

        const grandTotal = Object.values(modeTotals).reduce((a, b) => a + b, 0);

        // ---- Reset choice distribution (all / text / template) with percentages ----
        const rcTotal =
            (resetChoiceTotals.all      || 0) +
            (resetChoiceTotals.text     || 0) +
            (resetChoiceTotals.template || 0);
        const pct = (n) => rcTotal > 0 ? Math.round((n / rcTotal) * 1000) / 10 : 0;
        const reset_choice_distribution = {
            total: rcTotal,
            all:      { count: resetChoiceTotals.all      || 0, pct: pct(resetChoiceTotals.all      || 0) },
            text:     { count: resetChoiceTotals.text     || 0, pct: pct(resetChoiceTotals.text     || 0) },
            template: { count: resetChoiceTotals.template || 0, pct: pct(resetChoiceTotals.template || 0) }
        };

        // ---- Conversion funnel ----
        // page_view → template_select → generate → copy / pdf / word
        const funnel = {
            page_view:       eventTotals.page_view       || 0,
            template_select: eventTotals.template_select || 0,
            generate:        eventTotals.generate        || modeTotals.generate || 0,
            copy:            eventTotals.copy_used       || 0,
            pdf:             eventTotals.pdf             || modeTotals.pdf      || 0,
            word:            eventTotals.word            || modeTotals.word     || 0
        };

        // ---- UV aggregates ----
        const last_7_days_uv = dailyUvArr;            // indices match ymd7
        const uv_today       = last_7_days_uv[0] || 0;
        const uv_7d_sum      = last_7_days_uv.reduce((a, b) => a + b, 0);

        // ---- Event total across the last 7 days ----
        const events_7d_sum = dailyEventArr
            .map(d => Object.values(d).reduce((a, b) => a + b, 0))
            .reduce((a, b) => a + b, 0);

        // Total downloads = pdf + word (handy for top-line cards)
        const downloads_total = (funnel.pdf || 0) + (funnel.word || 0);

        return res.status(200).json({
            generated_at: new Date().toISOString(),
            // ---- Legacy fields (unchanged for backward compatibility) ----
            grand_total_api_calls: grandTotal,
            top_templates_overall: sortByCount(perTemplate),
            template_mode_breakdown: sortByCount(templateTotals),
            mode_totals: modeTotals,
            last_7_days_utc: daily,
            // ---- New fields (added for the dashboard) ----
            ymd7,                       // ordered date array (index 0 = today UTC)
            event_totals: eventTotals,
            last_7_days_events: dailyEvents,
            last_7_days_uv,             // array aligned with ymd7
            uv_today,
            uv_7d_sum,
            events_7d_sum,
            downloads_total,
            reset_choice_distribution,
            funnel,
            note: 'Counters include events from app.js → /api/track. PDF/Word/Copy are tracked client-side; per-day buckets auto-expire after ~60 days.'
        });
    } catch (err) {
        return res.status(502).json({ error: 'Stats backend error', detail: err?.message || 'unknown' });
    }
}
