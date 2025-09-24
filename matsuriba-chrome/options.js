const ws = document.getElementById('ws');
const msg = document.getElementById('msg');
document.getElementById('save').onclick = () => {
  const v = ws.value.trim();
  chrome.storage.sync.set({ wsUrl: v }, () => {
    msg.textContent = '保存しました';
    setTimeout(()=> msg.textContent='', 1200);
  });
};
chrome.storage.sync.get({ wsUrl: "" }, (cfg) => ws.value = cfg.wsUrl || "");
