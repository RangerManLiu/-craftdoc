# 反馈表单 Plan A 实施方案

## 1. 现状诊断

### 反馈按钮位置
- **文件：** `index.html` 第 233 行
- **元素：** `<form id="contact-form" class="contact-form" method="POST" action="https://api.web3forms.com/submit">`
- **当前实现：** 已接入 [Web3Forms](https://api.web3forms.com/submit)，配置了隐藏字段 `<input type="hidden" name="access_key" value="eab10ecc-f167-4985-8d66-524ced27ce17">`
- **表单项：** Name（必填）、Email（可选）、Message（必填）
- **前端提交逻辑：** `js/app.js` 第 221~248 行的 `handleContactSubmit()` 函数，使用 `fetch` POST JSON 到 `https://api.web3forms.com/submit`
- **隐藏占位横幅：** `index.html` 第 230 行，检测 `YOUR_FORM_ID` 占位符并自动隐藏/显示（当前已配好 Web3Forms，不会显示）

### 仓库特征
- **类型：** 静态 HTML + Vercel Serverless Functions（API Routes）
- **No package.json** — 三个 API 文件（`api/generate.js`、`api/stats.js`、`api/track.js`）使用 Node.js 原生 `fetch` + `crypto`，无外部 npm 依赖
- **框架：** 原生 HTML/CSS/JS，无前端框架

### 部署平台
- **平台：** Vercel — ✅ 确认
- **依据：**
  - `vercel.json` 存在且包含 V2 安全头配置
  - 三个 `/api/*` 文件使用 ESM `export default async function handler(req, res)` 语法
  - CSP 中包含 form-action 和 connect-src 指令
- **已绑定环境变量（推测）：** `DEEPSEEK_API_KEY`、`STATS_PASSWORD`、`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`

## 2. Plan A 目标

当前反馈通过 Web3Forms 发送到开心爸邮箱。Plan A 的目标是：

> **反馈按钮点击 → POST `/api/contact` → Resend API → 开心爸 outlook 收到工单**

将 Web3Forms 替换为自建的 `/api/contact` Vercel Serverless Function，通过 Resend 发邮件，实现：
- **零第三方表单服务依赖**（自控数据流）
- **收件地址可控**（代码里写死开心爸 outlook）
- **Resend 免费额度 3000 封/月完全够用**

## 3. 实施步骤（待 #004 执行）

### 3.1 后端 API
- **路径：** `api/contact.js`（与其他三个 API 文件同级）
- **依赖：** 需 `npm init -y && npm install resend`（引入 package.json）
- **接收字段：** `{ name, email, message }`
- **调用 Resend：** 发送到 `Lx18639573519@outlook.com`，回复邮箱取 `email` 字段
- **返回：** 200 `{ success: true }` / 4xx `{ error: "..." }` / 5xx `{ error: "Internal error" }`
- **模式：** 沿用 `api/generate.js` 的 Vercel handler 模式

### 3.2 前端改造
- `index.html` 第 233 行：`action` 从 `https://api.web3forms.com/submit` 改为 `/api/contact`
- `index.html` 第 234 行：移除隐藏的 `access_key` 字段
- `js/app.js` 第 221~248 行：基本不用改（已经是 `fetch POST JSON`，API 地址随 form action 自动变化）
- **CSP 调整（vercel.json）：** connect-src 和 form-action 中的 `https://formspree.io` 移除

### 3.3 凭证流
- **Resend API Key：** 开心爸在 [resend.com](https://resend.com) 注册获取
  - ✅ `resend.com` 和 `api.resend.com` 本地均可访问（HTTP 200）
  - 注册用 outlook 邮箱收验证邮件（`Lx18639573519@outlook.com`）
  - 获取 API Key 后写入 Vercel 环境变量 `RESEND_API_KEY`
- **SOP：** 同 pat.txt，PowerShell 读本地文件，不写进代码、不 push GitHub

### 3.4 部署 & 域名
- **部署平台：** Vercel — ✅
- **环境变量位置：** Vercel Dashboard → Project → Settings → Environment Variables
- **DKIM：** 先用 `resend.dev` 默认域名（无需 DNS 配置），稳定后再考虑配置 `effortlessdoc.com` DKIM

## 4. 风险点

| 风险 | 状态 | 说明 |
|------|------|------|
| Resend 可访问性 | ✅ 正常 | resend.com / api.resend.com 均返回 HTTP 200 |
| Resend 免费额度 | ✅ 够用 | 3000 封/月 |
| DKIM 配置门槛 | ⚠️ 待定 | 先用 resend.dev 默认域名无需 DKIM |
| 现有 Web3Forms 已可用 | ⚠️ 是否改 | 当前正常工作，改动是自建替代第三方 |
| npm 包引入 | ⚠️ 需注意 | 仓库当前零依赖，引入后 Vercel 自动 `npm install` |
| CSP 调整 | ⚠️ 需改 | form-action 和 connect-src 需移除 formspree.io |

## 5. 待评审决策点
1. ✅ 部署平台已确认：Vercel
2. ❓ Resend 注册由谁来做？开心爸自己注册（用 outlook 收验证邮件）
3. ❓ 是否先做最简 MVP（后端先 console.log 不通 Resend）？建议可以先通链路再加 Resend
4. ❓ 是否保留 Web3Forms 作兜底？建议稳定 1-2 周后移除
5. ❓ DKIM 策略：先用 `resend.dev` 默认域名试水
