// Raiz Conecta — módulo da balança (ESP32 + célula de carga com HX711).
// Exemplo de referência: lê o peso, decide se ele "parou" e manda para o servidor por HTTPS.
// Bibliotecas: "HX711" (bogde) pelo Gerenciador de Bibliotecas da Arduino IDE. Placa: "ESP32 Dev Module".
//
// Antes de gravar, preencha as constantes abaixo. O SEGREDO aparece uma única vez, quando o administrador
// cadastra a balança no site (aba Balanças). O endereço MAC (DEVICE_ID) é o impresso pelo próprio módulo no Serial.

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <HX711.h>

const char* WIFI_SSID = "NOME_DA_REDE";
const char* WIFI_PASS = "SENHA_DA_REDE";
const char* SERVER    = "https://SEU-SITE.vercel.app";
const char* SECRET    = "COLE_AQUI_O_SEGREDO_DA_BALANCA";   // 64 caracteres
const char* FIRMWARE  = "1.0.0";

const int   HX_DOUT = 16, HX_SCK = 4;
const float CALIBRATION = 22000.0f;   // ajuste com um peso conhecido: kg = leitura / CALIBRATION
const float STABLE_BAND_KG = 0.005f;  // o peso "parou" se as últimas 5 leituras variam menos que isto
const int   WINDOW = 5;

HX711 scale;
String deviceId;
float recent[WINDOW];
int recentCount = 0;
unsigned long lastSend = 0, intervalActive = 500, intervalIdle = 5000;
String batch = "";   // leituras juntadas para o próximo envio, em JSON
int batchCount = 0;

bool isStable() {
  if (recentCount < WINDOW) return false;
  float lo = recent[0], hi = recent[0];
  for (int i = 1; i < WINDOW; i++) { lo = min(lo, recent[i]); hi = max(hi, recent[i]); }
  return (hi - lo) < STABLE_BAND_KG;
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(300);
}

// Envia o lote. Devolve true se o servidor aceitou (200). Em falha, o lote fica para a próxima tentativa.
bool send(bool* linked) {
  if (WiFi.status() != WL_CONNECTED) { connectWifi(); }
  WiFiClientSecure client;
  client.setInsecure();   // PRODUÇÃO: troque por client.setCACert(<certificado raiz do site>)
  HTTPClient http;
  http.setTimeout(5000);
  http.begin(client, String(SERVER) + "/api/iot/leituras");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", deviceId);
  http.addHeader("Authorization", String("Device ") + SECRET);
  int status = http.POST(String("{\"firmware\":\"") + FIRMWARE + "\",\"leituras\":[" + batch + "]}");
  if (status == 200) *linked = http.getString().indexOf("\"vinculada\":true") >= 0;
  http.end();
  return status == 200;
}

void setup() {
  Serial.begin(115200);
  scale.begin(HX_DOUT, HX_SCK);
  scale.set_scale(CALIBRATION);
  scale.tare();
  connectWifi();
  deviceId = WiFi.macAddress();   // A4:CF:12:9B:07:E1
  Serial.println("DEVICE_ID = " + deviceId);
}

void loop() {
  float kg = scale.get_units(1);
  if (kg < 0) kg = 0;
  recent[recentCount % WINDOW] = kg;
  recentCount++;
  bool stable = isStable();

  if (batchCount < 10) {
    if (batchCount > 0) batch += ",";
    batch += String("{\"kg\":") + String(kg, 3) + ",\"estavel\":" + (stable ? "true" : "false") + "}";
    batchCount++;
  }

  // Com peso na balança manda rápido; vazia, só um batimento de vez em quando.
  unsigned long interval = kg > 0.02f ? intervalActive : intervalIdle;
  if (millis() - lastSend >= interval) {
    bool linked = false;
    if (send(&linked)) { batch = ""; batchCount = 0; }
    lastSend = millis();
  }
  delay(100);
}
