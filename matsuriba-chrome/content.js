(() => {
    console.log("[Matsuriba] Overlay script loaded");

    // -----------------------------
    // デバッグログ
    // -----------------------------
    function debugLog(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[Matsuriba ${timestamp}] ${message}`;
        // tiny は後で定義。未定義でも安全に動くようにガード
        // eslint-disable-next-line no-console
        console.log(logMessage, data || "");
        if (window.matsuribaDebugMode && window.__matsuribaTiny) {
            window.__matsuribaTiny.title = `${logMessage}${
                data ? ` | ${JSON.stringify(data)}` : ""
            }`;
        }
    }

    // デバッグモード（Ctrl+Shift+Dで切替）
    window.matsuribaDebugMode =
        localStorage.getItem("matsuribaDebugMode") === "true";
    debugLog(`Debug mode: ${window.matsuribaDebugMode ? "ON" : "OFF"}`);

    // -----------------------------
    // DOM注入（最上位直下へ）
    // -----------------------------
    function ensureOverlay(parent = null) {
        // parent が指定されてなければ、fullscreenElement 優先で選ぶ
        const host = parent ||
            document.fullscreenElement || // ← フルスクリーン要素（最優先）
            document.webkitFullscreenElement || // Safari系
            document.documentElement; // 通常時

        let root = document.getElementById("esp-overlay");
        if (!root) {
            root = document.createElement("div");
            root.id = "esp-overlay";
            root.innerHTML =
                `<div id="esp-lane"></div><div id="esp-tiny">Connecting…</div>`;
        }

        // 既に別の親に付いている場合は、目的の host に付け替える
        if (root.parentElement !== host) {
            host.appendChild(root);
        }

        Object.assign(root.style, {
            position: "fixed",
            inset: "0",
            pointerEvents: "none",
            // 競合に勝つために stacking context を作って最前面に
            zIndex: "2147483647",
            isolation: "isolate", // 新しい stacking context
            contain: "layout style paint", // レイヤ分離で描画安定
        });

        // 参照を保持
        window.__matsuribaRoot = root;
        window.__matsuribaLane = root.querySelector("#esp-lane");
        window.__matsuribaTiny = root.querySelector("#esp-tiny");
    }

    ensureOverlay();
    const root = window.__matsuribaRoot;
    const lane = window.__matsuribaLane;
    const tiny = window.__matsuribaTiny;

    // -----------------------------
    // レイアウト
    // -----------------------------
    let rows = 6, counts = {};
    function recalcRows() {
        // 画面の縦サイズに合わせて段数を調整（最低4、最大8の簡易ロジック）
        const h = window.innerHeight || 1080;
        rows = Math.max(4, Math.min(8, Math.round(h / 180)));
        debugLog("Rows recalculated", { rows, height: h });
    }
    recalcRows();

    function pushBubble(text, color = "#ffffff") {
        const el = document.createElement("div");
        el.className = "bubble";
        el.style.color = color;
        el.style.position = "absolute";
        el.style.right = "-8vw";
        el.style.whiteSpace = "nowrap";
        el.style.font = "700 64px/1 system-ui, sans-serif";
        el.style.textShadow = "0 3px 10px rgba(0,0,0,.5)";
        el.style.animation = "fly 8s linear forwards";
        // ランダムな縦位置を設定（上下に少し余白を残す）
        const randomY = Math.random() * (window.innerHeight - 120) + 60;
        el.style.top = randomY + "px";
        el.textContent = text;
        lane.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
    }

    // CSSアニメが未定義でも動くように keyframes を動的注入
    (function injectKeyframes() {
        if (document.getElementById("esp-style")) return;
        const st = document.createElement("style");
        st.id = "esp-style";
        st.textContent = `
      @keyframes fly { to { transform: translateX(-110vw); } }
      #esp-overlay.hidden { display: none !important; }
    `;
        document.head.appendChild(st);
    })();

    // -----------------------------
    // プレゼン表示/フルスクリーンでの再配置
    // -----------------------------
    [
        "resize",
        "orientationchange",
        "fullscreenchange",
        "webkitfullscreenchange",
    ].forEach((ev) => {
        window.addEventListener(ev, () => {
            if (!document.getElementById("esp-overlay")) ensureOverlay();
            recalcRows();
            // 念のため再度最上位へ付け直す（DOM移動対策）
            if (
                root.parentElement !== document.documentElement &&
                document.documentElement
            ) {
                document.documentElement.appendChild(root);
            }
        }, { passive: true });
    });

    // DOM再構築（present切替など）への対策：MutationObserverで監視＆再注入
    const mo = new MutationObserver(() => {
        if (!document.getElementById("esp-overlay")) {
            debugLog("Overlay missing -> reinjecting");
            ensureOverlay();
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // -----------------------------
    // WebSocket
    // -----------------------------
    let ws = null, wsUrl = "";
    let backoff = 1000; // 再接続の初期ディレイ
    const backoffMax = 10000; // 最大10秒

    // storage からURL読込
    chrome.storage.sync.get({ wsUrl: "" }, (cfg) => {
        wsUrl = cfg.wsUrl || "";
        debugLog("WebSocket URL loaded from storage", {
            wsUrl: wsUrl || "(not set)",
        });

        if (!wsUrl) {
            tiny.textContent = "Set WS URL in Options";
            debugLog("No WebSocket URL configured - showing setup message");
            return;
        }
        connect(true);
    });

    function scheduleReconnect() {
        if (!wsUrl) return;
        const delay = backoff;
        backoff = Math.min(backoff * 2, backoffMax);
        debugLog("Scheduling reconnect", { delay });
        setTimeout(() => connect(false), delay);
    }

    function connect(first = false) {
        debugLog("Attempting WebSocket connection", { url: wsUrl });
        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                tiny.textContent = "Connected";
                debugLog("WebSocket connection established successfully");
                backoff = 1000; // 成功したらリセット
            };

            ws.onclose = (event) => {
                tiny.textContent = "Disconnected";
                debugLog("WebSocket connection closed", {
                    code: event.code,
                    reason: event.reason || "No reason provided",
                    wasClean: event.wasClean,
                });
                // 初回接続失敗や切断時は自動再接続
                scheduleReconnect();
            };

            ws.onerror = (error) => {
                debugLog("WebSocket error occurred", { error: String(error) });
                tiny.textContent = "Connection Error";
                // onerror の時点でも再接続を予約（onclose 側でも予約するが、片方で十分）
            };

            ws.onmessage = (e) => {
                debugLog("Received WebSocket message", { data: e.data });
                try {
                    const d = JSON.parse(e.data);
                    debugLog("Parsed message data", d);

                    if (d.clear) {
                        lane.innerHTML = "";
                        counts = {};
                        tiny.textContent = "Cleared";
                        debugLog("Display cleared");
                        return;
                    }

                    // 表示するテキスト（絵文字 or テキスト）
                    const show = d.text || null;
                    const color = d.color || "#ffffff";
                    if (!show) {
                        debugLog("No displayable content in message");
                        return;
                    }

                    debugLog("Displaying bubble", { content: show });
                    pushBubble(show, color);

                    tiny.textContent = statsText || "Connected";
                    debugLog("Updated statistics", {
                        counts,
                        display: statsText,
                    });
                } catch (parseError) {
                    debugLog("Failed to parse WebSocket message", {
                        error: String(parseError),
                        rawData: e.data,
                    });
                }
            };
        } catch (e) {
            tiny.textContent = "WS error";
            debugLog("WebSocket connection error (exception)", {
                error: String(e),
            });
            scheduleReconnect();
        }
    }

    // オプション変更をライブ反映（ws再接続）
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "sync" && changes.wsUrl) {
            const oldUrl = wsUrl;
            wsUrl = changes.wsUrl.newValue || "";
            debugLog("WebSocket URL changed", { oldUrl, newUrl: wsUrl });

            try {
                if (ws) {
                    debugLog("Closing existing WebSocket connection");
                    ws.close();
                }
            } catch (e) {
                debugLog("Error closing WebSocket", { error: String(e) });
            }

            tiny.textContent = wsUrl
                ? "Reconnecting…"
                : "Set WS URL in Options";
            if (wsUrl) {
                backoff = 1000; // URL変更時はすぐ繋ぎ直す
                connect(true);
            }
        }
    });

})();
