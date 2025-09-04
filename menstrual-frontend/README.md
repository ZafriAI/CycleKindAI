# Menstrual Frontend — Expo Go Running & Testing Guide

This guide helps you run the **Expo (React Native)** app on your phone with **Expo Go** and test it against your local **FastAPI** backend.

---

## Prerequisites

- **Backend** is running locally and healthy at `http://localhost:8000`  
  - `GET /health` → `{"ok": true}`
- **Node.js** 18+ and **npm** installed
- **Expo Go** app installed on your phone (iOS App Store / Google Play)
- Phone and dev machine on the **same Wi-Fi** network (for LAN connection)

---

## 1) Clone & install

```bash
cd menstrual-frontend
npm install
If Expo asks to install TypeScript types on first run, accept (or run):
```
```
npm i -D typescript @types/react @types/react-native
```
2) Point the app to your API
When running on a phone, localhost won’t work (it’s the phone’s own loopback). Set the backend base URL using your PC’s LAN IP.

Create or edit app.config.js in the project root:
```
js

// app.config.js
export default ({ config }) => ({
  ...config,
  name: "MenstrualApp",
  slug: "menstrual-app",
  extra: {
    // Replace with your computer’s LAN IP address
    apiBaseUrl: "http://192.168.1.123:8000",
  },
});
```
Host hints

Real phone via Expo Go → http://<YOUR_PC_LAN_IP>:8000

Android emulator → http://10.0.2.2:8000

iOS simulator (on a Mac) → http://localhost:8000

After changing app.config.js, restart Expo.

3) Start Expo (Expo Go)
```
bash

npx expo start
```
In the browser Dev Tools, set Connection to LAN (or try Tunnel if LAN doesn’t work).

Open Expo Go on your phone → scan the QR code.

Stop/Restart

Stop: Ctrl+C in the terminal (press Y if prompted)

Clean start: 
```
npx expo start -c
```

4) App structure (Expo Router)
This project uses Expo Router. You’ll find tabs for Ask and Chat under app/:

app/_layout.tsx — tab navigator

app/ask.tsx — retrieval-augmented Q&A (RAG)

app/chat.tsx — open-ended chat with the model

If you only see one screen, ensure these files exist and that you restarted with cache cleared (-c).

5) Testing flows (what to click)
A) Authentication
Some endpoints require a valid token. In your current simple test UI, you may be calling public endpoints. If your app adds login UI:

Register: email + password → /auth/register

Login: email + password → /auth/login
The token is stored with expo-secure-store.

B) Chat (no ingestion required)
Go to Chat tab

Type a prompt (e.g., “Give me a gentle self-care tip for PMS”)

Send → the app calls POST /chat with { "prompt": "..." }

Your backend injects user context (recent cycles/symptoms) if authenticated

Response shows the model’s answer

C) Ask (RAG, needs docs)
Go to Ask tab

Tap “Seed demo docs” (this calls POST /ingest with a couple of tiny test docs)

Ask a question (e.g., “What are the cycle phases?”)

Send → the app calls POST /ask with { "question": "...", "k": 8 }

You’ll see an answer plus sources (citations) if available

D) Logging data (optional, if your UI includes it)
Add period: POST /cycles/ (keep flow_intensity 1–5)

Add symptom: POST /symptoms/ (keep severity 1–5)

View insights: GET /insights / GET /insights/summary

The more you log, the richer the personalized context for Chat.

6) Common issues & fixes
“I can’t reach the API from the phone”
Use PC’s LAN IP in app.config.js (not localhost)

Phone and PC must be on the same Wi-Fi (no captive portals/VPNs)

Windows Firewall may block inbound — allow local traffic on port 8000

If LAN is flaky, start Expo with a Tunnel:
```
bash

npx expo start --tunnel
```
CORS errors
Enable permissive CORS in dev (already added in api/app.py). If you changed it, ensure:
```
py

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],  # dev only
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
```
“/chat returns 404”
Confirm server exposes it:
```
bash

curl -s http://localhost:8000/openapi.json | jq -r '.paths | keys[]' | sort
```
Ensure server includes router:
```
py

app.include_router(chat.router)  # no prefix => path is /chat
```
Request must be POST /chat with Content-Type: application/json and a body {"prompt": "..."}.

“/ask returns empty/misses info”
You must ingest docs first (/ingest) or tap Seed demo docs in the app.

Adjust k (retrieved docs count). Try 4–12.

“Expo shows old UI / wrong screens”
Clear bundler cache:
```
bash

npx expo start -c
```
Ensure you’re using Expo Router: files live in app/ (e.g., app/chat.tsx, app/ask.tsx).

7) Useful scripts & commands
Start Expo
```
bash
npx expo start
```
Start Expo with tunnel
```
bash
npx expo start --tunnel
Run on web (helpful for quick UI checks)
```
```
bash
Copy code
npx expo start --web
```
Check backend health
```
bash
Copy code
curl -s http://localhost:8000/health
```
List backend paths
```
bash
Copy code
curl -s http://localhost:8000/openapi.json | jq -r '.paths | keys[]' | sort
```
Test chat via curl (after login)
```
bash
Copy code
TOKEN=... # your bearer
curl -sS -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Any gentle self-care suggestions for PMS today?"}' | jq
```
Test ask (after seeding docs)
```
bash
Copy code
curl -sS -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the cycle phases?","k":8}' | jq
```
8) Development tips
Validation: flow_intensity and severity are 1–5; reflect that in your UI inputs.

Token storage: app uses expo-secure-store interceptor; login once and requests include Authorization: Bearer <token>.

Personalization: your backend injects a compact user context (recent cycles/symptoms) into /chat and /ask prompts—log real data to see better answers.

Model feel: if chat feels repetitive, consider a larger local model (e.g., qwen2.5:7b-instruct) or keep 1.5B for speed.

9) Troubleshooting checklist
 Backend is up and /health is OK

 app.config.js points to PC LAN IP

 Expo Dev Tools connection: LAN or Tunnel

 /chat is in /openapi.json and you’re POSTing JSON with prompt

 For /ask, you ingested docs (or used Seed demo docs)

 If on device: same Wi-Fi, firewall allows port 8000
