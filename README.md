# SpeakIt Mobile — Local Development Guide

## Prerequisites

- Node.js installed
- Android phone with **Expo Go** app installed
  → Download from Play Store: search **"Expo Go"**
- Phone and laptop on the **same WiFi network**

---

## Step 1 — Checkout the Code

```bash
cd /home/kamlesh/StudioProjects/VoiceUI
```

Or clone fresh:
```bash
git clone https://github.com/kmurdhar3/Voice.git /home/kamlesh/StudioProjects/VoiceUI
cd /home/kamlesh/StudioProjects/VoiceUI
npm install
```

---

## Step 2 — Make Your Changes

Edit any file inside `/home/kamlesh/StudioProjects/VoiceUI/` using your preferred editor.

Key files:
| File | Purpose |
|------|---------|
| `app/home.tsx` | Main recording screen |
| `app/results.tsx` | Results screen (3 polished versions) |
| `app/history.tsx` | Recording history screen |
| `app/settings.tsx` | Language + custom prompts |
| `context/AuthContext.tsx` | Login / token management |
| `context/HistoryContext.tsx` | History data fetching |

---

## Step 3 — Start the App

```bash
cd /home/kamlesh/StudioProjects/VoiceUI
npx expo start
```

Wait for the QR code to appear in the terminal.

---

## Step 4 — Open on Phone

1. Open **Expo Go** on your Android phone
2. Tap **"Scan QR Code"**
3. Point camera at the QR code in the terminal
4. App loads automatically on your phone ✅

---

## Step 5 — Live Reload (No restart needed)

Every time you **save a file** (`Ctrl+S`), the app reloads automatically on your phone.

| Action | How |
|--------|-----|
| Force reload | Press `r` in terminal |
| Open dev menu | Shake your phone |
| Stop server | Press `Ctrl+C` in terminal |

---

## API

The app connects to the live backend:
```
https://speakit-api-78524125987.asia-southeast1.run.app
```

No local backend setup needed — it's already deployed on Google Cloud Run.

---

## Test Credentials

```
Email:    test@speakit.io
Password: Test1234!
```
