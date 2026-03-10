/* AdvaySnapTik — app.js v1.2.0 */
(function () {
  'use strict';

  const SMARTLINK = 'https://millionairelucidlytransmitted.com/a887cntvrw?key=60d7383632c2b38d2124d7e205af8a2e';

  let data = null, defer = null;
  const $ = id => document.getElementById(id);

  // ── Dynamic year ─────────────────────────────────────────────────────────────
  const yrEl = $('yr');
  if (yrEl) yrEl.textContent = new Date().getFullYear();

  // ── Theme ─────────────────────────────────────────────────────────────────────
  const btnThm = $('btn-theme');
  function applyTheme(t) {
    document.documentElement.className = t;
    btnThm.textContent = t === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('ast-theme', t);
  }
  btnThm.addEventListener('click', () =>
    applyTheme(document.documentElement.className === 'dark' ? 'light' : 'dark')
  );
  btnThm.textContent = document.documentElement.className === 'dark' ? '☀️' : '🌙';

  // ── PWA install banner ────────────────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); defer = e; $('ibanner').classList.add('show');
  });
  $('btn-install').addEventListener('click', async () => {
    if (!defer) return;
    defer.prompt();
    const { outcome } = await defer.userChoice;
    if (outcome === 'accepted') $('ibanner').style.display = 'none';
    defer = null;
  });
  $('btn-dismiss').addEventListener('click', () => { $('ibanner').style.display = 'none'; });

  // ── Hamburger ─────────────────────────────────────────────────────────────────
  $('hamburger').addEventListener('click', function () {
    const l = $('navlinks'), o = l.classList.toggle('open');
    this.setAttribute('aria-expanded', o);
  });

  // ── URL params (share target) ─────────────────────────────────────────────────
  (function () {
    const p = new URLSearchParams(location.search);
    const u = p.get('url');
    if (u) { $('uin').value = u; go(); }
  })();

  // ── Paste ─────────────────────────────────────────────────────────────────────
  $('btn-paste').addEventListener('click', async () => {
    try { $('uin').value = (await navigator.clipboard.readText()).trim(); } catch {}
    $('uin').focus();
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  $('btn-go').addEventListener('click', go);
  $('uin').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });

  async function go() {
    const url = $('uin').value.trim();
    if (!url) { showErr('Please paste a TikTok URL first.'); return; }
    setLoad(true); clearErr(); hideRes();
    try {
      const r = await fetch('/api/info?url=' + encodeURIComponent(url));
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || 'Failed to fetch video info.');
      data = j.data;
      render(data);
      // Show notification prompt once per session after first successful fetch
      if (!sessionStorage.getItem('np-shown') && Notification.permission === 'default') {
        sessionStorage.setItem('np-shown', '1');
        setTimeout(() => $('np').classList.add('show'), 3000);
      }
    } catch (e) {
      showErr(e.message || 'Something went wrong. Please try again.');
    } finally { setLoad(false); }
  }

  // ── Render result ─────────────────────────────────────────────────────────────
  function render(d) {
    $('rthumb').src = d.cover || '';
    $('rtitle').textContent  = d.title || 'TikTok Video';
    $('rauthor').textContent = d.author ? '@' + (d.authorHandle || d.author) : '';

    const st = $('rstats'); st.innerHTML = '';
    [['▶', d.stats?.plays], ['♥', d.stats?.likes], ['💬', d.stats?.comments]].forEach(([l, v]) => {
      const el = document.createElement('div');
      el.className = 'st';
      el.innerHTML = l + ' <strong>' + fmt(v) + '</strong>';
      st.appendChild(el);
    });

    if (d.audio?.title) $('audio-title').textContent = d.audio.title;

    // ── Slideshow pane — clean buttons, no broken img thumbnails ───────────────
    const sc = $('slidecontent');
    if (d.isSlideshow && d.images?.length) {
      let h = '<div class="slist">';
      d.images.forEach((_, i) => {
        h += `<button class="sbtn" data-index="${i}">
          <span class="sbtn-icon">🖼️</span>
          <span class="sbtn-label">Slide ${i + 1}</span>
          <span class="sbtn-dl">⬇</span>
        </button>`;
      });
      h += '</div>';
      h += `<button class="ball" id="dl-all-slides">⬇ Download All ${d.images.length} Slides</button>`;
      sc.innerHTML = h;

      $('dl-all-slides').addEventListener('click', function () {
        if (!data?.images?.length) return;
        // Fire smartlink once for "Download All" — synchronous click handler
        window.open(SMARTLINK, '_blank');
        window.open('/wait.html', '_blank');
        data.images.forEach((_, i) => setTimeout(() => triggerDownload('image', i), i * 800));
      });
    } else {
      sc.innerHTML = '<p style="font-size:.85rem;color:var(--mt);text-align:center;padding:20px 0">This TikTok is not a photo slideshow.</p>';
    }

    showRes();
    switchTab(d.isSlideshow ? 'slideshow' : 'video');
  }

  // ── Slideshow individual — event delegation on result container ───────────────
  $('res').addEventListener('click', e => {
    const btn = e.target.closest('.sbtn');
    if (btn) {
      const idx = parseInt(btn.dataset.index, 10);
      if (!isNaN(idx)) dlFile('image', idx);
    }
  });

  // ── Static download buttons ───────────────────────────────────────────────────
  $('dl-video').addEventListener('click', () => dlFile('video'));
  $('dl-audio').addEventListener('click', () => dlFile('audio'));

  // ── dlFile — fires smartlink synchronously (must stay sync in click handler) ──
  function dlFile(type, idx = 0) {
    if (!data) return;
    // ⚡ Smartlink + wait screen — MUST be called synchronously here (direct click)
    window.open(SMARTLINK, '_blank');
    window.open('/wait.html', '_blank');
    triggerDownload(type, idx);
    // Notification if permission granted
    if (Notification.permission === 'granted') {
      navigator.serviceWorker?.ready.then(reg => {
        reg.showNotification('AdvaySnapTik', {
          body: `Your ${type === 'image' ? 'slide ' + (idx + 1) : type} is downloading ⬇`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-96.png',
          tag: 'ast-dl',
        });
      });
    }
  }

  function triggerDownload(type, idx) {
    if (!data) return;
    const id = data.id || Date.now();
    let mediaUrl, filename;
    if (type === 'video') {
      mediaUrl = data.video?.noWatermark || data.video?.hd;
      filename  = `advaysnaptik_${id}.mp4`;
    } else if (type === 'audio') {
      mediaUrl = data.audio?.url;
      filename  = `advaysnaptik_audio_${id}.mp3`;
    } else {
      mediaUrl = data.images?.[idx];
      filename  = `advaysnaptik_slide_${idx + 1}_${id}.jpg`;
    }
    if (!mediaUrl) { showErr('Download URL not available.'); return; }
    const a = document.createElement('a');
    a.href = '/api/proxy?url=' + encodeURIComponent(mediaUrl) +
             '&filename=' + encodeURIComponent(filename) +
             '&type=' + type;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => switchTab(t.dataset.t))
  );
  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('on', t.dataset.t === name);
      t.setAttribute('aria-selected', t.dataset.t === name);
    });
    document.querySelectorAll('.pane').forEach(p =>
      p.classList.toggle('on', p.id === 'pane-' + name)
    );
  }

  // ── FAQ accordion ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.fq').forEach(b =>
    b.addEventListener('click', () => {
      const i = b.closest('.fi'), o = i.classList.toggle('on');
      b.setAttribute('aria-expanded', o);
    })
  );

  // ── Notifications ─────────────────────────────────────────────────────────────
  $('np-yes').addEventListener('click', async () => {
    $('np').classList.remove('show');
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted' && navigator.serviceWorker) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('AdvaySnapTik 🔔', {
          body: "Notifications enabled! You'll be alerted when downloads are ready.",
          icon: '/icons/icon-192.png',
          tag: 'ast-welcome',
        });
      }
    } catch {}
  });
  $('np-no').addEventListener('click', () => $('np').classList.remove('show'));

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function setLoad(on) {
    $('btn-go').disabled = on;
    $('blbl').style.display = on ? 'none' : 'inline';
    $('bspn').style.display = on ? 'inline-block' : 'none';
  }
  function showErr(m) { const e = $('err'); e.textContent = '⚠ ' + m; e.classList.add('show'); }
  function clearErr()  { $('err').classList.remove('show'); }
  function showRes()   { $('res').classList.add('show'); }
  function hideRes()   { $('res').classList.remove('show'); data = null; }
  function fmt(n)      { if (!n) return '—'; if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }

  // ── Service Worker ────────────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (e) { console.warn('SW:', e); }
    });
  }
})();
