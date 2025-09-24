#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>

const char* ssid = "Fairyguide_Connect";
const char* password = "password";

AsyncWebServer server(80);

String getContentType(String filename) {
  if (filename.endsWith(".htm")) return "text/html";
  else if (filename.endsWith(".html")) return "text/html";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".json")) return "application/json";
  else if (filename.endsWith(".png")) return "image/png";
  else if (filename.endsWith(".jpg")) return "image/jpeg";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  else if (filename.endsWith(".svg")) return "image/svg+xml";
  return "text/plain";
}

void setup() {
  Serial.begin(115200);

  // LittleFSをマウント
  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS mount failed!");
    return;
  }
  Serial.println("LittleFS mounted.");

  // Wi-Fiに接続
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
  Serial.println(WiFi.localIP()); // ← このIPでアクセス

  // ルートで index.html を返す
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/index.html", "text/html");
  });

  // その他のファイルも配信
  server.onNotFound([](AsyncWebServerRequest *request) {
    String path = request->url();
    if (LittleFS.exists(path)) {
      request->send(LittleFS, path, getContentType(path));
    } else {
      request->send(404, "text/plain", "Not found");
    }
  });

  server.begin();
}

void loop() {
  // 特に処理不要（AsyncWebServer が非同期で動作）
}
