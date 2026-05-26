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
    // Polish & Format require existing output
    const hasOutput = !!state.lastOutput.trim();
    $('#btn-polish').disabled = !hasOutput || state.busy;
    $('#btn-format').disabled = !hasOutput || !ready || state.busy;
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

  // ---- Init ----
  function init() {
    renderStep1();
    renderStep2();
    renderStep3();
    updateGenerateState();

    $('#btn-generate').addEventListener('click', () => callAI('generate'));
    $('#btn-polish').addEventListener('click',   () => callAI('polish'));
    $('#btn-format').addEventListener('click',   () => callAI('format'));

    $('#btn-download-pdf').addEventListener('click',  () => window.CraftDocExporter.toPDF(state.lastOutput, state.template));
    $('#btn-download-word').addEventListener('click', () => window.CraftDocExporter.toWord(state.lastOutput, state.template));

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
