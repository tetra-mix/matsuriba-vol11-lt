(() => {

  console.log('matsuriba overlay script loaded');
  
  // オーバーレイのDOMを注入
  const root = document.createElement('div');
  root.id = 'esp-overlay';
  root.innerHTML = `<div id="esp-lane"></div><div id="esp-tiny">Connecting…</div>`;
  document.documentElement.appendChild(root);
  const lane = root.querySelector('#esp-lane');
  const tiny = root.querySelector('#esp-tiny');

  let rows = 6, row = 0, counts = {}, ws = null, wsUrl = '';

  function pushBubble(text){
    const el = document.createElement('div');
    el.className = 'bubble';
    el.style.top = ((row++ % rows) * (window.innerHeight / rows) + 10) + 'px';
    el.textContent = text;
    lane.appendChild(el);
    el.addEventListener('animationend', ()=> el.remove());
  }

  // 設定（chrome.storage）からWS URLを読み込んで接続
  chrome.storage.sync.get({ wsUrl: "" }, (cfg) => {
    wsUrl = cfg.wsUrl || "";
    if (!wsUrl) {
      tiny.textContent = "Set WS URL in Options";
      return;
    }
    connect();
  });

  function connect(){
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => tiny.textContent = 'Connected';
      ws.onclose = () => tiny.textContent = 'Disconnected';
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.clear) { lane.innerHTML=''; counts={}; tiny.textContent='Cleared'; return; }
          // 表示するテキスト（絵文字 or 【名前】本文）
          const show = d.emoji || (d.text ? `【${d.name||'guest'}】${d.text}` : null);
          if (!show) return;
          pushBubble(show);
          const key = d.emoji || 'text';
          counts[key] = (counts[key] || 0) + 1;
          tiny.textContent = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x.join('×')).join('  ');
        } catch {}
      };
    } catch (e) {
      tiny.textContent = 'WS error';
    }
  }

  // オプション変更をライブ反映（ws再接続）
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.wsUrl) {
      wsUrl = changes.wsUrl.newValue || '';
      try{ ws && ws.close(); }catch{}
      tiny.textContent = wsUrl ? 'Reconnecting…' : 'Set WS URL in Options';
      if (wsUrl) connect();
    }
  });

  // 表示/非表示切替（Ctrl+Shift+O）
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey && ev.shiftKey && ev.code === 'KeyO') {
      root.classList.toggle('hidden');
    }
  });
})();
