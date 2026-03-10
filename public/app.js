/* AdvaySnapTik — app.js v1.0.0 */
(function () {
  'use strict';
  let data = null, defer = null;
  const $ = id => document.getElementById(id);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const btnThm = $('btn-theme');
  function applyTheme(t) { document.documentElement.className = t; btnThm.textContent = t==='dark'?'☀️':'🌙'; localStorage.setItem('ast-theme',t); }
  btnThm.addEventListener('click', () => applyTheme(document.documentElement.className==='dark'?'light':'dark'));
  btnThm.textContent = document.documentElement.className==='dark'?'☀️':'🌙';

  // ── PWA install ────────────────────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); defer=e; $('ibanner').classList.add('show'); });
  $('btn-install').addEventListener('click', async () => { if (!defer) return; defer.prompt(); const {outcome}=await defer.userChoice; if (outcome==='accepted') $('ibanner').style.display='none'; defer=null; });
  $('btn-dismiss').addEventListener('click', () => { $('ibanner').style.display='none'; });

  // ── Hamburger ──────────────────────────────────────────────────────────────
  $('hamburger').addEventListener('click', function(){ const l=$('navlinks'),o=l.classList.toggle('open'); this.setAttribute('aria-expanded',o); });

  // ── URL params ─────────────────────────────────────────────────────────────
  (function(){ const p=new URLSearchParams(location.search), u=p.get('url'), t=p.get('tab'); if(u){$('uin').value=u;go();} if(t) tab(t); })();

  // ── Paste ──────────────────────────────────────────────────────────────────
  $('btn-paste').addEventListener('click', async () => { try{$('uin').value=(await navigator.clipboard.readText()).trim();}catch{} $('uin').focus(); });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  $('btn-go').addEventListener('click', go);
  $('uin').addEventListener('keydown', e=>{ if(e.key==='Enter') go(); });

  async function go() {
    const url=$('uin').value.trim();
    if(!url){err('Please paste a TikTok URL first.');return;}
    load(true); clearErr(); hideRes();
    try {
      const r=await fetch('/api/info?url='+encodeURIComponent(url));
      const j=await r.json();
      if(!r.ok||!j.success) throw new Error(j.error||'Failed to fetch video info.');
      data=j.data; render(data);
    } catch(e) {
      err(e.message||'Something went wrong. Please try again.');
      if(!navigator.onLine&&navigator.serviceWorker?.controller)
        navigator.serviceWorker.controller.postMessage({type:'QUEUE_SYNC',url});
    } finally { load(false); }
  }

  function render(d) {
    $('rthumb').src = d.cover||'';
    $('rtitle').textContent  = d.title||'TikTok Video';
    $('rauthor').textContent = d.author?'@'+(d.authorHandle||d.author):'';
    const st=$('rstats'); st.innerHTML='';
    [['▶',d.stats?.plays],['♥',d.stats?.likes],['💬',d.stats?.comments]].forEach(([l,v])=>{
      const el=document.createElement('div'); el.className='st'; el.innerHTML=l+' <strong>'+fmt(v)+'</strong>'; st.appendChild(el);
    });
    if(d.audio?.title) $('audio-title').textContent=d.audio.title;
    const sc=$('slidecontent');
    if(d.isSlideshow&&d.images?.length){
      let h='<div class="sgrid">';
      d.images.forEach((s,i)=>{ h+='<img src="'+esc(s)+'" class="simg" alt="Slide '+(i+1)+'" loading="lazy" onclick="AST.dlSlide('+i+')" title="Download slide '+(i+1)+'">'; });
      h+='</div><button class="ball" onclick="AST.dlAll()">Download All '+d.images.length+' Slides</button>';
      sc.innerHTML=h;
    } else { sc.innerHTML='<p style="font-size:.85rem;color:var(--mt);text-align:center;padding:20px 0">This TikTok is not a photo slideshow.</p>'; }
    showRes(); tab(d.isSlideshow?'slideshow':'video');
  }

  window.AST = {
    dlSlide: i => dl('image',i),
    dlAll:   () => data?.images?.forEach((_,i)=>setTimeout(()=>dl('image',i),i*600)),
  };
  $('dl-video').addEventListener('click',()=>dl('video'));
  $('dl-audio').addEventListener('click',()=>dl('audio'));

  function dl(type,idx=0){
    if(!data) return;
    const id=data.id||Date.now(); let mediaUrl,filename;
    if(type==='video')      { mediaUrl=data.video?.noWatermark||data.video?.hd; filename='advaysnaptik_'+id+'.mp4'; }
    else if(type==='audio') { mediaUrl=data.audio?.url; filename='advaysnaptik_audio_'+id+'.mp3'; }
    else                    { mediaUrl=data.images?.[idx]; filename='advaysnaptik_slide_'+(idx+1)+'_'+id+'.jpg'; }
    if(!mediaUrl){err('Download URL not available.');return;}
    const smart=window.AD_CONFIG?.smart; if(smart) window.open(smart,'_blank');
    window.open('/wait.html','_blank');
    const a=document.createElement('a');
    a.href='/api/proxy?url='+encodeURIComponent(mediaUrl)+'&filename='+encodeURIComponent(filename)+'&type='+type;
    a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>tab(t.dataset.t)));
  function tab(name){
    document.querySelectorAll('.tab').forEach(t=>{t.classList.toggle('on',t.dataset.t===name);t.setAttribute('aria-selected',t.dataset.t===name);});
    document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='pane-'+name));
  }

  // ── FAQ ────────────────────────────────────────────────────────────────────
  document.querySelectorAll('.fq').forEach(b=>b.addEventListener('click',()=>{ const i=b.closest('.fi'),o=i.classList.toggle('on'); b.setAttribute('aria-expanded',o); }));

  // ── Helpers ────────────────────────────────────────────────────────────────
  function load(on){ $('btn-go').disabled=on; $('blbl').style.display=on?'none':'inline'; $('bspn').style.display=on?'inline-block':'none'; }
  function err(m){ const e=$('err'); e.textContent='⚠ '+m; e.classList.add('show'); }
  function clearErr(){ $('err').classList.remove('show'); }
  function showRes(){ $('res').classList.add('show'); }
  function hideRes(){ $('res').classList.remove('show'); data=null; }
  function fmt(n){ if(!n) return '—'; if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ── Service Worker ─────────────────────────────────────────────────────────
  if('serviceWorker' in navigator){
    window.addEventListener('load', async()=>{
      try{
        const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
        if('periodicSync' in reg){
          try{ const s=await navigator.permissions.query({name:'periodic-background-sync'}); if(s.state==='granted') await reg.periodicSync.register('refresh-cache',{minInterval:3_600_000}); }catch{}
        }
        navigator.serviceWorker.addEventListener('message',e=>{ if(e.data?.type==='SYNC_DONE'){$('uin').value=e.data.url;go();} });
      }catch(e){console.warn('SW:',e);}
    });
  }
})();
