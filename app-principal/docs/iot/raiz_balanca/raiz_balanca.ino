// Raiz Conecta — módulo da balança (ESP32 + célula de carga com HX711). Firmware 2.0.0.
//
// Pareamento estilo lâmpada inteligente (ver docs/IOT.md):
//   1. Sem Wi-Fi gravado, o módulo abre a rede aberta "Balanca_raiz_XXXX" (XXXX = final do MAC) por 10 minutos e atende
//      o app do produtor em http://192.168.4.1:  GET /info, GET /redes, POST /configurar, GET /estado.
//   2. O app entrega o Wi-Fi do produtor e o token de pareamento. O módulo entra nesse Wi-Fi e chama o servidor
//      (POST /api/iot/vincular). O servidor vincula a balança ao produtor e devolve o SEGREDO do módulo, que fica na
//      memória flash. O mesmo firmware serve para todas as balanças: não há nada para preencher antes de gravar.
//   3. Pronta: o módulo manda os pesos para o servidor (POST /api/iot/leituras).
//
// Recomeçar o pareamento (trocar de Wi-Fi ou de dono): segure o botão BOOT (GPIO 0) por 5 s. Se o produtor remover a
// balança no app, o servidor avisa ("vinculada": false) e o módulo volta sozinho ao modo de pareamento.
//
// Bibliotecas: "HX711" (bogde) pelo Gerenciador de Bibliotecas da Arduino IDE. O resto vem com a placa. Placa: "ESP32 Dev Module".
// LED (GPIO 2): pisca devagar = esperando o app · pisca rápido = entrando no Wi-Fi · aceso = enviando pesos · dois piscos = sem sinal.

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <HX711.h>

const char* SERVER    = "https://www.raizconecta.com.br";
const char* FIRMWARE  = "2.0.0";
const char* AP_PREFIX = "Balanca_raiz_";

const int   HX_DOUT = 16, HX_SCK = 4;
const int   BUTTON_PIN = 0;           // botão BOOT da placa
const int   LED_PIN = 2;
const float CALIBRATION = 22000.0f;   // ajuste com um peso conhecido: kg = leitura / CALIBRATION
const float STABLE_BAND_KG = 0.005f;  // o peso "parou" se as últimas 5 leituras variam menos que isto
const int   WINDOW = 5;

const unsigned long SETUP_WINDOW_MS = 10UL * 60UL * 1000UL;  // a rede da balança fica aberta por 10 minutos
const unsigned long RESET_HOLD_MS   = 5000;                  // segurar o botão por 5 s recomeça o pareamento
const unsigned long WIFI_TIMEOUT_MS = 20000;                 // tempo para entrar no Wi-Fi do produtor
const int           MAX_REJECTED    = 5;                     // 401 seguidos: o servidor não reconhece mais o módulo

enum Mode { MODE_SETUP, MODE_RUN, MODE_IDLE };

Mode mode = MODE_IDLE;
WebServer server(80);
Preferences prefs;
HX711 scale;

String deviceId;        // A4:CF:12:9B:07:E1
String apName;          // Balanca_raiz_07E1
String savedSsid, savedPass, deviceSecret;

// --- pareamento (modo SETUP) ---
String phase = "aguardando";   // aguardando | conectando | vinculando | ok | erro
String lastError = "";         // wifi | token | outra-conta | servidor
String pendingSsid, pendingPass, pendingToken;
unsigned long setupStartedAt = 0, connectStartedAt = 0;
bool wifiBegun = false;
bool serverStarted = false;

// --- leituras (modo RUN) ---
float recent[WINDOW];
int recentCount = 0;
unsigned long lastSend = 0, intervalActive = 500, intervalIdle = 5000;
String batch = "";
int batchCount = 0;
int rejected = 0;
bool online = false;
unsigned long lastOkAt = 0;

unsigned long buttonDownAt = 0;

// ---------------------------------------------------------------------------------------------------------------------
// utilidades

String jsonEscape(const String& text) {
  String out;
  for (size_t i = 0; i < text.length(); i++) {
    char c = text[i];
    if (c == '"' || c == '\\') { out += '\\'; out += c; }
    else if ((unsigned char)c < 0x20) { out += ' '; }
    else out += c;
  }
  return out;
}

bool isHex64(const String& text) {
  if (text.length() != 64) return false;
  for (size_t i = 0; i < 64; i++) if (!isxdigit((unsigned char)text[i])) return false;
  return true;
}

