// ==UserScript==
// @name         IG Web DM Buttons
// @namespace    https://github.com/francozanardi/ig-web-dm-buttons
// @homepageURL  https://github.com/francozanardi/ig-web-dm-buttons
// @updateURL    https://raw.githubusercontent.com/francozanardi/ig-web-dm-buttons/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/francozanardi/ig-web-dm-buttons/main/script.user.js
// @version      1.0.0
// @description  Renders the buttons of ManyChat-style (XMA / generic template) Instagram DMs that instagram.com doesn't show.
// @match        https://www.instagram.com/*
// @run-at       document-idle
// @grant        none
// @inject-into  page
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  if (window.__xmaFixObserver) window.__xmaFixObserver.disconnect();

  const fiberOf = el => {
    const k = Object.keys(el).find(k => k.startsWith('__reactFiber'));
    return k && el[k];
  };

  const findEnv = () => {
    const starts = [
      document.querySelector('[contenteditable="true"]'),
      ...document.querySelectorAll('[role="main"] *'),
    ];
    for (const el of starts) {
      if (!el) continue;
      for (let f = fiberOf(el); f; f = f.return) {
        const v = f.memoizedProps?.value;
        if (v?.environment?.getStore) return v.environment;
        if (v?.getStore) return v;
      }
    }
  };

  const sendPostback = (env, threadId, payload, title, btn) => {
    const req = window.require;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const ctx = req('createIGDMessageSendContext')(env);
      req('CometRelay').commitMutation(env, {
        mutation: req('IGDGenericTemplatePostbackCTAButtonOffMsysMutation.graphql'),
        variables: {
          input: {
            ig_thread_igid: threadId,
            offline_threading_id: ctx.offlineThreadingId,
            postback_payload: { sensitive_string_value: payload },
            text: { sensitive_string_value: title },
          },
        },
        onCompleted: (_, errs) => {
          btn.textContent = errs?.length ? '❌ Error' : '✅ Sent';
        },
        onError: e => {
          console.error('[ig-web-dm-buttons]', e);
          btn.textContent = '❌ Error';
          btn.disabled = false;
        },
      });
    } catch (e) {
      console.error('[ig-web-dm-buttons] Instagram internals changed?', e);
      btn.textContent = '❌ Error';
      btn.disabled = false;
    }
  };

  const style =
    'display:block;width:100%;padding:6px 10px;border:0;border-radius:10px;' +
    'background:#3797f0;color:#fff;font:600 14px system-ui;text-align:center;' +
    'text-decoration:none;cursor:pointer';

  const paint = () => {
    if (!location.pathname.startsWith('/direct')) return;
    if (typeof window.require !== 'function') return;

    const env = findEnv();
    if (!env) return;
    const src = env.getStore().getSource();
    const done = new Set();

    for (const el of document.querySelectorAll('[role="main"] div, [role="main"] span')) {
      if (el.childElementCount || !el.textContent.trim()) continue;

      let xmaId = null;
      let threadRef = null;
      let f = fiberOf(el);
      for (let d = 0; f && d < 15; f = f.return, d++) {
        const p = f.memoizedProps;
        if (!p || typeof p !== 'object') continue;
        if (!xmaId && p.standardXMARef?.__id) xmaId = p.standardXMARef.__id;
        if (!threadRef && p.viewerThreadRef?.__id) threadRef = p.viewerThreadRef.__id;
      }
      if (!xmaId || done.has(xmaId)) continue;
      done.add(xmaId);

      const host = el.parentElement;
      if (!host || host.querySelector('.xma-fix')) continue;

      const x = src.get(xmaId);
      const btns = (x?.cta_buttons?.__refs || []).map(r => src.get(r)).filter(Boolean);
      if (!btns.length) continue;

      const threadId = threadRef && src.get(threadRef)?.thread_id;
      const box = Object.assign(document.createElement('div'), { className: 'xma-fix' });
      box.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:6px';

      for (const b of btns) {
        const title = b.title || 'Open';
        if (b.action_url) {
          const a = Object.assign(document.createElement('a'), {
            href: b.action_url,
            target: '_blank',
            rel: 'noopener noreferrer',
            textContent: '🔗 ' + title,
          });
          a.style.cssText = style;
          box.appendChild(a);
        } else if (b.cta_type === 'postback' && b.postback_payload && threadId) {
          const btn = Object.assign(document.createElement('button'), {
            textContent: '↩️ ' + title,
          });
          btn.style.cssText = style;
          btn.onclick = e => {
            e.preventDefault();
            e.stopPropagation();
            sendPostback(env, threadId, b.postback_payload, title, btn);
          };
          box.appendChild(btn);
        }
      }

      if (box.childElementCount) host.appendChild(box);
    }
  };

  let t;
  window.__xmaFixObserver = new MutationObserver(() => {
    clearTimeout(t);
    t = setTimeout(paint, 300);
  });
  window.__xmaFixObserver.observe(document.body, { childList: true, subtree: true });
  paint();
})();
