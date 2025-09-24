// mac-backend.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json({ limit: "64kb" }));

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-KEY");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// 簡易レート制限
const last = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers["cf-connecting-ip"] || req.ip;
  const now = Date.now();
  if ((now - (last.get(ip) || 0)) < 1000) return res.sendStatus(429);
  last.set(ip, now);
  next();
}

// 無害化（制御文字やタグを潰す）
function sanitize(s = "") {
  return String(s)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/</g, "＜").replace(/>/g, "＞");
}

// 参加者 → POST /vote
app.post("/vote", rateLimit, (req, res) => {

  let { text } = req.body || {};
  text = sanitize(text || "");
  if (!text.trim()) return res.sendStatus(400);

  broadcast(JSON.stringify({ text, ts: Date.now() }));
  res.sendStatus(204);
});

// 発表PC → WS /overlay
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/overlay" });
const clients = new Set();
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});
setInterval(() => {
  for (const ws of clients) {
    if (!ws.isAlive) { ws.terminate(); clients.delete(ws); continue; }
    ws.isAlive = false; try { ws.ping(); } catch {}
  }
}, 15000);

function broadcast(buf) {
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN && ws.bufferedAmount < 512*1024) {
      ws.send(buf);
    }
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backend http://localhost:${PORT}`));
