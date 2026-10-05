# AR 360 Video Booth — Backend & Live Analytics Dashboard

A high-performance [NestJS](https://nestjs.com/) backend, automated QR-code delivery system, and executive live analytics dashboard engineered for the **WebAR 360 Video Booth**.

- **Production Live Dashboard**: [https://ar-backend-3duv.onrender.com/dashboard](https://ar-backend-3duv.onrender.com/dashboard)
- **Production Upload API**: `https://ar-backend-3duv.onrender.com/api/videos/upload`
- **Local Development URL**: `http://localhost:3000`

---

## 🌟 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Uploading API Reference (Core)](#-uploading-api-reference)
3. [Full API Reference](#-full-api-reference)
4. [Attendee QR & Mobile Experience](#-attendee-qr--mobile-experience)
5. [Executive Live Analytics Dashboard](#-executive-live-analytics-dashboard)
6. [Environment Variables Reference](#-environment-variables-reference)
7. [Production Deployment Guide (Render + TiDB Cloud)](#-production-deployment-guide-render--tidb-cloud)
8. [Local Development Guide (XAMPP / MySQL)](#-local-development-guide)
9. [Frontend Integration Guide](#-frontend-integration-guide)
10. [Automated Testing](#-automated-testing)

---

## 🏗️ System Architecture

```
[ AR 360 Video Booth ] (Frontend / Camera)
         |
         |  POST /api/videos/upload (multipart/form-data)
         v
[ NestJS Backend Engine ] (Render / Local Node.js)
    |---> Generates UUIDv4 Token
    |---> Streams Video to Disk (`./uploads/videos/YYYY-MM/`)
    |---> Persists Metadata in TiDB Cloud Serverless (or local MySQL)
    |---> Generates High-Res QR Code (Base64 Data URL + PNG)
    |
    v
[ Booth Screen ] <--- Instantly displays QR code on recording completion
         |
         |  Attendee scans QR Code with Smartphone Camera
         v
[ Attendee Mobile Page ] (`/v/:token`)
    |---> HTTP 206 Partial Content video streaming (instant playback)
    |---> 1-Tap Direct HD Video Download (`/api/videos/:token/download`)
    |---> Increments live download metrics & tracks user-agent
```

---

## 📹 Uploading API Reference

### Endpoint Overview

| Environment | Method | Endpoint URL |
| :--- | :--- | :--- |
| **Production** | `POST` | `https://ar-backend-3duv.onrender.com/api/videos/upload` |
| **Local Dev** | `POST` | `http://localhost:3000/api/videos/upload` |

- **Authentication**: None (Public endpoint so booth hardware/web client can upload seamlessly).
- **Content-Type**: `multipart/form-data`
- **Max File Size**: `250 MB` (configurable via `MAX_FILE_SIZE_MB`).
- **Supported File Types**: `.mp4`, `.webm`, `.mov`, `.m4v`, or any `video/*` MIME type.

---

### Request Specification

#### Form Data Fields:
| Key | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `video` | `File` (Binary) | **Yes** | The recorded video file from the booth. |

---

### Response Specification (`201 Created`)

```json
{
  "success": true,
  "token": "7a35fe54-e69e-4e4b-9759-467ea5e7144e",
  "viewUrl": "https://ar-backend-3duv.onrender.com/v/7a35fe54-e69e-4e4b-9759-467ea5e7144e",
  "downloadUrl": "https://ar-backend-3duv.onrender.com/api/videos/7a35fe54-e69e-4e4b-9759-467ea5e7144e/download",
  "streamUrl": "https://ar-backend-3duv.onrender.com/api/videos/7a35fe54-e69e-4e4b-9759-467ea5e7144e/file",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFA...",
  "qrCodeApiUrl": "https://ar-backend-3duv.onrender.com/api/videos/7a35fe54-e69e-4e4b-9759-467ea5e7144e/qr",
  "filename": "vid_7a35fe54-e69e-4e4b-9759-467ea5e7144e.mp4",
  "originalName": "booth_recording.mp4",
  "sizeBytes": 14502840,
  "createdAt": "2026-10-05T15:45:00.000Z"
}
```

#### Response Field Details:
- **`token`**: Unique, unguessable UUIDv4 identifier for the video.
- **`viewUrl`**: Mobile-optimized landing page for the attendee (encoded inside the QR code).
- **`downloadUrl`**: Direct link to trigger file download attachment and update metrics.
- **`streamUrl`**: HTTP 206 Byte-Range streaming endpoint for inline video players.
- **`qrCode`**: Complete Base64 PNG Data URL — can be passed directly to `<img src={data.qrCode} />` on the booth screen without additional network calls.
- **`qrCodeApiUrl`**: Dedicated PNG image endpoint.

---

### Code Examples

#### 1. JavaScript / Fetch (Browser Frontend & React / Vue / Vite)

```javascript
async function uploadBoothVideo(videoBlobOrFile) {
  const formData = new FormData();
  // Field name MUST be 'video'
  formData.append('video', videoBlobOrFile, 'booth_recording.mp4');

  // Change to http://localhost:3000/api/videos/upload for local testing
  const API_URL = 'https://ar-backend-3duv.onrender.com/api/videos/upload';

  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Upload failed');
  }

  const data = await response.json();
  console.log('Upload Success!', data);

  // Display QR code on booth screen:
  const qrImg = document.getElementById('booth-qr-code');
  if (qrImg) {
    qrImg.src = data.qrCode; // Uses the base64 data URL directly
  }

  return data;
}
```

#### 2. cURL (Command Line / Terminal Testing)

```bash
# Production
curl -X POST https://ar-backend-3duv.onrender.com/api/videos/upload \
  -F "video=@/path/to/my_recording.mp4"

# Local
curl -X POST http://localhost:3000/api/videos/upload \
  -F "video=@/path/to/my_recording.mp4"
```

#### 3. Python

```python
import requests

url = "https://ar-backend-3duv.onrender.com/api/videos/upload"
files = {
    'video': ('booth_take.mp4', open('booth_take.mp4', 'rb'), 'video/mp4')
}

response = requests.post(url, files=files)
data = response.json()
print("Attendee View URL:", data["viewUrl"])
print("QR Code Base64:", data["qrCode"][:50] + "...")
```

---

## 🛠️ Full API Reference

### 📹 Video APIs

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/videos/upload` | Public | Upload video from booth, generates QR code & metadata |
| `GET` | `/api/videos/:token` | Public | Get metadata for a specific recording |
| `GET` | `/api/videos/:token/file` | Public | Stream video (supports HTTP 206 Partial Content) |
| `GET` | `/api/videos/:token/download` | Public | Force file download attachment & log download stats |
| `GET` | `/api/videos/:token/qr` | Public | Returns raw PNG QR code image |
| `GET` | `/api/videos` | **Admin** | Paginated video list with search & date filters |
| `DELETE` | `/api/videos/:token` | **Admin** | Permanently deletes video file and database record |

### 🔐 Authentication APIs

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates admin credentials (`username`, `password`), returns JWT & sets session cookie |
| `GET` | `/api/auth/me` | **Admin** | Validates active session and returns user profile |
| `POST` | `/api/auth/logout` | Public | Clears session cookie |

### 📱 Public Attendee Portal

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/v/:token` | Public | Mobile-optimized video landing page with direct player, 1-tap download, and Web Share API |

### 📊 Analytics & Dashboard APIs

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | Public UI | Interactive Analytics Dashboard UI with glassmorphic design and login modal |
| `GET` | `/api/analytics/summary` | **Admin** | KPI metrics (`totalVideos`, `todayVideos`, `periodVideos`, `storageUsed`, `avgSize`, `downloads`) with optional `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` |
| `GET` | `/api/analytics/daily-chart` | **Admin** | Daily upload trend array (supports `?days=14`) |
| `GET` | `/api/analytics/hourly-chart` | **Admin** | 24-hour distribution (00:00 - 23:00) of booth peak traffic |
| `GET` | `/api/analytics/export-csv` | **Admin** | Exports filtered video records as a downloadable `.csv` spreadsheet |

---

## 📱 Attendee QR & Mobile Experience

When a participant finishes recording in the booth:
1. The booth frontend sends the video to `POST /api/videos/upload`.
2. The response returns `qrCode` (`data:image/png;base64,...`).
3. The booth screen renders this QR code immediately.
4. When attendees point their native iOS/Android camera at the QR code, it opens:
   `https://ar-backend-3duv.onrender.com/v/:token`
5. Features on the mobile page:
   - Modern dark-mode video card with smooth ambient lighting.
   - Built-in video player with instant scrubbing.
   - **Download Video** button (saves video directly to their phone's Camera Roll / Files).
   - **Share Video** button (uses native Web Share sheet on iOS/Android).
   - Clean attendee privacy: participants cannot see other attendees' videos.

---

## 📊 Executive Live Analytics Dashboard

- **URL**: [https://ar-backend-3duv.onrender.com/dashboard](https://ar-backend-3duv.onrender.com/dashboard)
- **Default Credentials**:
  - **Username**: `admin`
  - **Password**: `admin123` *(configurable via `ADMIN_PASSWORD`)*

### Key Features:
- **Real-Time KPIs**: Total Videos, Today's Recordings, Storage Consumed, Average File Size, Total Downloads & Scans.
- **Quick Date Filter Toolbar**: Filter KPIs and charts by **Today**, **Yesterday**, **Last 7 Days**, **Last 30 Days**, **This Month**, or custom date range.
- **Interactive Visualizations**: Daily upload volume bar charts and 24-hour peak booth activity heat distribution.
- **Video Management Console**: Searchable recording registry with:
  - In-browser video player modal
  - High-res QR code view modal
  - Copy direct link to clipboard
  - Download video to local PC
  - Delete recording (with disk cleanup)
- **Live Sync**: 12-second live auto-refresh pulse with manual refresh trigger.
- **CSV Export**: One-click download of all filtered records for event reporting.

---

## ⚙️ Environment Variables Reference

| Variable | Description | Local Default | Production (Render) Example |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP port | `3000` | Assigned automatically by Render (`10000`) |
| `HOST` | Bind host address | `0.0.0.0` | `0.0.0.0` |
| `BASE_URL` | Public base URL used for QR code generation | `http://localhost:3000` *(or LAN IP `http://192.168.1.9:3000`)* | `https://ar-backend-3duv.onrender.com` *(auto-detected via `RENDER_EXTERNAL_URL` if omitted)* |
| `STORAGE_DIR` | Video file storage directory | `./uploads` | `/opt/render/project/src/uploads` |
| `MAX_FILE_SIZE_MB` | Maximum video upload size in MB | `250` | `250` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | `*` *(or your frontend domain)* |
| `DB_HOST` | Database hostname | `127.0.0.1` | `gateway01.ap-northeast-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | Database port | `3306` | `4000` |
| `DB_USER` | Database username | `root` | `xYAJTEDRKwfW2ri.root` |
| `DB_PASSWORD` | Database password | *(empty for XAMPP)* | `PO6rN2DQDJ4GmgBn` |
| `DB_NAME` | Database schema name | `ar_booth` | `ar_booth` |
| `DB_SSL` | Enable TLS transport | `false` | `true` |
| `DB_CA_PATH` | Optional custom CA certificate path | *(none)* | *(none - uses system root store)* |
| `ADMIN_USERNAME` | Dashboard administrator username | `admin` | `admin` |
| `ADMIN_PASSWORD` | Dashboard administrator password | `admin123` | `<strong_password>` |
| `JWT_SECRET` | Secret key for signing dashboard JWT tokens | `ar_booth_super_secret_jwt_key_2026` | `<random_hex_secret>` |

---

## 🚀 Production Deployment Guide (Render + TiDB Cloud)

### 1. Database (TiDB Cloud Serverless)
- TiDB Cloud Serverless provides a fully managed, auto-scaling MySQL-compatible database with TLS encryption.
- Use database `ar_booth` *(avoid using the reserved system catalog `sys` where `CREATE TABLE` is prohibited)*.
- Ensure `DB_SSL=true` is enabled.

### 2. Render Web Service Setup
1. Create a **New Web Service** connected to your GitHub repository: [`https://github.com/Zihan231/AR_Backend`](https://github.com/Zihan231/AR_Backend).
2. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` *(executes `node dist/main.js`)*
3. In **Environment Variables**, add:
   ```env
   DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
   DB_PORT=4000
   DB_USER=xYAJTEDRKwfW2ri.root
   DB_PASSWORD=PO6rN2DQDJ4GmgBn
   DB_NAME=ar_booth
   DB_SSL=true
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   JWT_SECRET=ar_booth_super_secret_jwt_key_2026
   ```
4. Click **Deploy Web Service**.

> [!TIP]
> **Persistent Disk Storage on Render**:
> Render Free instances use an ephemeral filesystem (uploads reset on redeployment). For persistent long-term storage of booth videos, add a **Render Disk** mounted at `/opt/render/project/src/uploads` with `STORAGE_DIR=/opt/render/project/src/uploads`.

---

## 💻 Local Development Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node.js 24/26)
- [XAMPP](https://www.apachefriends.org/) (for MySQL) OR a local MySQL server

### Steps:
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Zihan231/AR_Backend.git
   cd AR_Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   If testing mobile QR scanning with a physical phone on your local Wi-Fi:
   - Find your computer's local IP address (e.g. `192.168.1.9`).
   - Set `BASE_URL=http://192.168.1.9:3000`.

4. **Start the local MySQL server** (e.g. via XAMPP Control Panel).

5. **Start the backend development server**:
   ```bash
   npm run start:dev
   ```

6. Open:
   - Backend API: `http://localhost:3000`
   - Live Dashboard: `http://localhost:3000/dashboard`

---

## 🔌 Frontend Integration Guide

To connect the AR Videobooth frontend (`AR_Videobooth-main`):

### 1. In your frontend configuration or upload service:
```typescript
// Set the backend base URL depending on your environment:
export const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://ar-backend-3duv.onrender.com'
  : 'http://localhost:3000';
```

### 2. Handle Recording Completion:
```typescript
async function handleRecordingComplete(recordedBlob: Blob) {
  const formData = new FormData();
  formData.append('video', recordedBlob, `recording_${Date.now()}.mp4`);

  try {
    const res = await fetch(`${BACKEND_URL}/api/videos/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      // 1. Show the QR Code immediately on the screen
      setQrCodeImage(data.qrCode);
      
      // 2. You can also display the direct attendee link
      setAttendeeUrl(data.viewUrl);
    }
  } catch (error) {
    console.error('Failed to upload video:', error);
  }
}
```

---

## 🧪 Automated Testing

The repository includes a comprehensive test suite powered by [Vitest](https://vitest.dev/):

```powershell
# Run unit tests (Services, Controllers, Auth)
npm test

# Run End-to-End (E2E) integration tests
npm run test:e2e

# Run with test coverage
npm run test:cov
```