void sendJson(int status, const String& body) {
  server.sendHeader("Cache-Control", "no-store");
  server.send(status, "application/json", body);
}

void led(bool on) { digitalWrite(LED_PIN, on ? HIGH : LOW); }

void updateLed() {
  unsigned long t = millis();
  if (mode == MODE_SETUP) {
    bool fast = phase == "conectando" || phase == "vinculando";
    unsigned long period = fast ? 200 : 1000;
    led((t % period) < period / 2);
  } else if (mode == MODE_RUN) {
    unsigned long p = t % 1500;
    if (online) led(true);
    else led(p < 100 || (p > 250 && p < 350));   // dois piscos
  } else {
    led(false);
  }
}

void loadConfig() {
  prefs.begin("raiz", true);
  savedSsid = prefs.getString("ssid", "");
  savedPass = prefs.getString("pass", "");
  deviceSecret = prefs.getString("secret", "");
  prefs.end();
}

// Sem `everything`: só esquece o Wi-Fi (o segredo fica, como prova de que quem pede está com a balança na mão).
// Com `everything`: esquece também o segredo (o servidor liberou a balança ou deixou de reconhecer o módulo).
void forgetConfig(bool everything) {
  prefs.begin("raiz", false);
  prefs.remove("ssid");
  prefs.remove("pass");
  if (everything) prefs.remove("secret");
  prefs.end();
  savedSsid = "";
  savedPass = "";
  if (everything) deviceSecret = "";
}

// ---------------------------------------------------------------------------------------------------------------------
// redes que o módulo enxerga (o ESP32 só fala 2,4 GHz, então só elas aparecem)

struct Net { String ssid; int rssi; bool open; };

void startScan() {
  WiFi.scanDelete();
  WiFi.scanNetworks(true, false);   // assíncrono: não trava o servidor
}

String networksJson() {
  int n = WiFi.scanComplete();
  if (n == WIFI_SCAN_RUNNING) return "{\"buscando\":true,\"redes\":[]}";
  if (n < 0) { startScan(); return "{\"buscando\":true,\"redes\":[]}"; }

  const int MAX_NETS = 20;
  Net nets[MAX_NETS];
  int count = 0;
  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) continue;               // rede oculta
    int rssi = WiFi.RSSI(i);
    bool isOpen = WiFi.encryptionType(i) == WIFI_AUTH_OPEN;
    int found = -1;
    for (int j = 0; j < count; j++) if (nets[j].ssid == ssid) { found = j; break; }
    if (found >= 0) { if (rssi > nets[found].rssi) nets[found].rssi = rssi; continue; }
    if (count < MAX_NETS) { nets[count].ssid = ssid; nets[count].rssi = rssi; nets[count].open = isOpen; count++; }
  }
  for (int i = 1; i < count; i++) {                  // mais forte primeiro
    Net current = nets[i];
    int j = i - 1;
    while (j >= 0 && nets[j].rssi < current.rssi) { nets[j + 1] = nets[j]; j--; }
    nets[j + 1] = current;
  }

  String out = "{\"buscando\":false,\"redes\":[";
  for (int i = 0; i < count; i++) {
    if (i > 0) out += ",";
    out += "{\"ssid\":\"" + jsonEscape(nets[i].ssid) + "\",\"rssi\":" + String(nets[i].rssi) + ",\"aberta\":" + (nets[i].open ? "true" : "false") + "}";
  }
  return out + "]}";
}

// ---------------------------------------------------------------------------------------------------------------------
// servidor local do pareamento (só existe no modo SETUP)

void handleInfo() {
  sendJson(200, String("{\"app\":\"raiz-balanca\",\"deviceId\":\"") + deviceId + "\",\"firmware\":\"" + FIRMWARE +
                "\",\"ssid\":\"" + apName + "\",\"fase\":\"" + phase + "\"}");
}

void handleNetworks() {
  if (server.hasArg("atualizar")) { startScan(); sendJson(200, "{\"buscando\":true,\"redes\":[]}"); return; }
  sendJson(200, networksJson());
}

void handleState() {
  sendJson(200, String("{\"fase\":\"") + phase + "\",\"erro\":\"" + lastError + "\"}");
}

