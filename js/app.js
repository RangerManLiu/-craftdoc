// CraftDoc v2 — Main App Logic
// Handles the four-level picker (Category → Document → Template → Content), AI calls (generate / polish / format),
// and rendering the output into a styled, ATS-friendly card.

(function () {
  const TEMPLATES = window.CRAFTDOC_TEMPLATES;
  const INDEX = window.CRAFTDOC_TEMPLATE_INDEX;

  const state = {
    category: null,   // e.g. 'academic'
    document: null,   // e.g. 'essay'
    template: null,   // e.g. 'essay_argumentative'
    lastOutput: '',
    busy: false
  };

  // ---- DOM helpers ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function el(tag, opts = {}, children = []) {
    const n = document.createElement(tag);
    if (opts.class) n.className = opts.class;
    if (opts.text) n.textContent = opts.text;
    if (opts.html) n.innerHTML = opts.html;
    if (opts.attrs) for (const k of Object.keys(opts.attrs)) n.setAttribute(k, opts.attrs[k]);
    if (opts.onclick) n.addEventListener('click', opts.onclick);
    for (const c of children) if (c) n.appendChild(c);
    return n;
  }

  // ---- Step renderers ----
  function renderStep1() {
    const wrap = $('#step1-options');
    wrap.innerHTML = '';
    for (const key of Object.keys(TEMPLATES)) {
      const cat = TEMPLATES[key];
      const card = el('button', {
        class: 'pick-card big-card' + (state.category === key ? ' active' : ''),
        text: cat.label,
        attrs: { type: 'button' },
        onclick: () => {
          state.category = key;
          state.document = null;
          state.template = null;
          renderStep1();
          renderStep2();
          renderStep3();
          updateGenerateState();
        }
      });
      wrap.appendChild(card);
    }
  }

  function renderStep2() {
    const step = $('#step2');
    const wrap = $('#step2-options');
    wrap.innerHTML = '';
    if (!state.category) {
      step.classList.add('disabled');
      return;
    }
    step.classList.remove('disabled');
    const docs = TEMPLATES[state.category].documents;
    for (const doc of docs) {
      const card = el('button', {
        class: 'pick-card' + (state.document === doc.id ? ' active' : ''),
        text: doc.label,
        attrs: { type: 'button' },
        onclick: () => {
          state.document = doc.id;
          state.template = null;
          renderStep2();
          renderStep3();
          updateGenerateState();
        }
      });
      wrap.appendChild(card);
    }
  }

  function renderStep3() {
    const step = $('#step3');
    const wrap = $('#step3-options');
    wrap.innerHTML = '';
    if (!state.category || !state.document) {
      step.classList.add('disabled');
      return;
    }
    step.classList.remove('disabled');
    const doc = TEMPLATES[state.category].documents.find(d => d.id === state.document);
    if (!doc) return;
    // Auto-select if only one template
    if (doc.templates.length === 1 && !state.template) {
      state.template = doc.templates[0].id;
    }
    for (const tpl of doc.templates) {
      const card = el('button', {
        class: 'pick-card template-card' + (state.template === tpl.id ? ' active' : ''),
        attrs: { type: 'button' },
        onclick: () => {
          state.template = tpl.id;
          renderStep3();
          updateGenerateState();
        }
      });
      card.appendChild(el('div', { class: 'tpl-title', text: tpl.label }));
      card.appendChild(el('div', { class: 'tpl-desc', text: tpl.desc }));
      wrap.appendChild(card);
    }
  }

  function updateGenerateState() {
    const ready = !!(state.category && state.document && state.template);
    $('#btn-generate').disabled = !ready || state.busy;
    // Polish & Copy require existing output
    const hasOutput = !!state.lastOutput.trim();
    $('#btn-polish').disabled = !hasOutput || state.busy;
    const copyBtn = $('#btn-copy');
    if (copyBtn) copyBtn.disabled = !hasOutput || state.busy;
    $('#btn-download-pdf').disabled = !hasOutput;
    $('#btn-download-word').disabled = !hasOutput;
  }

  // ---- AI call ----
  async function callAI(mode) {
    const content = mode === 'generate'
      ? $('#user-input').value.trim()
      : state.lastOutput.trim();

    if (mode === 'generate' && content.length < 10) {
      showToast('Please paste at least 10 characters of input.', 'warn');
      return;
    }
    if (!state.template) {
      showToast('Please pick a template first.', 'warn');
      return;
    }

    state.busy = true;
    updateGenerateState();
    setLoading(true, mode);

    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: state.category,
          template: state.template,
          mode,
          content
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Request failed');
      }
      state.lastOutput = data.content;
      renderOutput();
      showToast(
        mode === 'generate' ? '✨ Document generated!' :
        mode === 'polish'   ? '✨ Polished & corrected!' :
                              '📐 Reformatted!',
        'ok'
      );
      // smooth scroll to output
      setTimeout(() => $('#output-section').scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      showToast('⚠ ' + err.message, 'err');
    } finally {
      state.busy = false;
      setLoading(false, mode);
      updateGenerateState();
    }
  }

  function renderOutput() {
    const out = $('#output-card');
    out.className = 'output-card'; // reset
    const cssClass = INDEX[state.template]?.css || 'doc-essay';
    out.classList.add(cssClass);
    // Escape HTML and preserve line breaks
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    out.innerHTML = '<pre>' + esc(state.lastOutput) + '</pre>' +
      '<div class="watermark">Generated by CraftDoc · effortlessdoc.com</div>';
    $('#output-section').classList.remove('hidden');
  }

  function setLoading(on, mode) {
    const map = { generate: '#btn-generate', polish: '#btn-polish', format: '#btn-format' };
    const btn = $(map[mode]);
    if (!btn) return;
    if (on) {
      btn.dataset.label = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> Working…';
    } else if (btn.dataset.label) {
      btn.innerHTML = btn.dataset.label;
    }
  }

  // ---- Toast ----
  function showToast(msg, kind = 'ok') {
    let t = $('#toast');
    if (!t) {
      t = el('div', { attrs: { id: 'toast' } });
      document.body.appendChild(t);
    }
    t.className = 'toast toast-' + kind + ' show';
    t.textContent = msg;
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), 3500);
  }

  // ---- Formspree submit (Contact) ----
  async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const status = $('#contact-status');
    status.textContent = 'Sending…';
    status.className = 'contact-status';
    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if (resp.ok) {
        status.textContent = "Thanks! We'll get back to you within 24 hours.";
        status.classList.add('ok');
        form.reset();
      } else {
        status.textContent = "Submission failed. Please try again.";
        status.classList.add('err');
      }
    } catch (err) {
      status.textContent = "Network error. Please try again.";
      status.classList.add('err');
    }
  }

  // ---- Reset menu ----
  function performReset(scope) {
    if (scope === 'input' || scope === 'all') {
      $('#user-input').value = '';
      // refresh counter
      const counter = $('#input-counter');
      if (counter) counter.textContent = '0 / 8000';
    }
    if (scope === 'output' || scope === 'all') {
      state.lastOutput = '';
      $('#output-card').innerHTML = '';
      $('#output-section').classList.add('hidden');
    }
    if (scope === 'all') {
      state.category = null;
      state.document = null;
      state.template = null;
      renderStep1();
      renderStep2();
      renderStep3();
    }
    updateGenerateState();
    showToast(
      scope === 'input'  ? 'Input cleared.' :
      scope === 'output' ? 'Generated document cleared.' :
                           'Everything cleared. Start fresh!',
      'ok'
    );
  }

  function setupResetMenu() {
    const btn  = $('#btn-reset');
    const menu = $('#reset-menu');
    if (!btn || !menu) return;

    const wrap = btn.closest('.reset-wrap') || btn.parentElement;
    let closeTimer = null;

    const openMenu  = () => { clearTimeout(closeTimer); menu.hidden = false; };
    const closeMenu = () => { menu.hidden = true; };
    const scheduleClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(closeMenu, 300); // 300ms grace period
    };

    // Hover open (desktop) — opens on button hover, stays open over menu
    if (wrap) {
      wrap.addEventListener('mouseenter', openMenu);
      wrap.addEventListener('mouseleave', scheduleClose);
    }
    menu.addEventListener('mouseenter', openMenu);
    menu.addEventListener('mouseleave', scheduleClose);

    // Click toggle (works for touch/mobile and explicit clicks)
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(closeTimer);
      menu.hidden = !menu.hidden;
    });

    // Prevent menu clicks from bubbling to document handler
    menu.addEventListener('click', (e) => { e.stopPropagation(); });

    // Handle option clicks
    menu.querySelectorAll('button[data-reset]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(closeTimer);
        menu.hidden = true;
        performReset(b.getAttribute('data-reset'));
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (menu.hidden) return;
      if (btn.contains(e.target) || menu.contains(e.target)) return;
      clearTimeout(closeTimer);
      menu.hidden = true;
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearTimeout(closeTimer);
        menu.hidden = true;
      }
    });
  }

  // ---- Copy all (solves the alt+A select-all issue) ----
  function setupCopyAll() {
    const btn = $('#btn-copy');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!state.lastOutput.trim()) return;
      try {
        await navigator.clipboard.writeText(state.lastOutput);
        showToast('📋 Full document copied to clipboard!', 'ok');
      } catch (err) {
        // Fallback for older browsers / non-https
        const ta = document.createElement('textarea');
        ta.value = state.lastOutput;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('📋 Copied!', 'ok'); }
        catch { showToast('⚠ Copy failed — please select manually.', 'err'); }
        document.body.removeChild(ta);
      }
    });
  }

  // ---- AI disclaimer banner dismiss (remembers user choice for 7 days) ----
  function setupDisclaimerBanner() {
    const banner = $('#ai-disclaimer-banner');
    const close  = $('#aidb-close');
    if (!banner || !close) return;
    try {
      const until = parseInt(localStorage.getItem('cd_aidb_dismiss_until') || '0', 10);
      if (until > Date.now()) banner.style.display = 'none';
    } catch {}
    close.addEventListener('click', () => {
      banner.style.display = 'none';
      try {
        localStorage.setItem('cd_aidb_dismiss_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      } catch {}
    });
  }

  // ---- High-risk template second-confirmation (extra verification reminder for high-stakes docs) ----
  const HIGH_RISK_TEMPLATES = new Set([
    'business_proposal_startup',
    'business_proposal_corporate',
    'business_proposal_tech',
    'press_release',
    'cover_letter_professional',
    'cover_letter_friendly',
    'cover_letter_direct',
    'research_paper_standard',
    'research_paper_apa',
    'lab_report'
  ]);

  function showHighRiskWarning() {
    // Lightweight inline banner above the output, no modal interruption
    let bar = $('#high-risk-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'high-risk-bar';
      bar.className = 'high-risk-bar';
      bar.innerHTML =
        '🚨 <strong>High-stakes document detected.</strong> ' +
        'This document type is commonly used for job applications, official PR, academic submission, or investor pitches. ' +
        '<strong>You are legally responsible for every claim, citation, and number it contains.</strong> ' +
        'Verify all facts against primary sources before sending.';
      const out = $('#output-section');
      out.insertBefore(bar, out.querySelector('.output-card'));
    }
    bar.style.display = '';
  }
  function hideHighRiskWarning() {
    const bar = $('#high-risk-bar');
    if (bar) bar.style.display = 'none';
  }

  // ---- Lightweight template usage analytics (localStorage only, no server) ----
  function trackTemplateUse(template, mode) {
    try {
      const raw = localStorage.getItem('cd_template_stats') || '{}';
      const stats = JSON.parse(raw);
      const key = `${template}::${mode}`;
      stats[key] = (stats[key] || 0) + 1;
      stats._lastUse = { template, mode, at: Date.now() };
      localStorage.setItem('cd_template_stats', JSON.stringify(stats));
    } catch {}
  }

  // ---- Remember-last-template prompt ("continue where you left off?") ----
  function setupLastTemplateResume() {
    try {
      const raw = localStorage.getItem('cd_template_stats');
      if (!raw) return;
      const stats = JSON.parse(raw);
      const last = stats._lastUse;
      if (!last || !last.template) return;

      const info = INDEX[last.template];
      if (!info) return;

      // Avoid annoying repeats: only prompt if last use was 1 hour - 30 days ago
      const ageMs = Date.now() - (last.at || 0);
      if (ageMs < 60 * 60 * 1000 || ageMs > 30 * 24 * 60 * 60 * 1000) return;

      const dlg = document.createElement('div');
      dlg.className = 'resume-dialog';
      dlg.innerHTML = `
        <div class="resume-card">
          <h4>👋 Welcome back!</h4>
          <p>Last time you used <strong>${escapeHtml(info.label || last.template)}</strong>.</p>
          <p style="opacity:0.8;font-size:13px;">Continue with this template, or start fresh?</p>
          <div class="resume-actions">
            <button class="btn btn-primary" data-resume="yes">Continue with ${escapeHtml(info.label || 'last template')}</button>
            <button class="btn btn-tertiary" data-resume="no">Start fresh</button>
          </div>
        </div>`;
      document.body.appendChild(dlg);

      dlg.querySelector('[data-resume="yes"]').addEventListener('click', () => {
        // Restore selection by walking the templates tree to find category/document
        for (const catKey of Object.keys(TEMPLATES)) {
          const cat = TEMPLATES[catKey];
          for (const doc of cat.documents) {
            const tpl = doc.templates.find(t => t.id === last.template);
            if (tpl) {
              state.category = catKey;
              state.document = doc.id;
              state.template = tpl.id;
              renderStep1();
              renderStep2();
              renderStep3();
              updateGenerateState();
              setTimeout(() => $('#step4').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              break;
            }
          }
        }
        dlg.remove();
      });
      dlg.querySelector('[data-resume="no"]').addEventListener('click', () => dlg.remove());
    } catch {}
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---- Init ----
  function init() {
    renderStep1();
    renderStep2();
    renderStep3();
    updateGenerateState();

    $('#btn-generate').addEventListener('click', async () => {
      hideHighRiskWarning();
      await callAI('generate');
      if (state.lastOutput && HIGH_RISK_TEMPLATES.has(state.template)) showHighRiskWarning();
      if (state.lastOutput) trackTemplateUse(state.template, 'generate');
    });
    $('#btn-polish').addEventListener('click', async () => {
      await callAI('polish');
      if (state.lastOutput) trackTemplateUse(state.template, 'polish');
    });

    setupResetMenu();
    setupCopyAll();
    setupDisclaimerBanner();

    $('#btn-download-pdf').addEventListener('click',  () => {
      window.CraftDocExporter.toPDF(state.lastOutput, state.template);
      trackTemplateUse(state.template, 'pdf');
    });
    $('#btn-download-word').addEventListener('click', () => {
      window.CraftDocExporter.toWord(state.lastOutput, state.template);
      trackTemplateUse(state.template, 'word');
    });

    // "Help us decide" button scrolls to contact
    const helpBtn = $('#btn-help-decide');
    if (helpBtn) helpBtn.addEventListener('click', () => $('#contact').scrollIntoView({ behavior: 'smooth' }));

    // Contact form
    const cf = $('#contact-form');
    if (cf) cf.addEventListener('submit', handleContactSubmit);

    // Smooth-scroll nav
    $$('.nav-link').forEach(a => a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const t = document.querySelector(href);
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      }
    }));

    // Char counter
    const inp = $('#user-input');
    const counter = $('#input-counter');
    if (inp && counter) {
      const upd = () => { counter.textContent = inp.value.length + ' / 8000'; };
      inp.addEventListener('input', upd);
      upd();
    }

    // Constrain Ctrl/Cmd+A to the textarea or output card when focused inside them
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key ==