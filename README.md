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