// POST (formulário): ssid, senha, token. Responde na hora; entrar no Wi-Fi e chamar o servidor acontece no loop.
void handleConfigure() {
  if (phase == "conectando" || phase == "vinculando" || phase == "ok") { sendJson(409, "{\"ok\":false,\"erro\":\"ocupada\"}"); return; }
  String ssid = server.arg("ssid");
  String pass = server.arg("senha");
  String token = server.arg("token");
  token.toLowerCase();
  if (ssid.length() < 1 || ssid.length() > 32 || (pass.length() > 0 && (pass.length() < 8 || pass.length() > 63)) || !isHex64(token)) {
    sendJson(400, "{\"ok\":false,\"erro\":\"dados\"}");
    return;
  }
  pendingSsid = ssid;
  pendingPass = pass;
  pendingToken = token;
  lastError = "";
  phase = "conectando";
  wifiBegun = false;
  connectStartedAt = millis();
  sendJson(200, "{\"ok\":true}");
}

void startSetup() {
  mode = MODE_SETUP;
  phase = "aguardando";
  lastError = "";
  wifiBegun = false;
  setupStartedAt = millis();

  WiFi.disconnect(true);
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(apName.c_str());   // rede aberta, sem senha: é só para o pareamento
  startScan();

  if (!serverStarted) {
    server.on("/info", HTTP_GET, handleInfo);
    server.on("/redes", HTTP_GET, handleNetworks);
    server.on("/estado", HTTP_GET, handleState);
    server.on("/configurar", HTTP_POST, handleConfigure);
    serverStarted = true;
  }
  server.begin();
  Serial.println("PAREAMENTO: rede " + apName + " aberta em " + WiFi.softAPIP().toString());
}

void stopSetup() {
  server.stop();
  WiFi.softAPdisconnect(true);
}

// POST /api/iot/vincular. Devolve o status HTTP e, se 200, o segredo novo.
int claimDevice(const String& token, String* secretOut) {
  WiFiClientSecure client;
  client.setInsecure();   // PRODUÇÃO: troque por client.setCACert(<certificado raiz do site>). O segredo trafega por aqui.
  HTTPClient http;
  http.setTimeout(10000);
  http.begin(client, String(SERVER) + "/api/iot/vincular");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", deviceId);
  if (deviceSecret.length() == 64) http.addHeader("Authorization", String("Device ") + deviceSecret);   // prova de posse (troca de dono)
  int status = http.POST(String("{\"token\":\"") + token + "\",\"firmware\":\"" + FIRMWARE + "\"}");
  if (status == 200) {
    String body = http.getString();
    int at = body.indexOf("\"segredo\":\"");
    if (at >= 0) {
      String secret = body.substring(at + 11, at + 11 + 64);
      if (isHex64(secret)) *secretOut = secret;
    }
  }
  http.end();
  return status;
}

void failPairing(const char* reason) {
  lastError = reason;
  phase = "erro";
  WiFi.disconnect(false);   // continua com a rede da balança no ar para o produtor tentar de novo
  Serial.println(String("PAREAMENTO: falhou (") + reason + ")");
}

void finishPairing(const String& secret) {
  prefs.begin("raiz", false);
  prefs.putString("ssid", pendingSsid);
  prefs.putString("pass", pendingPass);
  prefs.putString("secret", secret);
  prefs.end();
  savedSsid = pendingSsid;
  savedPass = pendingPass;
  deviceSecret = secret;
  pendingPass = "";
  pendingToken = "";
  phase = "ok";
  Serial.println("PAREAMENTO: concluído");
}

