# CraftDoc v2

> **From homework to job hunt — AI writes your perfect English document in 30 seconds.**
> 30+ templates · No signup · No data stored · 100% Free during Beta

A pure-static AI English document generator deployed on Vercel. Zero build tools required — just edit and push.

---

## 📁 File Structure

```
craftdoc_v2/
├── index.html          ← Main page
├── css/
│   ├── style.css       ← Global styles, gradient, animations
│   └── templates.css   ← Document rendering styles (10 visual families)
├── js/
│   ├── app.js          ← Four-step picker + AI calls + export triggers
│   ├── templates.js    ← 30 template definitions (metadata only)
│   ├── exporter.js     ← PDF (jsPDF + html2canvas) + Word (docx.js) export
│   └── player.js       ← Floating music player (muted by default)
├── api/
│   └── generate.js     ← Vercel Serverless Function → DeepSeek API
├── img/
│   ├── logo.svg        ← SVG logo (backup)
│   ├── logo.png        ← ⚠️ REPLACE with your chosen PNG logo
│   └── favicon.ico    ← ⚠️ REPLACE with your favicon
├── vercel.json
├── .gitignore
└── README.md
```

---

## 🚀 Deploy to Vercel (Already Configured — Just Push)

If you already have this repo connected to Vercel:

1. **Replace the files** on GitHub (drag & drop the `craftdoc_v2/` folder contents into your repo root, overwriting old files).
2. Vercel will **detect the push automatically** and redeploy in ~30 seconds.
3. That's it — no CLI, no terminal needed.

> 💡 **Tip:** If you're not sure whether your Vercel project is still connected, go to [vercel.com/dashboard](https://vercel.com/dashboard), find your project, click **Settings → Git**, and confirm the repo listed there.

---

## 🔍 Local Preview (Double-Click Method)

You're a beginner — here's the easiest way to preview locally:

1. Open the `craftdoc_v2` folder.
2. **Double-click `index.html`** to open it in your browser.

> ⚠️ **Note:** The AI generation and export features require a network connection to call the Vercel API. They won't work when opened as `file://` from your hard drive. Everything else (the picker, UI, features) works fine locally.

For full local testing (with AI working), install the Vercel CLI:

```bash
# 1. Install Vercel CLI (one-time)
npm install -g vercel

# 2. Login
vercel login

# 3. Link this project
# (run from inside the craftdoc_v2 folder)
vercel link

# 4. Pull environment variables from Vercel
vercel env pull .env.local

# 5. Run dev server
vercel dev
```

Then open `http://localhost:3000`.

---

## ⚙️ Things You Must Set Up (Placeholder Checklist)

Search your project for each placeholder below and replace it:

