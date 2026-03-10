/* AdvaySnapTik — app.js v1.3.0 */
(function () {
  'use strict';

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
  const p = new URLSearchParams(location.search);
  if (p.get('url')) { $('uin').value = p.get('url'); go(); }

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
      if (!sessionStorage.getItem('np-shown') && Notification.permission === 'default') {
        sessionStorage.setItem('np-shown', '1');
        setTimeout(() => $('np').classList.add('show'), 3000);
      }
    } catch (e) {
      showErr(e.message || 'Something went wrong. Please try again.');
    } finally { setLoad(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
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

    // ── Slideshow pane ────────────────────────────────────────────────────────
    const sc = $('slidecontent');
    if (d.isSlideshow && d.images?.length) {
      let h = '<div class="slist">';
      d.images.forEach((src, i) => {
        // Direct proxy URL rendered as href — most reliable on mobile
        const proxyUrl = '/api/proxy?url=' + encodeURIComponent(src)
          + '&type=image&filename=' + encodeURIComponent('advaysnaptik_slide_' + (i+1) + '_' + (d.id||'dl') + '.jpg');
        h += `<a class="sbtn" href="${proxyUrl}" download="advaysnaptik_slide_${i+1}.jpg" data-index="${i}">
          <span class="sbtn-icon">🖼️</span>
          <span class="sbtn-label">Slide ${i + 1}</span>
          <span class="sbtn-dl">⬇</span>
        </a>`;
      });
      h += '</div>';
      h += `<button class="ball" id="dl-all-slides">⬇ Download All ${d.images.length} Slides</button>`;
      sc.innerHTML = h;
    } else {
      sc.innerHTML = '<p style="font-size:.85rem;color:var(--mt);text-align:center;padding:20px 0">This TikTok is not a photo slideshow.</p>';
    }

    showRes();
    switchTab(d.isSlideshow ? 'slideshow' : 'video');
  }

  // ── Slideshow: individual slide clicks (event delegation) ─────────────────────
  // Opens wait.html once, then the href download handles the actual file
  $('res').addEventListener('click', e => {
    const btn = e.target.closest('.sbtn');
    if (btn) {
      window.open('/wait.html', '_blank');
      playNotifSound();
      // href download on the <a> element fires natively — no extra JS needed
    }

    const all = e.target.closest('#dl-all-slides');
    if (all && data?.images?.length) {
      window.open('/wait.html', '_blank');
      playNotifSound();
      // Click each slide link one by one — direct href approach
      const links = $('slidecontent').querySelectorAll('.sbtn');
      links.forEach((link, i) => {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = link.href;
          a.download = link.download;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }, i * 800);
      });
    }
  });

  // ── Video + Audio download buttons ───────────────────────────────────────────
  $('dl-video').addEventListener('click', () => dlFile('video'));
  $('dl-audio').addEventListener('click', () => dlFile('audio'));

  // ── Notification sound (Web Audio API — no file permission needed) ───────────
  function playNotifSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      function beep(freq, start, dur, vol) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq;
        o.type = 'sine';
        g.gain.setValueAtTime(0, ctx.currentTime + start);
        g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        o.start(ctx.currentTime + start);
        o.stop(ctx.currentTime + start + dur + 0.05);
      }
      beep(880,  0,    0.12, 0.4);   // first ding
      beep(1320, 0.16, 0.18, 0.35);  // second ding (higher)
    } catch {}
  }

  function dlFile(type, idx = 0) {
    if (!data) return;
    // Open wait screen — ONE popup only (mobile allows this reliably)
    window.open('/wait.html', '_blank');
    triggerDownload(type, idx);
    playNotifSound();
    // Push notification if granted
    if (Notification.permission === 'granted') {
      navigator.serviceWorker?.ready.then(reg => {
        reg.showNotification('AdvaySnapTik', {
          body: `Your ${type} is downloading ⬇`,
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
    } else {
      mediaUrl = data.audio?.url;
      filename  = `advaysnaptik_audio_${id}.mp3`;
    }
    if (!mediaUrl) { showErr('Download URL not available.'); return; }
    const a = document.createElement('a');
    a.href = '/api/proxy?url=' + encodeURIComponent(mediaUrl)
           + '&filename=' + encodeURIComponent(filename)
           + '&type=' + type;
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
      if (perm === 'granted') {
        const reg = await navigator.serviceWorker?.ready;
        reg?.showNotification('AdvaySnapTik 🔔', {
          body: "You'll be notified when downloads are ready.",
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
  function fmt(n)      { if (!n) return '—'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }

  // ── Service Worker ────────────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(async reg => {
          // Background Sync
          if ('SyncManager' in window) {
            try { await reg.sync.register('ast-sync'); } catch {}
          }
          // Periodic Background Sync
          if ('periodicSync' in reg) {
            try {
              const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
              if (status.state === 'granted') {
                await reg.periodicSync.register('ast-refresh', { minInterval: 24 * 60 * 60 * 1000 });
              }
            } catch {}
          }
        })
        .catch(() => {});
    });
  }
})();
