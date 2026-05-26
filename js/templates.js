// CraftDoc v2 — Template Library (frontend metadata)
// The actual prompt strings live in api/generate.js (server-side, authoritative).
// This file describes how the four-level picker (Category → Document → Template → Content) works
// and which CSS class is used to render the output.

window.CRAFTDOC_TEMPLATES = {

  // ---------------- Category 1: Academic ----------------
  academic: {
    label: '🎓 Academic',
    color: '#1E3A8A',
    documents: [
      {
        id: 'essay',
        label: 'Essay',
        templates: [
          { id: 'essay_argumentative', label: 'Argumentative', desc: 'Classic five-paragraph debate-style essay.', css: 'doc-essay' },
          { id: 'essay_narrative',     label: 'Narrative',     desc: 'First-person story with reflection.',     css: 'doc-essay' },
          { id: 'essay_expository',    label: 'Expository',    desc: 'Neutral, fact-based explanation.',         css: 'doc-essay' }
        ]
      },
      {
        id: 'research_paper',
        label: 'Research Paper',
        templates: [
          { id: 'research_paper_standard', label: 'Standard',  desc: 'IMRaD-style research paper.',          css: 'doc-research' },
          { id: 'research_paper_apa',      label: 'APA 7th',   desc: 'Strict APA 7th edition formatting.',   css: 'doc-research' }
        ]
      },
      {
        id: 'book_report',
        label: 'Book Report',
        templates: [
          { id: 'book_report', label: 'Standard', desc: 'Plot, characters, themes, recommendation.', css: 'doc-report' }
        ]
      },
      {
        id: 'lab_report',
        label: 'Lab Report',
        templates: [
          { id: 'lab_report', label: 'IMRaD Lab Report', desc: 'Objective, hypothesis, method, results.', css: 'doc-report' }
        ]
      },
      {
        id: 'application_essay',
        label: 'College Application Essay',
        templates: [
          { id: 'college_application_essay', label: 'Common App 650 words', desc: 'Personal-anecdote-driven admissions essay.', css: 'doc-essay' }
        ]
      },
      {
        id: 'personal_statement',
        label: 'Personal Statement',
        templates: [
          { id: 'personal_statement', label: 'Graduate School', desc: 'One-page motivation + experience + goals.', css: 'doc-essay' }
        ]
      },
      {
        id: 'compare_contrast',
        label: 'Compare & Contrast Essay',
        templates: [
          { id: 'compare_contrast_essay', label: 'Point-by-point', desc: 'Side-by-side criterion comparison.', css: 'doc-essay' }
        ]
      }
    ]
  },

  // ---------------- Category 2: Career ----------------
  career: {
    label: '📄 Career',
    color: '#1E3A8A',
    documents: [
      {
        id: 'resume',
        label: 'Resume',
        templates: [
          { id: 'resume_modern',       label: 'Modern',       desc: 'Left dark sidebar, clean sans-serif.',         css: 'doc-resume-modern' },
          { id: 'resume_classic',      label: 'Classic',      desc: 'Centered name, traditional sections.',          css: 'doc-resume-classic' },
          { id: 'resume_minimalist',   label: 'Minimalist',   desc: 'Huge whitespace, punchy bullets.',              css: 'doc-resume-minimalist' },
          { id: 'resume_technical',    label: 'Technical',    desc: 'Black / green terminal feel, skill matrix.',    css: 'doc-resume-technical' },
          { id: 'resume_executive',    label: 'Executive',    desc: 'Deep-red accents, big numbers, leadership.',    css: 'doc-resume-executive' },
          { id: 'resume_creative',     label: 'Creative',     desc: 'Colour blocks, designer / marketer friendly.',  css: 'doc-resume-creative' },
          { id: 'resume_academic_cv',  label: 'Academic CV',  desc: 'Multi-section CV with publications.',           css: 'doc-resume-academic' },
          { id: 'resume_entry_level',  label: 'Entry Level',  desc: 'New-grad / intern friendly layout.',            css: 'doc-resume-entry' }
        ]
      },
      {
        id: 'cover_letter',
        label: 'Cover Letter',
        templates: [
          { id: 'cover_letter_professional', label: 'Professional', desc: 'Formal 3-4 paragraph letter.',          css: 'doc-letter' },
          { id: 'cover_letter_friendly',     label: 'Friendly',     desc: 'Warm, story-driven tone.',              css: 'doc-letter' },
          { id: 'cover_letter_direct',       label: 'Direct',       desc: 'Short and bullet-scannable (<200 wd).', css: 'doc-letter' }
        ]
      },
      {
        id: 'linkedin',
        label: 'LinkedIn',
        templates: [
          { id: 'linkedin_bio', label: 'LinkedIn About', desc: '250-400 word personal-brand bio.', css: 'doc-essay' }
        ]
      }
    ]
  },

  // ---------------- Category 3: Business ----------------
  business: {
    label: '📊 Business',
    color: '#1E3A8A',
    documents: [
      {
        id: 'proposal',
        label: 'Business Proposal',
        templates: [
          { id: 'business_proposal_startup',   label: 'Startup Pitch (YC)', desc: 'Data-driven YC-style pitch deck text.',  css: 'doc-proposal' },
          { id: 'business_proposal_corporate', label: 'Corporate B2B',      desc: 'Formal enterprise RFP-style proposal.',   css: 'doc-proposal' },
          { id: 'business_proposal_tech',      label: 'Technical Project',  desc: 'Architecture & implementation focused.',  css: 'doc-proposal' }
        ]
      },
      {
        id: 'email',
        label: 'Business Email',
        templates: [
          { id: 'business_email_cold',     label: 'Cold Outreach', desc: 'Under-150-word personalised sales email.', css: 'doc-email' },
          { id: 'business_email_followup', label: 'Follow-up',     desc: 'Polite nudge with new value-add.',         css: 'doc-email' },
          { id: 'business_email_apology',  label: 'Apology',       desc: 'Sincere customer-success apology.',        css: 'doc-email' }
        ]
      },
      {
        id: 'minutes',
        label: 'Meeting Minutes',
        templates: [
          { id: 'meeting_minutes', label: 'Standard Minutes', desc: 'Decisions + action items + owners.', css: 'doc-report' }
        ]
      },
      {
        id: 'press',
        label: 'Press Release',
        templates: [
          { id: 'press_release', label: 'AP Format', desc: 'Newsroom-ready release with quotes.', css: 'doc-report' }
        ]
      }
    ]
  }
};

// Quick lookup: templateId -> { docType, css, label }
window.CRAFTDOC_TEMPLATE_INDEX = (function () {
  const idx = {};
  for (const catKey of Object.keys(window.CRAFTDOC_TEMPLATES)) {
    const cat = window.CRAFTDOC_TEMPLATES[catKey];
    for (const doc of cat.documents) {
      for (const tpl of doc.templates) {
        idx[tpl.id] = { docType: catKey, css: tpl.css, label: tpl.label, docLabel: doc.label };
      }
    }
  }
  return idx;
})();
