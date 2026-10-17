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

## 2. Cloud Deployment (24/7 Mobile & Web Access)

### Live Production Instances:
- **Web App (Vercel):** [https://smart-project-manager1.vercel.app](https://smart-project-manager1.vercel.app/)
- **Backend API (Render):** [https://smart-project-manager-em2i.onrender.com](https://smart-project-manager-em2i.onrender.com)
- **API Interactive Swagger:** [https://smart-project-manager-em2i.onrender.com/docs](https://smart-project-manager-em2i.onrender.com/docs)

### Backend (Render)
1. **Connect Repository:** Link `rb-369/Smart-Project-Manager` on Render.
2. **Build Settings:**
   - **Root Directory:** `backend`
   - **Environment:** Python 3.11+
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables on Render:**
   - `BACKEND_CORS_ORIGINS`: `["https://smart-project-manager1.vercel.app"]`
   - `GITHUB_REDIRECT_URI`: `https://smart-project-manager1.vercel.app/auth/github/callback`
   - `SECRET_KEY`: Set your JWT secret key.
   - `FERNET_ENCRYPTION_KEY`: Set your AES-256 token encryption key.
   - `MONGODB_URL`: Your MongoDB Atlas cluster connection string.
   - `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`: Multi-tier AI keys.

### Web Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `web`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://smart-project-manager-em2i.onrender.com/api/v1`
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
