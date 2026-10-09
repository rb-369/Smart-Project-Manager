# DevCommand: Production Deployment & Operations Guide

## 1. Quick Local Fullstack (Docker Compose)

Run backend, PostgreSQL, and Next.js frontend in isolated containers:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Launch all services
docker compose up --build
```
- Web Dashboard: `http://localhost:3000`
- FastAPI Backend & Swagger Docs: `http://localhost:8000/docs`
- PostgreSQL: Port `5432`

---

## 2. Cloud Deployment (24/7 Mobile Access)

### Backend (Render / Railway / Fly.io)
1. **Connect Repository:** Link your GitHub repo to Render or Railway.
2. **Build Settings:**
   - **Root Directory:** `backend`
   - **Environment:** Python 3.11+ or Docker
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables:**
   - `DATABASE_URL`: Your managed PostgreSQL connection URL (or leave blank to use persistent SQLite disk).
   - `SECRET_KEY`: Generate a random 64-char string.
   - `FERNET_ENCRYPTION_KEY`: Generate using `from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())`.
   - `OPENROUTER_API_KEY`: Your OpenRouter key (Tier 1 AI).
   - `GEMINI_API_KEY`: Your Google Gemini key (Tier 2 AI fallback).
   - `NVIDIA_API_KEY`: Your NVIDIA NIM key (Tier 3 AI fallback).

### Web Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `web`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-domain.com/api/v1`
4. Deploy! Automatic CI/CD will trigger on every git push.

### Mobile App (Android APK)
Build release APK for your phone:
```bash
cd mobile
flutter build apk --release
```
The output APK will be generated at:
`mobile/build/app/outputs/flutter-apk/app-release.apk`

Transfer to your Android phone via USB, Google Drive, or ADB:
```bash
adb install mobile/build/app/outputs/flutter-apk/app-release.apk
```
In the app's **Settings** tab, set the backend server URL to your deployed cloud URL (e.g. `https://your-backend.railway.app/api/v1`) or local LAN IP.