| 🔴 | What | Where | How |
|----|------|-------|-----|
| **1** | `YOUR_FORM_ID` | `index.html` → `#contact-form` `action` | See [Formspree Setup](#formspree-setup) below (5 steps) |
| **2** | `img/logo.png` | Delete the placeholder PNG | Replace with your real logo PNG (any size, will scale) |
| **3** | `img/favicon.ico` | `<head>` → `link[rel="icon"]` | Replace with your real favicon.ico |
| **4** | Music files (optional) | `js/player.js` → `PLAYLIST` array | See [Music Setup](#music-setup-optional) below |

---

## 🔧 Formspree Setup (5 Steps)

Formspree lets the Contact form send emails to you without any backend.

### Step 1 — Go to formspree.io
Open [formspree.io](https://formspree.io) in your browser.

### Step 2 — Create a free account
Click **Sign Up** (use any email). The free plan gives you **50 submissions/month** — more than enough for a feedback form.

### Step 3 — Create a new form
1. Click **+ New Form**.
2. Give it any name, e.g. `CraftDoc Contact`.
3. Click **Create Form**.

### Step 4 — Copy your Form ID
You'll see a URL like:
```
https://formspree.io/f/xpwqgvbl
```
The part after `/f/` — that's your **Form ID** (`xpwqgvbl` in this example).

### Step 5 — Paste it into the project
1. Open `index.html`.
2. Find this line (near the bottom of the file):
   ```html
   <form id="contact-form" class="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
3. Replace `YOUR_FORM_ID` with your real ID.

**Done!** Test the form — submit a message and check your email.

---

## 🎵 Music Setup (Optional)

The music player in the bottom-right corner uses royalty-free tracks from Pixabay CDN.

### To use local MP3 files:

1. Put your MP3 files in a folder called `audio/` (create it inside `craftdoc_v2/`).
2. Open `js/player.js`.
3. Find the `PLAYLIST` array and update the `src` for each track:
   ```javascript
   src: 'audio/my-song.mp3'
   ```

### To use a different CDN:

Just replace the URLs in `PLAYLIST` with any direct MP3 links.

> **Note:** Pixabay's CDN may occasionally return 403 errors. If songs don't play, replace the broken URLs with working ones — the player code handles errors gracefully.

---

## 🔑 API Key (Already Done — Don't Touch)

The DeepSeek API key is stored as an **environment variable** in Vercel — it's never in any file, so it's safe.

- Variable name: `DEEPSEEK_API_KEY`
- Where it's set: **Vercel Dashboard → Your Project → Settings → Environment Variables**

You don't need to do anything here unless you want to rotate the key.

---

## 📤 Export Features

| Button | Format | Best for |
|--------|--------|----------|
| 📄 Download PDF | PDF | Sending to HR, submitting to school |
| 📝 Download Word | .docx | Further editing in Word / Google Docs |

Both exports include a small **watermark** in the footer. The watermark is removed automatically when you subscribe to a paid plan.

---

## 🛠️ Common Beginner Questions

**Q: The AI isn't generating anything. What's wrong?**
A: Make sure you're connected to the internet and you've selected all 4 steps (category, document, template, content). Check the browser console (F12 → Console) for any red error messages.

**Q: I see a spinner that never stops.**
A: This usually means the Vercel deployment is still processing, or the API had an error. Wait 2 minutes and refresh. If it persists, check [vercel.com/dashboard](https://vercel.com/dashboard) to see if your deployment succeeded.

**Q: The music player doesn't play songs.**
A: Some Pixabay CDN links may not work. See the [Music Setup](#music-setup-optional) section above to swap them with working URLs.

**Q: How do I add more templates?**
A: 1. Add a prompt string to `api/generate.js` in the `TEMPLATE_PROMPTS` object. 2. Add the template definition to `js/templates.js` in `CRAFTDOC_TEMPLATES`. 3. Push to GitHub — Vercel deploys automatically.

---

## 📋 Vercel Environment Variables Checklist

| Variable | Value | Where to set |
|----------|-------|-------------|
| `DEEPSEEK_API_KEY` | Your DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com) | Vercel Dashboard → Settings → Environment Variables |

---

## 🎨 Customising Colours

Open `css/style.css` and edit the `:root` block at the top:

```css
:root {
    --primary: #1E3A8A;        /* Deep blue — buttons, headings */
    --purple: #4C1D95;         /* Gradient end colour */
    --accent: #F59E0B;         /* Gold — highlights, active states */
    --accent-hover: #D97706;   /* Hover state for gold */
    /* ... */
}
```

Save, push to GitHub, Vercel redeploys automatically. Done.

---

## 📄 License

This project is open-source for personal and commercial use. DeepSeek API usage is subject to [DeepSeek's terms](https://platform.deepseek.com/terms).

---

## 📊 数据看板使用方式（Stats Dashboard）

部署后，访问：

```
https://effortlessdoc.com/stats.html
```

首次打开会要求输入密码 —— 输入你在 Vercel 设置的 **`STATS_PASSWORD`**（详见下方"环境变量清单"）。
密码会被保存在浏览器 `localStorage` 中，下次自动登录；点页面右上角 **"Log out"** 可清除。

看板包含：
- **顶部 4 张大数字卡**：今日 UV / 7 日 UV / 总生成次数 / 总下载次数
- **趋势图**：最近 7 天 UV 与事件总数双 Y 轴折线
- **模板 Top 10**：最受欢迎的模板横向条形图
- **功能使用饼图**：generate / polish / pdf / word / copy 的占比
- **Reset 选择分布**：用户最常清掉哪一部分（all / text / template）
- **转化漏斗**：page_view → template_select → generate → copy/pdf/word，含每步流失率

> 🔐 该页面已设置 `noindex,nofollow`，不会被搜索引擎收录；但 URL 本身是公开可访问的，**密码强度务必拉满**（建议 16+ 字符随机串）。

### 当前追踪的事件清单（透明声明）

`api/track.js` 记录以下事件，全部为产品行为统计，不含任何用户文本内容：

| 事件名             | 触发时机                                        | 附带字段                  |
|--------------------|-------------------------------------------------|---------------------------|
| `page_view`        | 页面加载完成时                                  | meta（ua/screen/referrer/lang/isMobile） |
| `template_select`  | 用户选中某个 template 时                        | template                  |
| `generate`         | 调用 AI 生成成功时                              | template, mode            |
| `polish`           | 调用 AI 润色成功时                              | template, mode            |
| `pdf`              | 点击下载 PDF 时                                 | template, mode            |
| `word`             | 点击下载 Word 时                                | template, mode            |
| `copy_used`        | 点击 Copy All 按钮时                            | template, mode=copy       |
| `reset_opened`     | 打开 Reset 弹窗时                               | —                         |
| `reset_choice`     | 选择某个 Reset 选项时                           | choice ∈ {all,text,template} |
| `generate_error`   | AI 调用失败时（不携带具体错误内容，仅计数）     | template, mode            |

UV 通过浏览器端生成的 UUID（`localStorage.cd_vid`）经 Redis HyperLogLog 估算，**不收集 IP、cookie、邮箱、文本内容**。

---

## ☁️ Upstash Redis 一键配置（3 步搞定）

数据看板需要一个 Redis 来累加计数。Vercel 内置了 Upstash 集成，免费档每天 **10000 条命令**，对试运营期完全够用（即使 100 个用户、每人 30 个事件，也只到 3000 条/天）。

### 步骤 1 — 进入 Vercel Storage
1. 打开 [vercel.com/dashboard](https://vercel.com/dashboard)
2. 点击你的项目（CraftDoc）
3. 顶部导航点 **Storage** 标签

### 步骤 2 — 添加 Upstash for Redis
1. 点 **"Browse Marketplace"**（或 "Create Database"）
2. 找到 **Upstash → Serverless DB (Redis)**，点 **Add Integration / Install**
3. 授权 Vercel 连接到 Upstash（如果你还没有 Upstash 账号，会引导你用 GitHub 注册）
4. 点 **Create Database**
   - Region：选 **离你 Vercel 项目最近的**（默认会推荐一个就行）
   - Plan：**Free**

### 步骤 3 — 自动注入环境变量
点 **Connect Project → 选 CraftDoc 项目 → Connect**。
Vercel 会自动注入两个环境变量：
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

接着触发一次新部署（在 Deployments 标签点最新一次部署右侧的 **⋯ → Redeploy**），等约 30 秒即可。
你可以打开 `https://effortlessdoc.com/stats.html` 登录验证。

> 💡 **省心检查**：如果看板里出现 "Upstash Redis not configured" 红条，回 Vercel → Settings → Environment Variables 确认这两个变量在 **Production** 环境下都已勾选。

---

## 🔐 新增的环境变量清单（这次部署必填）

| 变量名 | 必填 | 用途 | 怎么取 |
|--------|------|------|--------|
| `STATS_PASSWORD` | ✅ 是 | 访问 `/stats.html` 看板的密码 | 自己定一个 16+ 字符的强密码（用密码管理器生成最佳） |
| `UPSTASH_REDIS_REST_URL` | ✅ 是 | Upstash REST API 地址 | 上一节"Upstash Redis 一键配置"自动注入 |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ 是 | Upstash REST API 令牌 | 上一节自动注入 |
| `DEEPSEEK_API_KEY` | （已有） | 调用 DeepSeek 的密钥 | 之前就配好了，无需重设 |

> ⚠️ **降级保证**：以上三个新变量任意缺失时，前端**不会报错**，只是 `/stats.html` 会显示"未配置"提示，`/api/track` 会静默返回 `{ok:true, stored:false}`，主功能（AI 生成 / 下载 / Reset）完全不受影响。所以即使你想晚一点再配 Redis，也可以先上传代码不影响线上服务。

---

## 🔐 Privacy & Compliance

**`legal/privacy.html` is already in place** and linked from the site footer alongside the Terms.

### Where your users' data actually flows

```
 ┌──────────────┐   paste text    ┌────────────────┐   AI request    ┌──────────────┐
 │  Browser     │ ──────────────▶ │  /api/generate │ ──────────────▶ │  DeepSeek    │
 │  (textarea)  │ ◀────────────── │  (Vercel Fn)   │ ◀────────────── │  (memory)    │
 └──────────────┘   doc content   └────────────────┘   doc content   └──────────────┘
        │
        │ small JSON event {event, template, mode, visitor_id}
        ▼
 ┌──────────────┐
 │ /api/track   │ ──▶ Upstash Redis (counters only — no input text, no PII)
 └──────────────┘
```

- **Input text** lives only in: your browser tab → Vercel Function memory (seconds) → DeepSeek for processing.
  It is **never persisted** in our database. Closing the tab erases it from our side completely.
- **Analytics** (`/api/track`) records only event counts, template names, and a UUID-derived UV estimate (HyperLogLog). No input text or PII ever reaches Redis.
- **Formspree** only receives data when a user actively submits the Contact form.
- **Browser `localStorage`** holds preferences (anonymous UV id, last-template hint, dismissed banner timestamp, admin token on `/stats.html`). Never sent over network except `cd_vid` (one UUID → HyperLogLog).

### Compliance boundary (what `privacy.html` covers and doesn't)

| Covered | Not (yet) covered |
|---|---|
| Plain-English data inventory | Region-specific DPA boilerplate (e.g. GDPR Art. 30 register) |
| 18+ age policy aligned with `terms.html` | Verifiable parental consent flow (would require account system) |
| Data-deletion request via Contact form | Automated DSAR portal |
| Vendor list (DeepSeek/Vercel/Upstash/Formspree/CDNs) | DPAs signed with each vendor (operator responsibility) |

Before serving EU traffic at scale, run `privacy.html` through a counsel review (the same caveat as `terms.html`).

---

## ✉️ Formspree Setup (5 minutes)

The Contact form ships with a placeholder ID. **Until you replace it, the orange "⚠️ Owner: Replace YOUR_FORM_ID" banner is visible on the live site** so neither you nor a visitor can miss it. The banner auto-disappears as soon as you paste in a real ID.

### Step 1 — Sign up at formspree.io
Open [formspree.io](https://formspree.io) and click **Sign Up** (free plan = 50 submissions/month, plenty for a Beta feedback form). You can use any email.

### Step 2 — Verify your email
Click the verification link Formspree sends you. Forms won't deliver until your sending address is verified.

### Step 3 — Create a new form
In the Formspree dashboard click **+ New Form**, name it (e.g. `CraftDoc Contact`), set the destination email (where feedback should land), and click **Create Form**.

### Step 4 — Copy the form ID
Your form URL will look like `https://formspree.io/f/xpwqgvbl`. The piece after `/f/` (here: `xpwqgvbl`) is your **form ID**.

### Step 5 — Replace `YOUR_FORM_ID` in `index.html`
Open `index.html`, find:

```html
<form id="contact-form" class="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

Replace `YOUR_FORM_ID` with the ID from Step 4 (e.g. `xpwqgvbl`), commit & push. Vercel redeploys in ~30 s; the orange banner is gone, and the Contact form will start delivering messages to your inbox. **Send yourself a test message** to confirm the round trip.

---

## 🛡 Security Headers Cheatsheet

`vercel.json` now sets 6 headers on every response. Each one closes off a specific class of attack:

| Header | Value (short) | What it blocks |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Browser MIME sniffing → blocks "this `.txt` is actually JS" attacks. |
| `X-Frame-Options` | `DENY` | Anyone `<iframe>`-ing the site for clickjacking. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Stops leaking the full URL (including query strings) to outbound links. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for 1 year, even on first visit if preloaded. Submit at [hstspreload.org](https://hstspreload.org) after deploying. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()` | Pre-emptively refuses every sensitive browser API — we don't use any of them. |
| `Content-Security-Policy` | *(see below)* | Stops cross-site script injection — only listed origins can load JS/styles/etc. |

### CSP whitelist (audited against `index.html` + `stats.html` + `js/player.js`)

```
default-src   'self'
script-src    'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com
style-src     'self' 'unsafe-inline'
img-src       'self' data: https:
connect-src   'self' https://formspree.io
font-src      'self' data:
media-src     'self' https://cdn.pixabay.com
frame-ancestors 'none'
base-uri      'self'
object-src    'none'
form-action   'self' https://formspree.io
```

| Directive | Why these origins |
|---|---|
| `script-src` | `cdnjs.cloudflare.com` → html2canvas + jsPDF · `unpkg.com` → docx · `cdn.jsdelivr.net` → Chart.js (on `/stats.html`). `'unsafe-inline'` is required because `index.html` ships small inline `<script>` blocks (template-CSS holder, Formspree placeholder detector) and `stats.html` is a single-file dashboard. |
| `style-src` | `'unsafe-inline'` is required because both `index.html` and the legal pages use inline `style="…"` attributes for one-off layouts. |
| `connect-src` | `/api/*` fetches go to `'self'`. `formspree.io` is the only off-origin XHR (Contact form). DeepSeek is NOT here — it's called server-side from `/api/generate`, never from the browser. |
| `media-src` | Pixabay CDN serves the muted-by-default background music. Remove this line if you delete `js/player.js`. |
| `form-action` | The Contact form posts to Formspree; everything else posts back to our own API. |

> 🛠 **If you add a new CDN, you MUST extend the relevant `*-src` directive in `vercel.json` — otherwise the browser will silently block the asset and you'll see a white screen.** Open DevTools → Console to spot "Refused to load …" errors after deploying.

---

## 🤖 robots.txt & sitemap.xml

Two new SEO-friendly static files in the project root:

- **`robots.txt`** — allows all public pages, **blocks `/api/` and `/stats.html`** from being crawled. The stats dashboard is also `noindex,nofollow` via meta tag for belt-and-braces.
- **`sitemap.xml`** — lists the three indexable pages (`/`, `/legal/terms.html`, `/legal/privacy.html`) with sensible `priority` / `changefreq` values. Update the `<lastmod>` whenever you ship content changes.

After your first deploy, submit `https://effortlessdoc.com/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools** for faster indexing.
