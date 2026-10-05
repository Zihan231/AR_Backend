import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { VideosService } from '../videos/videos.service.js';
import { AppConfigService } from '../config/app-config.service.js';
import type { Response } from 'express';

@Controller('v')
export class PublicViewController {
  constructor(
    private readonly videosService: VideosService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Get(':token')
  async renderVideoPage(@Param('token') token: string, @Res() res: Response) {
    try {
      const video = await this.videosService.getVideoByToken(token);
      const streamUrl = `${this.appConfig.baseUrl}/api/videos/${video.token}/file`;
      const downloadUrl = `${this.appConfig.baseUrl}/api/videos/${video.token}/download`;
      const fileSizeMB = (video.size_bytes / (1024 * 1024)).toFixed(1);
      const createdDate = new Date(video.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Your AR 360 Video</title>
  <meta name="description" content="Download your personalized AR 360 Video Booth experience">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 28, 45, 0.75);
      --card-border: rgba(255, 255, 255, 0.1);
      --primary: #6366f1;
      --primary-glow: #818cf8;
      --accent: #ec4899;
      --accent-glow: #f43f5e;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #10b981;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 1.5rem 1rem;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.22) 0%, transparent 60%),
        radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.15) 0%, transparent 50%);
      background-attachment: fixed;
    }

    .container {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .header {
      text-align: center;
      padding: 0.5rem 0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.35);
      color: #c7d2fe;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.6rem;
    }

    .badge::before {
      content: '';
      width: 7px;
      height: 7px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 8px #22c55e;
    }

    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.2;
      background: linear-gradient(135deg, #ffffff 40%, #c7d2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .video-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
      position: relative;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      background: #000;
      aspect-ratio: 9 / 16;
      max-height: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .meta-bar {
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--card-border);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .actions-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      backdrop-filter: blur(16px);
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.95rem 1.25rem;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      font-family: inherit;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      box-shadow: 0 4px 18px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:active {
      transform: scale(0.98);
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .btn-secondary:active {
      background: rgba(255, 255, 255, 0.14);
      transform: scale(0.98);
    }

    .tip {
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
      padding: 0 0.5rem;
    }

    .footer {
      text-align: center;
      margin-top: auto;
      padding-top: 1.5rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    svg {
      width: 20px;
      height: 20px;
      stroke-width: 2.2;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="badge">AR 360 Video Booth</div>
      <h1>Your Video is Ready!</h1>
      <p class="subtitle">Stream or save directly to your mobile phone</p>
    </header>

    <div class="video-card">
      <div class="video-wrapper">
        <video 
          id="player" 
          src="${streamUrl}" 
          playsinline 
          controls 
          preload="metadata"
          poster=""
        ></video>
      </div>
      <div class="meta-bar">
        <span>Recorded: ${createdDate}</span>
        <span>Size: ${fileSizeMB} MB</span>
      </div>
    </div>

    <div class="actions-card">
      <a id="btnDownload" href="${downloadUrl}" class="btn btn-primary" download>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        Download Video
      </a>

      <button id="btnShare" class="btn btn-secondary">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
        Share with Friends
      </button>

      <p class="tip">Tap Download to save this video directly to your gallery / downloads folder.</p>
    </div>

    <footer class="footer">
      Powered by AR 360 Video Booth &bull; Unique Secure Link
    </footer>
  </div>

  <script>
    const shareBtn = document.getElementById('btnShare');
    const pageUrl = window.location.href;
    const title = 'My AR 360 Video';

    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: 'Check out my AR 360 Video!',
            url: pageUrl
          });
        } catch (err) {
          // Share was cancelled or failed
        }
      } else {
        // Fallback: copy link to clipboard
        navigator.clipboard.writeText(pageUrl).then(() => {
          shareBtn.innerHTML = 'Link Copied to Clipboard!';
          setTimeout(() => {
            shareBtn.innerHTML = \`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg> Share with Friends\`;
          }, 2000);
        });
      }
    });
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch {
      const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Not Found</title>
  <style>
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 1rem;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      max-width: 400px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f87171; }
    p { color: #94a3b8; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Video Link Not Found</h1>
    <p>This video link may have expired or is invalid. Please scan the QR code displayed on the booth screen again.</p>
  </div>
</body>
</html>`;
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(errorHtml);
    }
  }
}
