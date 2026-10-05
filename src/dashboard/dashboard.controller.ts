import { Controller, Get, Res } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service.js';
import type { Response } from 'express';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly appConfig: AppConfigService) {}

  @Get()
  renderDashboard(@Res() res: Response) {
    const defaultUser = this.appConfig.adminUsername;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AR Booth &bull; Analytics & Video Management Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script>
    (function() {
      try {
        if (localStorage.getItem('booth_auth_token')) {
          document.documentElement.classList.add('is-authenticated');
        }
      } catch (e) {}
    })();
  </script>
  <style>
    /* Instant Auth State - Completely eliminates login screen flicker on refresh */
    html.is-authenticated #loginScreen {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    html.is-authenticated #dashboardContainer {
      filter: none !important;
      opacity: 1 !important;
    }

    :root {
      --bg: #090d16;
      --surface: rgba(17, 24, 39, 0.75);
      --surface-card: rgba(17, 24, 39, 0.85);
      --surface-border: rgba(255, 255, 255, 0.08);
      --surface-hover: rgba(255, 255, 255, 0.04);
      --primary: #6366f1;
      --primary-light: #818cf8;
      --accent: #ec4899;
      --emerald: #10b981;
      --amber: #f59e0b;
      --rose: #f43f5e;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --radius: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 15% 10%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 90%, rgba(236, 72, 153, 0.1) 0%, transparent 40%);
      background-attachment: fixed;
      padding: 2rem 1.5rem;
      position: relative;
    }

    /* Login Screen Overlay */
    #loginScreen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.18) 0%, rgba(9, 13, 22, 0.95) 75%);
      backdrop-filter: blur(20px);
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    #loginScreen.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15);
      position: relative;
      overflow: hidden;
      animation: modalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .login-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--accent), var(--emerald));
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-logo {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    }

    .login-logo svg {
      width: 28px;
      height: 28px;
      color: #fff;
    }

    .login-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.4rem;
    }

    .login-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .input-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      color: var(--text-dim);
      pointer-events: none;
      display: flex;
    }

    .login-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 0.85rem 1rem 0.85rem 2.85rem;
      color: var(--text);
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .login-input:focus {
      outline: none;
      border-color: var(--primary);
      background: rgba(15, 23, 42, 0.9);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }

    .btn-toggle-pwd {
      position: absolute;
      right: 0.85rem;
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }

    .btn-toggle-pwd:hover {
      color: var(--text);
    }

    .btn-login {
      margin-top: 0.5rem;
      padding: 0.9rem;
      background: linear-gradient(135deg, var(--primary), #4f46e5);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: inherit;
    }

    .btn-login:hover {
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
    }

    .btn-login:active {
      transform: translateY(0);
    }

    .btn-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .login-error {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fda4af;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      animation: shake 0.35s ease;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }


    /* Main Dashboard Layout */
    .dashboard-container {
      max-width: 1360px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      transition: opacity 0.3s ease;
    }

    .dashboard-container.blurred {
      filter: blur(8px);
      pointer-events: none;
      user-select: none;
    }

    /* Top Navigation / Header */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: var(--surface);
      border: 1px solid var(--surface-border);
      padding: 1.25rem 1.75rem;
      border-radius: var(--radius);
      backdrop-filter: blur(16px);
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }

    .brand-icon svg {
      width: 24px;
      height: 24px;
      color: #fff;
    }

    .brand-text h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-text p {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.85rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--surface-border);
      border-radius: 9999px;
      font-size: 0.8rem;
      color: var(--text);
    }

    .user-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
    }

    .badge-live {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.8rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      font-family: inherit;
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--surface-border);
      color: var(--text);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-primary {
      background: var(--primary);
      color: #fff;
    }

    .btn-primary:hover {
      background: var(--primary-light);
    }

    .btn-danger {
      background: rgba(244, 63, 94, 0.12);
      border-color: rgba(244, 63, 94, 0.3);
      color: #f87171;
    }

    .btn-danger:hover {
      background: rgba(244, 63, 94, 0.25);
      border-color: rgba(244, 63, 94, 0.5);
    }

    /* Quick Date Filter Toolbar */
    .quick-filter-bar {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      padding: 1rem 1.4rem;
      backdrop-filter: blur(16px);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .filter-left-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .filter-pills {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .filter-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--surface-border);
      color: var(--text-muted);
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      font-family: inherit;
    }

    .filter-pill:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .filter-pill.active {
      background: linear-gradient(135deg, var(--primary), #4f46e5);
      color: #fff;
      border-color: rgba(99, 102, 241, 0.6);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }

    .filter-custom-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .date-input-wrap {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.35rem 0.65rem;
    }

    .date-input-wrap label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .date-input-wrap input[type="date"] {
      background: transparent;
      border: none;
      color: var(--text);
      font-size: 0.8rem;
      outline: none;
      font-family: inherit;
      color-scheme: dark;
    }

    .filter-status-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.75rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.35);
      color: var(--primary-light);
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .btn-clear-filter {
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      font-size: 1.1rem;
      line-height: 1;
      border-radius: 4px;
      transition: color 0.15s;
    }

    .btn-clear-filter:hover {
      color: #f43f5e;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      padding: 1.5rem;
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.16);
    }

    .kpi-card.interactive {
      cursor: pointer;
    }

    .kpi-card.interactive:hover {
      border-color: rgba(99, 102, 241, 0.45);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 16px rgba(99, 102, 241, 0.15);
    }

    .kpi-card-badge {
      position: absolute;
      top: 0.65rem;
      right: 0.85rem;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.18rem 0.45rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-dim);
      transition: all 0.2s;
    }

    .kpi-card.interactive:hover .kpi-card-badge {
      background: rgba(99, 102, 241, 0.25);
      color: var(--primary-light);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-title {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .kpi-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-icon-wrap svg {
      width: 18px;
      height: 18px;
    }

    .icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .icon-pink { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
    .icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

    .kpi-value {
      font-family: 'Outfit', sans-serif;
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .kpi-footer {
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      padding: 1.5rem;
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .chart-box {
      position: relative;
      height: 280px;
      width: 100%;
    }

    /* Video Table Section */
    .table-section {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      padding: 1.5rem;
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .filters-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .search-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.5rem 0.9rem;
      color: var(--text);
      font-size: 0.85rem;
      outline: none;
      transition: all 0.2s;
      min-width: 220px;
      font-family: inherit;
    }

    .search-input:focus {
      border-color: var(--primary);
      background: rgba(255, 255, 255, 0.08);
    }

    .date-filter {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      color: var(--text);
      font-size: 0.85rem;
      outline: none;
      font-family: inherit;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    th {
      padding: 0.85rem 1rem;
      color: var(--text-dim);
      font-weight: 600;
      border-bottom: 1px solid var(--surface-border);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text);
      vertical-align: middle;
    }

    tr:hover td {
      background: var(--surface-hover);
    }

    .token-tag {
      font-family: monospace;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.07);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      color: var(--primary-light);
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--surface-border);
      color: var(--text-muted);
      padding: 0.4rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .btn-action:hover {
      background: rgba(255, 255, 255, 0.12);
      color: var(--text);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-delete:hover {
      background: rgba(244, 63, 94, 0.15);
      color: #fda4af;
      border-color: rgba(244, 63, 94, 0.3);
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s ease;
      padding: 1rem;
    }

    .modal-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .modal-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 18px;
      width: 100%;
      max-width: 580px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      transform: scale(0.95);
      transition: transform 0.25s ease;
    }

    .modal-overlay.open .modal-card {
      transform: scale(1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .modal-video-wrapper video {
      width: 100%;
      max-height: 380px;
      background: #000;
      border-radius: 12px;
      outline: none;
    }

    .modal-qr-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .modal-qr-wrapper img {
      width: 220px;
      height: 220px;
      border-radius: 12px;
      background: #fff;
      padding: 8px;
    }
  </style>
</head>
<body>

  <!-- 1. LOGIN OVERLAY -->
  <div id="loginScreen">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        </div>
        <h2 class="login-title">AR Booth Portal</h2>
        <p class="login-subtitle">Sign in to access analytics & manage booth recordings</p>
      </div>

      <div id="loginError" class="login-error" style="display: none;"></div>

      <form id="loginForm" class="login-form" autocomplete="on">
        <div class="input-group">
          <label class="input-label" for="loginUser">Username</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </span>
            <input type="text" id="loginUser" class="login-input" placeholder="Username" required autofocus>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="loginPass">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </span>
            <input type="password" id="loginPass" class="login-input" placeholder="Password" required>
            <button type="button" id="btnTogglePassword" class="btn-toggle-pwd" title="Show/Hide Password">
              <svg id="eyeIcon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>
        </div>

        <button type="submit" id="btnLoginSubmit" class="btn-login">
          <span>Sign In to Dashboard</span>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </form>
    </div>
  </div>

  <!-- 2. MAIN DASHBOARD CONTENT -->
  <div id="dashboardContainer" class="dashboard-container blurred">
    <!-- Header -->
    <header class="top-bar">
      <div class="brand-group">
        <div class="brand-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        </div>
        <div class="brand-text">
          <h1>AR Video Booth Live Metrics</h1>
          <p>Real-time upload tracking, attendance statistics & video management</p>
        </div>
      </div>

      <div class="header-actions">
        <div class="badge-live">
          <span class="pulse-dot"></span>
          <span>Live Tracking</span>
        </div>

        <div class="user-pill">
          <span class="user-avatar" id="avatarInitial">A</span>
          <span id="headerUser">${defaultUser}</span>
        </div>

        <button id="btnRefresh" class="btn btn-outline">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>

        <button id="btnOpenUploadModal" class="btn btn-outline" style="border-color: rgba(99, 102, 241, 0.4); color: var(--primary-light);">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          Upload Video
        </button>

        <a id="btnExportCsv" href="#" class="btn btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export CSV
        </a>

        <button id="btnLogout" class="btn btn-danger" title="Sign out of the dashboard">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          Logout
        </button>
      </div>
    </header>

    <!-- Quick Date Filter Toolbar -->
    <section class="quick-filter-bar">
      <div class="filter-left-group">
        <span class="filter-label">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
          Quick Filter:
        </span>
        <div class="filter-pills" id="filterPillsContainer">
          <button type="button" class="filter-pill active" data-preset="all">All Time</button>
          <button type="button" class="filter-pill" data-preset="today">Today</button>
          <button type="button" class="filter-pill" data-preset="yesterday">Yesterday</button>
          <button type="button" class="filter-pill" data-preset="last7">Last 7 Days</button>
          <button type="button" class="filter-pill" data-preset="last30">Last 30 Days</button>
          <button type="button" class="filter-pill" data-preset="thisMonth">This Month</button>
        </div>
      </div>

      <div class="filter-custom-group">
        <div class="date-input-wrap">
          <label for="filterStartDate">From</label>
          <input type="date" id="filterStartDate">
        </div>
        <div class="date-input-wrap">
          <label for="filterEndDate">To</label>
          <input type="date" id="filterEndDate">
        </div>
        <button type="button" id="btnApplyCustomDate" class="btn btn-primary" style="padding: 0.38rem 0.85rem; font-size: 0.8rem;">Apply</button>
        <button type="button" id="btnResetDate" class="btn btn-outline" style="padding: 0.38rem 0.85rem; font-size: 0.8rem;">Reset</button>
        <div id="filterStatusTag" class="filter-status-tag" style="display: none;">
          <span id="filterStatusText">All Time</span>
          <button type="button" id="btnClearFilter" class="btn-clear-filter" title="Clear filter">&times;</button>
        </div>
      </div>
    </section>

    <!-- KPI Cards -->
    <section class="kpi-grid">
      <div class="kpi-card interactive" id="cardToday" title="Click to filter by Today">
        <span class="kpi-card-badge" id="cardTodayBadge">Filter Today</span>
        <div class="kpi-header">
          <span class="kpi-title" id="statTodayTitle">Today's Videos</span>
          <div class="kpi-icon-wrap icon-indigo">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
        </div>
        <div id="statToday" class="kpi-value">0</div>
        <div class="kpi-footer" id="statTodayFooter">Videos recorded today</div>
      </div>

      <div class="kpi-card interactive" id="cardTotal" title="Click to view All-Time records">
        <span class="kpi-card-badge">All Time</span>
        <div class="kpi-header">
          <span class="kpi-title" id="statTotalTitle">Total Videos</span>
          <div class="kpi-icon-wrap icon-emerald">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>
          </div>
        </div>
        <div id="statTotal" class="kpi-value">0</div>
        <div class="kpi-footer" id="statTotalFooter">All-time booth recordings</div>
      </div>

      <div class="kpi-card" id="cardStorage">
        <div class="kpi-header">
          <span class="kpi-title" id="statStorageTitle">Storage Used</span>
          <div class="kpi-icon-wrap icon-pink">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 5h16"/></svg>
          </div>
        </div>
        <div id="statStorage" class="kpi-value">0 B</div>
        <div id="statAvg" class="kpi-footer">Avg file size: 0 B</div>
      </div>

      <div class="kpi-card" id="cardDownloads">
        <div class="kpi-header">
          <span class="kpi-title" id="statDownloadsTitle">Scans & Downloads</span>
          <div class="kpi-icon-wrap icon-amber">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          </div>
        </div>
        <div id="statDownloads" class="kpi-value">0</div>
        <div class="kpi-footer" id="statDownloadsFooter">QR scans and file downloads</div>
      </div>
    </section>

    <!-- Charts -->
    <section class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">Daily Upload Trend (Last 14 Days)</h2>
          <span class="badge-live" style="background: rgba(99, 102, 241, 0.12); border-color: rgba(99, 102, 241, 0.3); color: #818cf8;">Upload Volume</span>
        </div>
        <div class="chart-box">
          <canvas id="dailyChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">Peak Booth Hours</h2>
          <span class="badge-live" style="background: rgba(236, 72, 153, 0.12); border-color: rgba(236, 72, 153, 0.3); color: #f472b6;">24h Traffic</span>
        </div>
        <div class="chart-box">
          <canvas id="hourlyChart"></canvas>
        </div>
      </div>
    </section>

    <!-- Video Management Table -->
    <section class="table-section">
      <div class="table-header">
        <div>
          <h2 class="chart-title">Recorded Videos</h2>
          <p id="tableFilterNotice" style="font-size: 0.85rem; color: var(--text-muted);">Manage attendee recordings, view QR codes, and preview clips</p>
        </div>
        <div class="filters-bar">
          <input type="text" id="searchInput" class="search-input" placeholder="Search by token or filename...">
          <input type="date" id="dateFilter" class="date-filter" title="Filter table by single date">
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Filename</th>
              <th>Size</th>
              <th>Created</th>
              <th>Downloads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="videosTableBody">
            <tr>
              <td colspan="6" style="text-align: center; color: var(--text-dim); padding: 2rem;">Loading videos...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span id="pageInfo">Showing 0 of 0 videos</span>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btnPrev" class="btn btn-outline" style="padding: 0.35rem 0.75rem;">&larr; Prev</button>
          <button id="btnNext" class="btn btn-outline" style="padding: 0.35rem 0.75rem;">Next &rarr;</button>
        </div>
      </div>
    </section>
  </div>

  <!-- Video Preview Modal -->
  <div id="videoModal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">Video Preview</h3>
        <button id="closeVideoModal" class="modal-close">&times;</button>
      </div>
      <div class="modal-video-wrapper">
        <video id="modalVideoPlayer" controls playsinline></video>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span id="modalVideoInfo" style="font-size: 0.85rem; color: var(--text-muted);"></span>
        <a id="modalDownloadBtn" href="#" class="btn btn-primary" download>Download Video</a>
      </div>
    </div>
  </div>

  <!-- QR Code Modal -->
  <div id="qrModal" class="modal-overlay">
    <div class="modal-card" style="text-align: center;">
      <div class="modal-header">
        <h3 class="modal-title">Scan QR to Download</h3>
        <button id="closeQrModal" class="modal-close">&times;</button>
      </div>
      <div class="modal-qr-wrapper">
        <img id="modalQrImg" src="" alt="QR Code">
        <p style="font-size: 0.85rem; color: var(--text-muted);">Attendee scans this code with their smartphone camera to open and download their video.</p>
        <input type="text" id="modalQrUrl" class="search-input" style="width: 100%; text-align: center;" readonly>
        <button id="btnCopyModalUrl" class="btn btn-outline" style="width: 100%; justify-content: center;">Copy Shareable Link</button>
      </div>
    </div>
  </div>

  <!-- Upload Test Video Modal -->
  <div id="uploadModal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">Test Video Upload</h3>
        <button id="closeUploadModal" class="modal-close">&times;</button>
      </div>

      <div id="uploadFormView">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Select or drag an MP4 or WebM video file to test upload, QR generation, and attendee download flow.
        </p>

        <div style="border: 2px dashed var(--surface-border); border-radius: 12px; padding: 2rem 1.5rem; text-align: center; background: rgba(255, 255, 255, 0.02); cursor: pointer;" id="dropzoneBox">
          <input type="file" id="modalFileInput" accept="video/mp4,video/webm,video/quicktime" style="display: none;">
          <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 0.75rem; color: var(--primary-light);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
          <div id="selectedFileName" style="font-weight: 600; font-size: 0.95rem;">Click to select video or drag & drop</div>
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">Supports MP4, WebM, MOV (up to 250 MB)</div>
        </div>

        <div id="uploadError" class="login-error" style="display: none; margin-top: 1rem;"></div>

        <button type="button" id="btnStartUpload" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1.25rem;" disabled>
          <span>Upload and Generate QR</span>
        </button>
      </div>

      <!-- Upload Success View -->
      <div id="uploadSuccessView" style="display: none; text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10b981; margin-bottom: 0.75rem;">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h4 style="font-size: 1.1rem; font-weight: 700;">Upload Complete!</h4>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;" id="successFileName"></p>

        <div style="margin: 1rem 0;">
          <img id="uploadResultQrImg" src="" alt="QR Code" style="width: 180px; height: 180px; border-radius: 12px; background: #fff; padding: 6px;">
        </div>

        <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1rem;">Scan this QR with your smartphone camera or click below to test the attendee landing page:</p>

        <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
          <a id="btnTestLanding" href="#" target="_blank" class="btn btn-primary" style="font-size: 0.82rem;">Open Landing Page &rarr;</a>
          <a id="btnTestDownload" href="#" class="btn btn-outline" download style="font-size: 0.82rem;">Direct Download</a>
          <button type="button" id="btnUploadAnother" class="btn btn-outline" style="font-size: 0.82rem;">Upload Another</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const AUTH_KEY = 'booth_auth_token';
    let dailyChart = null;
    let hourlyChart = null;
    let currentPage = 1;
    let searchDebounce = null;
    let refreshInterval = null;
    let currentVideosList = [];

    let currentStartDate = '';
    let currentEndDate = '';
    let currentFilterPreset = 'all';
    let currentFilterLabel = 'All Time';

    function getLocalDateStr(d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    function getPresetDates(preset) {
      const now = new Date();
      const todayStr = getLocalDateStr(now);

      if (preset === 'today') {
        return { start: todayStr, end: todayStr, label: 'Today (' + todayStr + ')' };
      }
      if (preset === 'yesterday') {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yStr = getLocalDateStr(y);
        return { start: yStr, end: yStr, label: 'Yesterday (' + yStr + ')' };
      }
      if (preset === 'last7') {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        return { start: getLocalDateStr(d), end: todayStr, label: 'Last 7 Days' };
      }
      if (preset === 'last30') {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        return { start: getLocalDateStr(d), end: todayStr, label: 'Last 30 Days' };
      }
      if (preset === 'thisMonth') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: getLocalDateStr(first), end: todayStr, label: 'This Month' };
      }
      return { start: '', end: '', label: 'All Time' };
    }

    function updateExportCsvHref() {
      const token = getStoredToken();
      const csvBtn = document.getElementById('btnExportCsv');
      let href = '/api/analytics/export-csv?token=' + encodeURIComponent(token);
      if (currentStartDate) href += '&startDate=' + encodeURIComponent(currentStartDate);
      if (currentEndDate) href += '&endDate=' + encodeURIComponent(currentEndDate);
      csvBtn.href = href;
    }

    // --- Authentication Helpers ---
    function getStoredToken() {
      return localStorage.getItem(AUTH_KEY) || '';
    }

    function setStoredToken(token) {
      if (token) {
        localStorage.setItem(AUTH_KEY, token);
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    }

    async function fetchWithAuth(url, options = {}) {
      const token = getStoredToken();
      const headers = Object.assign({}, options.headers || {});
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const res = await fetch(url, Object.assign({}, options, { headers }));
      if (res.status === 401) {
        showLoginScreen('Session expired or unauthorized. Please sign in again.');
        throw new Error('Unauthorized');
      }
      return res;
    }

    function showLoginScreen(errorMessage = '') {
      document.documentElement.classList.remove('is-authenticated');
      setStoredToken('');
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
      const loginScreen = document.getElementById('loginScreen');
      const dashboard = document.getElementById('dashboardContainer');
      loginScreen.classList.remove('hidden');
      dashboard.classList.add('blurred');

      const errEl = document.getElementById('loginError');
      if (errorMessage) {
        errEl.textContent = errorMessage;
        errEl.style.display = 'flex';
      } else {
        errEl.style.display = 'none';
      }
    }

    function hideLoginScreen(username = 'Admin') {
      document.documentElement.classList.add('is-authenticated');
      const loginScreen = document.getElementById('loginScreen');
      const dashboard = document.getElementById('dashboardContainer');
      loginScreen.classList.add('hidden');
      dashboard.classList.remove('blurred');

      document.getElementById('headerUser').textContent = username;
      document.getElementById('avatarInitial').textContent = (username[0] || 'A').toUpperCase();

      updateExportCsvHref();
    }

    async function checkAuth() {
      const token = getStoredToken();
      if (!token) {
        showLoginScreen();
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const data = await res.json();
          hideLoginScreen(data.user?.username || 'Admin');
          startDashboard();
        } else {
          showLoginScreen();
        }
      } catch {
        showLoginScreen();
      }
    }

    // --- Charts Setup ---
    function initCharts() {
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js library is not available');
        return;
      }
      if (dailyChart && hourlyChart) return;

      const dailyCtx = document.getElementById('dailyChart').getContext('2d');
      dailyChart = new Chart(dailyCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Videos Recorded',
            data: [],
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: '#818cf8',
            borderWidth: 1.5,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111827',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              titleFont: { family: 'Inter', weight: 600 },
              bodyFont: { family: 'Inter' }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748b', stepSize: 1, font: { family: 'Inter', size: 11 } }
            }
          }
        }
      });

      const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');
      hourlyChart = new Chart(hourlyCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Uploads',
            data: [],
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ec4899',
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111827',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { family: 'Inter', size: 10 }, maxTicksLimit: 8 }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748b', stepSize: 1, font: { family: 'Inter', size: 10 } }
            }
          }
        }
      });
    }

    async function loadSummary() {
      try {
        let url = '/api/analytics/summary';
        const params = new URLSearchParams();
        if (currentStartDate) params.set('startDate', currentStartDate);
        if (currentEndDate) params.set('endDate', currentEndDate);
        const qs = params.toString();
        if (qs) url += '?' + qs;

        const res = await fetchWithAuth(url);
        const data = await res.json();

        // Always display all-time total in Card 2
        document.getElementById('statTotal').textContent = data.totalVideos;

        const statToday = document.getElementById('statToday');
        const statTodayTitle = document.getElementById('statTodayTitle');
        const statTodayFooter = document.getElementById('statTodayFooter');

        const statStorage = document.getElementById('statStorage');
        const statStorageTitle = document.getElementById('statStorageTitle');
        const statAvg = document.getElementById('statAvg');

        const statDownloads = document.getElementById('statDownloads');
        const statDownloadsTitle = document.getElementById('statDownloadsTitle');
        const statDownloadsFooter = document.getElementById('statDownloadsFooter');

        if (data.isFiltered) {
          if (currentFilterPreset === 'today') {
            statTodayTitle.textContent = "Today's Videos";
            statToday.textContent = data.periodVideos;
            statTodayFooter.textContent = "Videos recorded today";
          } else {
            statTodayTitle.textContent = "Filtered Videos";
            statToday.textContent = data.periodVideos;
            statTodayFooter.textContent = currentFilterLabel || "In selected period";
          }

          statStorageTitle.textContent = "Period Storage";
          statStorage.textContent = data.periodStorageFormatted;
          statAvg.textContent = "Avg file size: " + data.periodAverageSizeFormatted;

          statDownloadsTitle.textContent = "Period Downloads";
          statDownloads.textContent = data.periodDownloads;
          statDownloadsFooter.textContent = "Downloads in selected period";
        } else {
          statTodayTitle.textContent = "Today's Videos";
          statToday.textContent = data.todayVideos;
          statTodayFooter.textContent = "Videos recorded today";

          statStorageTitle.textContent = "Storage Used";
          statStorage.textContent = data.totalStorageFormatted;
          statAvg.textContent = "Avg file size: " + data.averageSizeFormatted;

          statDownloadsTitle.textContent = "Scans & Downloads";
          statDownloads.textContent = data.totalDownloads;
          statDownloadsFooter.textContent = "QR scans and file downloads";
        }
      } catch (err) {
        console.error('Failed to load summary metrics:', err);
      }
    }

    async function loadDailyChart(days = 14) {
      try {
        const res = await fetchWithAuth('/api/analytics/daily-chart?days=' + days);
        const data = await res.json();
        if (dailyChart) {
          dailyChart.data.labels = data.map(d => d.label);
          dailyChart.data.datasets[0].data = data.map(d => d.count);
          dailyChart.update();
        }
      } catch (err) {
        console.error('Failed to load daily chart:', err);
      }
    }

    async function loadHourlyChart() {
      try {
        const res = await fetchWithAuth('/api/analytics/hourly-chart');
        const data = await res.json();
        if (hourlyChart) {
          hourlyChart.data.labels = data.map(d => d.label);
          hourlyChart.data.datasets[0].data = data.map(d => d.count);
          hourlyChart.update();
        }
      } catch (err) {
        console.error('Failed to load hourly chart:', err);
      }
    }

    async function loadVideos() {
      const search = document.getElementById('searchInput').value;
      const tbody = document.getElementById('videosTableBody');

      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: 10,
          search: search || '',
        });

        if (currentStartDate) params.set('startDate', currentStartDate);
        if (currentEndDate) params.set('endDate', currentEndDate);

        const res = await fetchWithAuth('/api/videos?' + params.toString());
        const data = await res.json();

        if (data.items.length === 0) {
          currentVideosList = [];
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 2.5rem;">No recordings found for the selected period.</td></tr>';
          document.getElementById('pageInfo').textContent = 'Showing 0 of 0 videos';
          return;
        }

        currentVideosList = data.items || [];
        tbody.innerHTML = currentVideosList.map((v, idx) => {
          const formattedDate = new Date(v.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const originalOrFile = v.originalName || v.filename;

          return '<tr>' +
            '<td><span class="token-tag">' + v.token.slice(0, 8) + '...</span></td>' +
            '<td><strong>' + originalOrFile + '</strong></td>' +
            '<td>' + v.sizeFormatted + '</td>' +
            '<td style="color: var(--text-muted); font-size: 0.82rem;">' + formattedDate + '</td>' +
            '<td><span style="display: inline-flex; align-items: center; gap: 0.25rem;"><span style="color: #10b981;">&darr;</span> ' + v.downloadCount + '</span></td>' +
            '<td>' +
              '<div class="actions-cell">' +
                '<button class="btn-action" onclick="actionPreview(' + idx + ')">Preview</button>' +
                '<button class="btn-action" onclick="actionQr(' + idx + ')">QR</button>' +
                '<button class="btn-action" onclick="actionCopy(' + idx + ')">Copy</button>' +
                '<a href="' + v.downloadUrl + '" class="btn-action" download>Save</a>' +
                '<button class="btn-action btn-delete" onclick="actionDelete(' + idx + ')">Delete</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        }).join('');

        const startIdx = (data.page - 1) * data.limit + 1;
        const endIdx = Math.min(data.page * data.limit, data.total);
        document.getElementById('pageInfo').textContent = 'Showing ' + startIdx + '-' + endIdx + ' of ' + data.total + ' videos';

        document.getElementById('btnPrev').disabled = currentPage <= 1;
        document.getElementById('btnNext').disabled = currentPage >= data.totalPages;
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--rose); padding: 2rem;">Error loading videos.</td></tr>';
      }
    }

    function applyDateFilter(preset, customStart = '', customEnd = '', customLabel = '') {
      currentFilterPreset = preset;
      if (preset === 'custom') {
        currentStartDate = customStart;
        currentEndDate = customEnd;
        currentFilterLabel = customLabel || (customStart && customEnd ? (customStart + ' to ' + customEnd) : (customStart ? ('From ' + customStart) : ('Until ' + customEnd)));
      } else {
        const p = getPresetDates(preset);
        currentStartDate = p.start;
        currentEndDate = p.end;
        currentFilterLabel = p.label;
      }

      // Update pills UI
      document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.dataset.preset === preset) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update Custom Inputs
      document.getElementById('filterStartDate').value = currentStartDate;
      document.getElementById('filterEndDate').value = currentEndDate;

      // Update Status Badge
      const statusTag = document.getElementById('filterStatusTag');
      const statusText = document.getElementById('filterStatusText');
      if (currentStartDate || currentEndDate) {
        statusText.textContent = currentFilterLabel;
        statusTag.style.display = 'inline-flex';
      } else {
        statusTag.style.display = 'none';
      }

      // Update Table header notice
      const tableNotice = document.getElementById('tableFilterNotice');
      if (tableNotice) {
        if (currentStartDate || currentEndDate) {
          tableNotice.innerHTML = 'Showing recordings filtered by: <strong style="color: var(--primary-light);">' + currentFilterLabel + '</strong>';
        } else {
          tableNotice.textContent = 'Manage attendee recordings, view QR codes, and preview clips';
        }
      }

      // Sync Table single-date picker
      const dateFilterEl = document.getElementById('dateFilter');
      if (currentStartDate && currentStartDate === currentEndDate) {
        dateFilterEl.value = currentStartDate;
      } else {
        dateFilterEl.value = '';
      }

      // Update Card 1 badge
      const cardTodayBadge = document.getElementById('cardTodayBadge');
      if (cardTodayBadge) {
        cardTodayBadge.textContent = preset === 'today' ? 'Active' : 'Filter Today';
      }

      updateExportCsvHref();

      // Reset page & reload
      currentPage = 1;
      loadSummary();
      loadVideos();

      // Adapt daily chart range
      if (preset === 'last30') {
        loadDailyChart(30);
      } else if (preset === 'last7') {
        loadDailyChart(7);
      } else {
        loadDailyChart(14);
      }
    }

    function resetDateFilter() {
      applyDateFilter('all');
    }

    function actionPreview(idx) {
      const v = currentVideosList[idx];
      if (!v) return;
      openPreviewModal(v.streamUrl, v.token, v.originalName || v.filename);
    }

    function actionQr(idx) {
      const v = currentVideosList[idx];
      if (!v) return;
      openQrModal(v.qrCodeUrl, v.viewUrl);
    }

    function actionCopy(idx) {
      const v = currentVideosList[idx];
      if (!v) return;
      copyLink(v.viewUrl);
    }

    function actionDelete(idx) {
      const v = currentVideosList[idx];
      if (!v) return;
      deleteVideoPrompt(v.token);
    }

    function openPreviewModal(streamUrl, token, filename) {
      const modal = document.getElementById('videoModal');
      const player = document.getElementById('modalVideoPlayer');
      player.src = streamUrl;
      document.getElementById('modalVideoInfo').textContent = filename + ' (' + token.slice(0, 8) + '...)';
      document.getElementById('modalDownloadBtn').href = '/api/videos/' + token + '/download';
      modal.classList.add('open');
      player.play().catch(() => {});
    }

    function openQrModal(qrUrl, viewUrl) {
      const modal = document.getElementById('qrModal');
      document.getElementById('modalQrImg').src = qrUrl;
      document.getElementById('modalQrUrl').value = viewUrl;
      modal.classList.add('open');
    }

    function copyLink(url) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Copied video link to clipboard: ' + url);
      });
    }

    async function deleteVideoPrompt(token) {
      if (!confirm('Are you sure you want to permanently delete this video?')) return;
      try {
        const res = await fetchWithAuth('/api/videos/' + token, { method: 'DELETE' });
        if (res.ok) {
          refreshAll();
        } else {
          alert('Failed to delete video');
        }
      } catch (err) {
        alert('Error deleting video: ' + err.message);
      }
    }

    function refreshAll() {
      loadSummary();
      loadDailyChart();
      loadHourlyChart();
      loadVideos();
    }

    function startDashboard() {
      initCharts();
      refreshAll();
      if (!refreshInterval) {
        // Auto-refresh every 12 seconds
        refreshInterval = setInterval(refreshAll, 12000);
      }
    }

    // --- DOM Event Listeners ---
    window.addEventListener('DOMContentLoaded', () => {
      // Login Form Submission
      const loginForm = document.getElementById('loginForm');
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value;
        const errEl = document.getElementById('loginError');
        const submitBtn = document.getElementById('btnLoginSubmit');

        errEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Verifying...</span>';

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            setStoredToken(data.token);
            hideLoginScreen(data.user?.username || username);
            startDashboard();
          } else {
            errEl.textContent = data.message || 'Invalid username or password';
            errEl.style.display = 'flex';
          }
        } catch (err) {
          errEl.textContent = 'Connection error: ' + err.message;
          errEl.style.display = 'flex';
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In to Dashboard</span><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
        }
      });

      // Show/Hide Password Toggle
      document.getElementById('btnTogglePassword').addEventListener('click', () => {
        const passInput = document.getElementById('loginPass');
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
      });

      // Logout Button
      document.getElementById('btnLogout').addEventListener('click', async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        showLoginScreen('You have been signed out.');
      });

      // Refresh Button
      document.getElementById('btnRefresh').addEventListener('click', refreshAll);

      // Quick Filter Pills
      document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          applyDateFilter(btn.dataset.preset);
        });
      });

      // Custom Date Range Apply
      document.getElementById('btnApplyCustomDate').addEventListener('click', () => {
        const s = document.getElementById('filterStartDate').value;
        const e = document.getElementById('filterEndDate').value;
        if (!s && !e) {
          resetDateFilter();
          return;
        }
        if (s && e && s > e) {
          applyDateFilter('custom', e, s);
        } else {
          applyDateFilter('custom', s, e);
        }
      });

      // Reset & Clear Filter Buttons
      document.getElementById('btnResetDate').addEventListener('click', resetDateFilter);
      document.getElementById('btnClearFilter').addEventListener('click', resetDateFilter);

      // Interactive KPI Cards
      document.getElementById('cardToday').addEventListener('click', () => {
        applyDateFilter('today');
      });
      document.getElementById('cardTotal').addEventListener('click', () => {
        resetDateFilter();
      });

      // Search & Date filters
      document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          currentPage = 1;
          loadVideos();
        }, 300);
      });

      document.getElementById('dateFilter').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          applyDateFilter('custom', val, val, val);
        } else {
          resetDateFilter();
        }
      });

      // Pagination
      document.getElementById('btnPrev').addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          loadVideos();
        }
      });

      document.getElementById('btnNext').addEventListener('click', () => {
        currentPage++;
        loadVideos();
      });

      // Modals
      document.getElementById('closeVideoModal').addEventListener('click', () => {
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('modalVideoPlayer');
        player.pause();
        player.src = '';
        modal.classList.remove('open');
      });

      document.getElementById('closeQrModal').addEventListener('click', () => {
        document.getElementById('qrModal').classList.remove('open');
      });

      document.getElementById('btnCopyModalUrl').addEventListener('click', () => {
        const url = document.getElementById('modalQrUrl').value;
        navigator.clipboard.writeText(url).then(() => {
          const btn = document.getElementById('btnCopyModalUrl');
          btn.textContent = 'Copied to Clipboard!';
          setTimeout(() => { btn.textContent = 'Copy Shareable Link'; }, 2000);
        });
      });

      // Upload Modal Handlers
      const uploadModal = document.getElementById('uploadModal');
      const dropzone = document.getElementById('dropzoneBox');
      const fileInput = document.getElementById('modalFileInput');
      const uploadBtn = document.getElementById('btnStartUpload');
      const uploadError = document.getElementById('uploadError');
      let selectedUploadFile = null;

      function handleFileSelected(file) {
        selectedUploadFile = file;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        document.getElementById('selectedFileName').textContent = file.name + ' (' + sizeMb + ' MB)';
        uploadBtn.disabled = false;
        uploadError.style.display = 'none';
      }

      document.getElementById('btnOpenUploadModal').addEventListener('click', () => {
        selectedUploadFile = null;
        fileInput.value = '';
        document.getElementById('selectedFileName').textContent = 'Click to select video or drag & drop';
        uploadBtn.disabled = true;
        uploadError.style.display = 'none';
        document.getElementById('uploadFormView').style.display = 'block';
        document.getElementById('uploadSuccessView').style.display = 'none';
        uploadModal.classList.add('open');
      });

      document.getElementById('closeUploadModal').addEventListener('click', () => {
        uploadModal.classList.remove('open');
      });

      dropzone.addEventListener('click', () => {
        fileInput.click();
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.background = 'rgba(99, 102, 241, 0.08)';
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--surface-border)';
        dropzone.style.background = 'rgba(255, 255, 255, 0.02)';
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--surface-border)';
        dropzone.style.background = 'rgba(255, 255, 255, 0.02)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileSelected(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          handleFileSelected(fileInput.files[0]);
        }
      });

      uploadBtn.addEventListener('click', async () => {
        if (!selectedUploadFile) return;

        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span>Uploading & generating QR...</span>';
        uploadError.style.display = 'none';

        const formData = new FormData();
        formData.append('video', selectedUploadFile);

        try {
          const res = await fetch('/api/videos/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();

          if (res.ok && data.success) {
            document.getElementById('uploadFormView').style.display = 'none';
            document.getElementById('uploadSuccessView').style.display = 'block';
            document.getElementById('successFileName').textContent = selectedUploadFile.name;
            document.getElementById('uploadResultQrImg').src = data.qrCode || data.qrCodeApiUrl;
            document.getElementById('btnTestLanding').href = data.viewUrl;
            document.getElementById('btnTestDownload').href = data.downloadUrl;
            refreshAll();
          } else {
            uploadError.textContent = data.message || 'Upload failed';
            uploadError.style.display = 'flex';
          }
        } catch (err) {
          uploadError.textContent = 'Network error: ' + err.message;
          uploadError.style.display = 'flex';
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<span>Upload and Generate QR</span>';
        }
      });

      document.getElementById('btnUploadAnother').addEventListener('click', () => {
        selectedUploadFile = null;
        fileInput.value = '';
        document.getElementById('selectedFileName').textContent = 'Click to select video or drag & drop';
        uploadBtn.disabled = true;
        uploadError.style.display = 'none';
        document.getElementById('uploadFormView').style.display = 'block';
        document.getElementById('uploadSuccessView').style.display = 'none';
      });

      window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          e.target.classList.remove('open');
          const player = document.getElementById('modalVideoPlayer');
          if (player) {
            player.pause();
            player.src = '';
          }
        }
      });

      // Check current auth status on load
      checkAuth();
    });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
