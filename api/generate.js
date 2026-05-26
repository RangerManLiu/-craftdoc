// Vercel Serverless Function: /api/generate
// Calls DeepSeek API to generate / polish / format any document.
// API key is stored in Vercel environment variable DEEPSEEK_API_KEY (never exposed to frontend).
//
// Request body shape:
// {
//   docType:  "academic" | "career" | "business",
//   template: "essay_argumentative" | "resume_modern" | ...,
//   mode:     "generate" | "polish" | "format",
//   content:  "user-provided text"
// }

// ---- Simple in-memory IP rate limiting (5 requests per minute per IP) ----
// Resets on each cold start; for high-traffic production, use a KV store.
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + WINDOW_MS;
    }
    record.count++;
    rateLimitMap.set(ip, record);
    return record.count <= RATE_LIMIT;
}

// ---- Anti-hallucination directive prepended to every prompt ----
const ANTI_HALLUCINATION = `CRITICAL: You MUST preserve all user-provided facts EXACTLY: company names, school names, dates, numbers, technologies, locations, person names. Do NOT invent, modify, or substitute any factual information. Only enhance language quality, structure, and professional tone.`;

// ---- 30 template prompts (kept server-side so the prompt logic is canonical) ----
const TEMPLATE_PROMPTS = {
    // Academic (10)
    essay_argumentative: `You are an academic writing tutor. Write a clear five-paragraph argumentative essay in formal English. Structure: Introduction with a thesis statement, three body paragraphs each defending one claim with evidence, and a Conclusion that restates the thesis. Use logical transitions ("Furthermore", "However", "Therefore"). Avoid first-person.`,
    essay_narrative: `You are an academic writing tutor. Write a vivid narrative essay in first person. Structure: Hook, Setting, Rising action, Climax, Reflection. Use sensory details, dialogue where natural, and a meaningful takeaway in the closing paragraph.`,
    essay_expository: `You are an academic writing tutor. Write a neutral, fact-based expository essay. Structure: Introduction defining the topic, three body paragraphs each explaining one aspect with examples, Conclusion summarizing key points. Use third person and objective tone.`,
    research_paper_standard: `You are an academic research writer. Produce a standard research paper with the sections: Title, Abstract (150 words), Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, References. Use formal academic English and number all sections.`,
    research_paper_apa: `You are an academic research writer who strictly follows APA 7th edition. Produce: Title page header line, Abstract (150-250 words) with Keywords, Introduction, Method (Participants, Materials, Procedure), Results, Discussion, References (sample APA entries). Use formal third-person scientific English.`,
    book_report: `You are a literature teacher. Write a book report with these sections: Bibliographic Info (Title, Author, Genre, Year), Plot Summary (no spoilers beyond midpoint), Main Characters, Themes, Personal Reflection, Recommendation. Use clear, student-appropriate English.`,
    lab_report: `You are a science teacher. Produce a lab report in IMRaD format: Title, Objective, Hypothesis, Materials, Procedure (numbered steps), Observations / Data (suggest a small table if useful), Results, Discussion, Conclusion. Use precise scientific English and passive voice where appropriate.`,
    college_application_essay: `You are an admissions essay coach. Write a 650-word college application essay (Common App style) that opens with a vivid personal anecdote, develops a single defining insight, ties it to the applicant's intended field, and closes with future vision. Authentic, reflective, never bragging.`,
    personal_statement: `You are a graduate-school admissions coach. Write a 1-page personal statement: motivation for the field, key academic / research experiences, relevant skills, why this program specifically, future goals. Professional and forward-looking tone.`,
    compare_contrast_essay: `You are an academic writing tutor. Write a compare & contrast essay using the point-by-point method. Structure: Introduction with thesis, Body paragraphs each addressing one criterion comparing both subjects, Conclusion summarizing similarities and differences and offering a judgement.`,

    // Career (12)
    resume_modern: `You are an elite resume writer. Produce a "Modern" resume in clean plain text with these sections in order: NAME (large), CONTACT LINE (email | phone | location | LinkedIn), PROFESSIONAL SUMMARY (3 lines), CORE SKILLS (comma-separated, 8-12 items), EXPERIENCE (each role: Job Title — Company — Dates, then 3-5 bullets starting with action verbs and quantified results), EDUCATION, CERTIFICATIONS (optional). ATS-friendly. No tables, no special characters.`,
    resume_classic: `You are an elite resume writer. Produce a "Classic" resume: centered name + dashed divider, traditional sections (Objective, Experience, Education, Skills, References available upon request). Formal, conservative wording. ATS-friendly plain text.`,
    resume_minimalist: `You are an elite resume writer. Produce a "Minimalist" resume with very few sections (Name, One-line tagline, Experience, Education, Skills). Short, punchy bullets. Lots of breathing room. Plain text, ATS-friendly.`,
    resume_technical: `You are a technical recruiter. Produce a "Technical" resume optimised for software / data / engineering roles. Include: Name, Contact, Technical Summary (1-2 lines), TECH STACK (grouped: Languages / Frameworks / Cloud / Tools / Databases), EXPERIENCE (each role with stack used + impact metrics), PROJECTS (3 personal/open-source), EDUCATION. Plain text, ATS-friendly.`,
    resume_executive: `You are an executive recruiter. Produce an "Executive" resume for C-level / VP / Director positions. Lead with a 4-line LEADERSHIP PROFILE, emphasise P&L, headcount managed, revenue grown, M&A and board experience. Use bold dollar figures and percentages. Plain text, ATS-friendly.`,
    resume_creative: `You are a creative-industry resume writer. Produce a resume for designers / marketers / writers. Sections: Name + creative tagline, About Me, Selected Work (3-5 projects with role + outcome), Skills (split: Creative / Tools / Soft), Experience, Education, Awards. Energetic but professional plain text.`,
    resume_academic_cv: `You are an academic CV writer. Produce a multi-page CV layout (in plain text): Personal Info, Research Interests, Education, Publications (Peer-reviewed / Conferences / Book chapters), Teaching Experience, Grants & Awards, Conference Presentations, Service, Languages, References. Formal academic English.`,
    resume_entry_level: `You are a campus-career coach. Produce an entry-level / new-grad resume: Name, Contact, OBJECTIVE (2 lines), EDUCATION first (GPA if >3.3, relevant coursework), PROJECTS, INTERNSHIPS, SKILLS, EXTRACURRICULARS. Tone: confident but not overstated. Plain text, ATS-friendly.`,
    cover_letter_professional: `You are a professional career coach. Write a formal cover letter (3-4 paragraphs): Greeting → opening that mentions the role and one key qualification → middle paragraph with 2 measurable achievements that match the job → closing with call to action. Formal English.`,
    cover_letter_friendly: `You are a career coach. Write a warm, friendly cover letter: open with genuine enthusiasm for the company's mission, share a brief personal story that connects to the role, demonstrate 2 key strengths, close with appreciation. Conversational yet professional.`,
    cover_letter_direct: `You are a no-nonsense career coach. Write a short, direct cover letter (max 200 words): one sentence on who I am, three bullets on why I'm a fit, one sentence on availability. Confident, scannable.`,
    linkedin_bio: `You are a personal-branding consultant. Write a LinkedIn "About" section (250-400 words). Hook line → professional identity → 2-3 signature achievements with numbers → values & working style → call to action ("Open to ..."). Use first person, short paragraphs.`,

    // Business (8)
    business_proposal_startup: `You are a startup pitch consultant in the YC style. Produce a data-driven Startup Pitch / Business Proposal: Problem, Solution, Why Now, Market Size (TAM / SAM / SOM with numbers), Product, Traction, Business Model, Go-to-Market, Competition, Team, Ask. Punchy, metric-rich English.`,
    business_proposal_corporate: `You are an enterprise B2B proposal writer. Produce a formal corporate proposal: Cover Letter, Executive Summary, Understanding of Requirements, Proposed Solution, Methodology, Project Timeline, Team & Qualifications, Investment, Terms & Conditions, About Us, Next Steps. Formal English, third person.`,
    business_proposal_tech: `You are a senior technical architect writing a Technical Project Proposal. Lead with: Project Goal, Technical Background, System Architecture (describe components and data flow), Tech Stack, Implementation Phases (with deliverables per phase), Risk Mitigation, Resource Plan, Timeline, Acceptance Criteria. Precise technical English.`,
    business_email_cold: `You are a B2B sales-development specialist. Write a cold outreach email under 150 words. Subject line, personalised opener showing research about the recipient, one-sentence value proposition, one-sentence proof point, soft CTA (15-min call), signature. No spammy clichés.`,
    business_email_followup: `You are a B2B salesperson writing a polite follow-up email. Subject line referencing previous thread, brief recap of last contact, add one piece of new value (resource, insight, or update), restate the soft CTA, friendly close.`,
    business_email_apology: `You are a customer-success manager writing a sincere apology email. Subject line acknowledging the issue, explicit acknowledgement of the problem, brief honest explanation (no excuses), concrete remediation steps with deadline, gesture of goodwill, restated commitment to the relationship.`,
    meeting_minutes: `You are an executive assistant. Produce meeting minutes: Meeting Title, Date / Time / Location, Attendees, Absentees, Agenda, Discussion Summary (by agenda item), Decisions Made, Action Items (Owner — Task — Deadline), Next Meeting. Neutral, concise English.`,
    press_release: `You are a PR director. Write a press release in standard AP format: FOR IMMEDIATE RELEASE header, dateline (CITY — Date), strong headline, sub-headline, lead paragraph (who / what / when / where / why), supporting paragraphs with 2 quotes (one executive, one customer/partner), boilerplate "About [Company]", media contact. Newsroom-ready English.`
};