// Roda a cada volta do loop no modo SETUP.
void stepSetup() {
  server.handleClient();

  if (phase == "conectando") {
    if (!wifiBegun) { WiFi.begin(pendingSsid.c_str(), pendingPass.c_str()); wifiBegun = true; }
    if (WiFi.status() == WL_CONNECTED) phase = "vinculando";
    else if (millis() - connectStartedAt > WIFI_TIMEOUT_MS) failPairing("wifi");
    return;
  }

  if (phase == "vinculando") {
    String secret = "";
    int status = claimDevice(pendingToken, &secret);
    if (status == 200 && secret.length() == 64) {
      finishPairing(secret);
      delay(1500);               // dá tempo de o app ler "ok" se ainda estiver na rede da balança
      stopSetup();
      WiFi.mode(WIFI_STA);       // segue no Wi-Fi do produtor
      rejected = 0;
      online = false;
      lastOkAt = millis();
      mode = MODE_RUN;
    } else if (status == 409) failPairing("outra-conta");
    else if (status == 401 || status == 400) failPairing("token");
    else failPairing("servidor");
    return;
  }

  // A janela de pareamento fecha depois de 10 minutos sem ninguém terminar (ligue de novo ou segure o botão).
  if ((phase == "aguardando" || phase == "erro") && millis() - setupStartedAt > SETUP_WINDOW_MS) {
    stopSetup();
    WiFi.mode(WIFI_OFF);
    mode = MODE_IDLE;
    Serial.println("PAREAMENTO: janela encerrada. Segure o botão BOOT por 5 s para abrir de novo.");
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// pesagem (modo RUN)

bool isStable() {
  if (recentCount < WINDOW) return false;
  float lo = recent[0], hi = recent[0];
  for (int i = 1; i < WINDOW; i++) { lo = min(lo, recent[i]); hi = max(hi, recent[i]); }
  return (hi - lo) < STABLE_BAND_KG;
}

void startRun() {
  mode = MODE_RUN;
  online = false;
  lastOkAt = millis();
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(savedSsid.c_str(), savedPass.c_str());
  Serial.println("Entrando no Wi-Fi " + savedSsid);
}

// Envia o lote. Devolve o status HTTP (0 = sem Wi-Fi). Em falha, o lote fica para a próxima tentativa.
int sendReadings(bool* linked) {
  if (WiFi.status() != WL_CONNECTED) return 0;
  WiFiClientSecure client;
  client.setInsecure();   // PRODUÇÃO: troque por client.setCACert(<certificado raiz do site>)
  HTTPClient http;
  http.setTimeout(5000);
  http.begin(client, String(SERVER) + "/api/iot/leituras");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", deviceId);
  http.addHeader("Authorization", String("Device ") + deviceSecret);
  int status = http.POST(String("{\"firmware\":\"") + FIRMWARE + "\",\"leituras\":[" + batch + "]}");
  if (status == 200) *linked = http.getString().indexOf("\"vinculada\":false") < 0;
  http.end();
  return status;
}

void stepRun() {
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
    bool linked = true;
    int status = sendReadings(&linked);
    lastSend = millis();
    if (status == 200) {
      batch = "";
      batchCount = 0;
      rejected = 0;
      online = true;
      lastOkAt = millis();
      if (!linked) {              // o produtor removeu a balança: volta ao pareamento, do zero
        Serial.println("Balança liberada pelo servidor. Voltando ao pareamento.");
        forgetConfig(true);
        startSetup();
        return;
      }
    } else if (status == 401) {
      if (++rejected >= MAX_REJECTED) {   // o servidor não reconhece mais este módulo
        Serial.println("Servidor recusou o segredo. Voltando ao pareamento.");
        forgetConfig(true);
        startSetup();
        return;
      }
    }
    if (status != 200 && millis() - lastOkAt > 30000) online = false;
  }
  delay(100);
}

// ---------------------------------------------------------------------------------------------------------------------

// Segurar o botão BOOT por 5 s: esquece o Wi-Fi e abre o pareamento (o segredo fica, como prova de posse).
void handleButton() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    if (buttonDownAt == 0) buttonDownAt = millis();
    if (millis() - buttonDownAt >= RESET_HOLD_MS) {
      buttonDownAt = 0;
      Serial.println("Botão: recomeçando o pareamento.");
      forgetConfig(false);
      if (mode == MODE_SETUP) stopSetup();
      startSetup();
      while (digitalRead(BUTTON_PIN) == LOW) delay(10);   // espera soltar
    }
  } else {
    buttonDownAt = 0;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  scale.begin(HX_DOUT, HX_SCK);
  scale.set_scale(CALIBRATION);
  scale.tare();

  WiFi.mode(WIFI_STA);   // o MAC só é confiável depois de ligar o Wi-Fi
  deviceId = WiFi.macAddress();
  String mac = deviceId;
  mac.replace(":", "");
  apName = String(AP_PREFIX) + mac.substring(mac.length() - 4);
  Serial.println("DEVICE_ID = " + deviceId);

  loadConfig();
  if (savedSsid.length() > 0 && deviceSecret.length() == 64) startRun();
  else startSetup();
}

void loop() {
  handleButton();
  updateLed();
  if (mode == MODE_SETUP) { stepSetup(); delay(5); }
  else if (mode == MODE_RUN) stepRun();
  else delay(100);
}
