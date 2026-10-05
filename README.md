# AR 360 Video Booth Backend & Live Analytics Dashboard

A high-performance [NestJS](https://nestjs.com/) backend, unique QR-code delivery system, and executive live analytics dashboard for the WebAR 360 Video Booth.

---

## 🚀 Key Features

1. **High-Concurrency Stream Uploads**: Multer disk streaming directly to partitioned date folders (`./uploads/videos/YYYY-MM/`) to handle multiple simultaneous video uploads without memory spikes.
2. **TypeORM with MySQL (XAMPP Server)**: Structured Object-Relational Mapping via `@nestjs/typeorm` and `typeorm` with connection pooling, declarative entities, repository pattern, and ACID transaction isolation.
3. **Unique, Unguessable QR Download Links**: Every recording receives a secure UUIDv4 token (`/v/:token`). The backend generates a high-resolution QR code (base64 Data URL and PNG endpoint) sent back to the booth screen immediately so users only see their own video.
4. **Mobile-First Video Landing Page (`/v/:token`)**: Attendees scan the QR code to open a responsive mobile player supporting HTTP 206 Partial Content (Byte-Range) streaming, 1-tap direct video download, and native Web Share.
5. **Executive Live Dashboard (`/dashboard`)**:
   - **Real-Time KPIs**: Today's Videos, Total All-Time Recordings, Total Storage Used, Total Scans & Downloads.
   - **Interactive Charts**: Daily upload volume (14-day trend) and Peak Booth Hours distribution.
   - **Video Management Console**: Searchable table with playable video preview modal, QR code pop-up, copy direct link, download to PC, and delete recording.
   - **Auto-Refresh**: Live 12-second pulse sync.
   - **Export**: One-click CSV export of booth metrics.

---

## 🛠️ API Reference

### 📹 Video APIs
- `POST /api/videos/upload` - Multipart form-data upload with field `video`. Returns `{ success: true, token, viewUrl, downloadUrl, qrCode, ... }`.
- `GET /api/videos/:token` - Video metadata details.
- `GET /api/videos/:token/file` - Stream video (supports HTTP 206 Byte Ranges).
- `GET /api/videos/:token/download` - Direct attachment download and metrics tracker.
- `GET /api/videos/:token/qr` - Raw PNG QR code image.
- `DELETE /api/videos/:token` - Delete video file from disk and database record (Protected with AuthGuard).

### 🔐 Authentication APIs
- `POST /api/auth/login` - Admin authentication with `{ username, password }`. Sets HTTP cookie and returns `{ success, token, user }`.
- `GET /api/auth/me` - Profile / session validation (Protected with AuthGuard).
- `POST /api/auth/logout` - Clears authentication session.

### 📱 Public Landing Page
- `GET /v/:token` - Responsive attendee download and streaming page.

### 📊 Analytics & Dashboard APIs (Protected with AuthGuard)
- `GET /dashboard` - Interactive Analytics Dashboard UI with secure glassmorphic login portal, quick date filter toolbar, and real-time metric cards.
- `GET /api/analytics/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - KPIs with dynamic period filtering (Total Videos, Today's Count, Period Storage Used, Average Size, Scans & Downloads).
- `GET /api/analytics/daily-chart?days=14` - Daily aggregation array for upload volume trend charts.
- `GET /api/analytics/hourly-chart` - 24-hour distribution (00:00 - 23:00) of booth traffic.
- `GET /api/videos?page=1&limit=10&search=...&startDate=...&endDate=...` - Paginated video listing filtered by keyword and date ranges.
- `GET /api/analytics/export-csv?startDate=...&endDate=...` - Download CSV report filtered by the active date range.

---

## ⚙️ Configuration (`.env`)

```ini
PORT=3000
HOST=0.0.0.0
# Set BASE_URL to your LAN IP (e.g. http://192.168.1.9:3000) so smartphones
# scanning the QR code on the booth Wi-Fi can open the video!
BASE_URL=http://192.168.1.9:3000
STORAGE_DIR=./uploads
MAX_FILE_SIZE_MB=250
CORS_ORIGIN=*

# MySQL / XAMPP Configuration (default: user root, empty password, port 3306)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ar_booth

# Dashboard Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=ar_booth_super_secret_jwt_key_2026
```

---

## 🏃 Quick Start

### 1. Start the Backend
In `c:\Zihan\ar_backend`:
```powershell
npm run start:dev
```
- Server: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`

### 2. Start the AR Booth Frontend
In `C:\Users\shahin\Downloads\AR_Videobooth-main\AR_Videobooth-main`:
```powershell
npm run dev
```
Open `http://localhost:5173` (or the network IP shown by Vite).
Record a video, and the QR code will instantly appear on the booth screen!

---

## 🧪 Testing

```powershell
# Run unit tests (VideosService, AnalyticsService, AppController)
npm run test

# Run end-to-end integration tests
npm run test:e2e
```