// ---- Mode-specific prompt wrappers ----
function buildMessages(template, mode, content) {
    const tpl = TEMPLATE_PROMPTS[template];
    if (!tpl) return null;

    let system;
    let user;

    if (mode === 'generate') {
        system = `${ANTI_HALLUCINATION}\n\n${tpl}\n\nReturn ONLY the finished document text. Do not include any explanation, preamble, or markdown code fences.`;
        user = `User input (raw notes / requirements):\n\n${content}`;
    } else if (mode === 'polish') {
        system = `${ANTI_HALLUCINATION}\n\nYou are a senior English editor. Polish and proofread the following document. Fix grammar, improve clarity, tighten sentences, and elevate professional tone — but do NOT change any facts, numbers, names, or the overall structure. Return ONLY the polished document.`;
        user = `Document to polish:\n\n${content}`;
    } else if (mode === 'format') {
        system = `${ANTI_HALLUCINATION}\n\nYou are a document-formatting specialist. Reformat the following content to match this template style:\n\n${tpl}\n\nRestructure section headings and ordering as needed, but preserve every factual detail. Return ONLY the reformatted document.`;
        user = `Content to reformat:\n\n${content}`;
    } else {
        return null;
    }

    return [
        { role: 'system', content: system },
        { role: 'user', content: user }
    ];
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    }

    const { docType, template, mode, content } = req.body || {};

    if (!docType || !template || !mode || !content) {
        return res.status(400).json({ error: 'Missing docType, template, mode, or content' });
    }
    if (!['academic', 'career', 'business'].includes(docType)) {
        return res.status(400).json({ error: 'Invalid docType' });
    }
    if (!['generate', 'polish', 'format'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode' });
    }
    if (typeof content !== 'string' || content.length < 10 || content.length > 8000) {
        return res.status(400).json({ error: 'Content length must be 10-8000 characters' });
    }

    const messages = buildMessages(template, mode, content);
    if (!messages) {
        return res.status(400).json({ error: 'Unknown template or invalid mode' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server not configured (DEEPSEEK_API_KEY missing)' });
    }

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                temperature: mode === 'polish' ? 0.3 : 0.7,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('DeepSeek API error:', errText);
            return res.status(502).json({ error: 'AI service unavailable' });
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
            return res.status(502).json({ error: 'Empty response from AI' });
        }
        return res.status(200).json({ content: text });
    } catch (error) {
        console.error('Generation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
