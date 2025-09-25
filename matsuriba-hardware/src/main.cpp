#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <M5Unified.h>

const char *ssid = "your-ssid";
const char *password = "your-password";

int activeClients = 0;

AsyncWebServer server(80);

IPAddress local_IP(172, 20, 10, 5);
IPAddress gateway(172, 20, 10, 1);
IPAddress subnet(255, 255, 255, 240);

void sendIndex(AsyncWebServerRequest *req)
{
  activeClients++;
  auto *res = req->beginResponse(LittleFS, "/index.html.gz", "text/html");
  res->addHeader("Content-Encoding", "gzip");
  res->addHeader("Cache-Control", "public, max-age=31536000, immutable");
  req->send(res);
}

void setup()
{
  Serial.begin(115200);
  M5.begin();
  if (!WiFi.config(local_IP, gateway, subnet))
  {
    Serial.println("STA Failed to configure");
  }
  WiFi.begin(ssid, password);
  M5.Lcd.setTextSize(2);
  M5.Lcd.print("WiFi Start");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(300);
    Serial.print(".");
    M5.Lcd.print(".");
  }
  Serial.println("\nConnected as STA:");
  Serial.println(WiFi.localIP());
  M5.Lcd.fillScreen(TFT_BLACK);
  M5.Lcd.setCursor(0, 0);
  M5.Lcd.printf("IP:\n%s\n", WiFi.localIP().toString().c_str());

  LittleFS.begin(true);
  server.on("/", HTTP_GET, sendIndex);
  server.onNotFound([](AsyncWebServerRequest *req)
                    { req->send(404, "text/plain", "404 not found"); });
  server.begin();
  delay(5000);
  M5.Lcd.setTextSize(10);
  M5.Lcd.setCursor(0, 0);
}

void loop()
{
  M5.Lcd.fillScreen(TFT_BLACK);
  M5.Lcd.printf("%d", activeClients);
  M5.Lcd.setCursor(0, 0);
  M5.update();
  delay(1000);
}
