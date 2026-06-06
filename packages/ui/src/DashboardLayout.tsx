'use client';
import React, { useState, useEffect, useCallback } from 'react';
import SleepIdleDetector from './SleepIdleDetector';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  shortLabel?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Overall Health', shortLabel: 'Home', icon: '🫀' },
  { path: '/assistant', label: 'AI Assistant', shortLabel: 'AI', icon: '🤖' },
  { path: '/stress', label: 'Stress & Burnout', shortLabel: 'Stress', icon: '🧘' },
  { path: '/sleep', label: 'Sleep', shortLabel: 'Sleep', icon: '🌙' },
  { path: '/nutrition', label: 'Nutrition', shortLabel: 'Food', icon: '🥗' },
  { path: '/records', label: 'Health Records', shortLabel: 'Records', icon: '📋' },
  { path: '/concierge', label: 'Concierge', shortLabel: 'Help', icon: '🛎️' },
  { path: '/emergency', label: 'Emergency', shortLabel: 'SOS', icon: '🚨' },
  { path: '/profile', label: 'Profile', shortLabel: 'You', icon: '👤' },
];

const BOTTOM_NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '📊' },
  { path: '/assistant', label: 'AI', icon: '🤖' },
  { path: '/sleep', label: 'Sleep', icon: '🌙' },
  { path: '/nutrition', label: 'Food', icon: '🥗' },
  { path: '/profile', label: 'You', icon: '👤' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  userName?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Executive Health',
  currentPath = '/',
  onNavigate,
  userName = 'User',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const userInitial = userName.charAt(0).toUpperCase();

  // ── Fetch user's health score on mount ──
  const [healthScore, setHealthScore] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setHealthScore(null);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.last_score != null) {
          setHealthScore(data.user.last_score);
        } else {
          setHealthScore(null);
        }
      })
      .catch(() => {
        setHealthScore(null);
      });
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' };
    if (score >= 60) return { bg: 'rgba(234,179,8,0.15)', text: '#eab308', border: 'rgba(234,179,8,0.3)' };
    if (score >= 40) return { bg: 'rgba(249,115,22,0.15)', text: '#f97316', border: 'rgba(249,115,22,0.3)' };
    return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' };
  };

  // ── Track window width for responsive logic ──
  useEffect(() => {
    const update = () => setWindowWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleNavClick = useCallback((path: string) => {
    onNavigate?.(path);
    setSidebarOpen(false);
  }, [onNavigate]);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    if (onNavigate) {
      onNavigate('/auth/login');
    } else {
      window.location.href = '/auth/login';
    }
  }, [onNavigate]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setDeleteSuccess(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        if (onNavigate) {
          onNavigate('/auth/login');
        } else {
          window.location.href = '/auth/login';
        }
      }, 2000);
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }, [onNavigate]);

  const isMobile = windowWidth > 0 && windowWidth <= 480;
  const isTablet = windowWidth > 0 && windowWidth <= 1024 && windowWidth > 480;
  const isTabletOrMobile = windowWidth > 0 && windowWidth <= 1024;
  const isDesktop = windowWidth > 0 && windowWidth > 1024;

  // ── Sidebar content ──
  const sidebarContent = (
    <>
      <div className="eh-sidebar-logo" style={{
        padding: '0 clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)',
        fontSize: 'clamp(16px, 2vw, 18px)',
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: -0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        <span style={{ flexShrink: 0, fontSize: 'clamp(18px, 2.2vw, 20px)' }}>⚡</span>
        <span className="eh-sidebar-logo-text">{title}</span>
      </div>
      <ul className="eh-sidebar-nav" style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <li
              key={item.path}
              className={`eh-nav-item${isActive ? ' eh-nav-item-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 'clamp(12px, 1.8vw, 14px) clamp(16px, 3vw, 20px)',
                cursor: 'pointer',
                fontSize: 'clamp(13px, 1.8vw, 14px)',
                minHeight: 'clamp(44px, 5vw, 48px)',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                transition: 'all var(--eh-transition)',
                margin: '1px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                position: 'relative',
              }}
              onClick={() => handleNavClick(item.path)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  el.style.borderLeftColor = 'rgba(96, 165, 250, 0.5)';
                  el.style.borderLeftWidth = '5px';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'transparent';
                  el.style.borderLeftColor = 'transparent';
                  el.style.borderLeftWidth = '3px';
                }
              }}
            >
              <span className="eh-nav-icon" style={{
                flexShrink: 0,
                fontSize: 'clamp(16px, 2vw, 18px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'clamp(22px, 2.5vw, 24px)',
              }}>{item.icon}</span>
              <span className="eh-nav-label">{item.label}</span>
              {isActive && (
                <span style={{
                  position: 'absolute',
                  right: 12,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#60a5fa',
                  flexShrink: 0,
                }} />
              )}
            </li>
          );
        })}
      </ul>
      <div className="eh-sidebar-user-section" style={{
        padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 20px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 'auto',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <div style={{
            width: 'clamp(32px, 3.5vw, 36px)',
            height: 'clamp(32px, 3.5vw, 36px)',
            minWidth: 'clamp(32px, 3.5vw, 36px)',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(15px, 2vw, 16px)',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {userInitial}
          </div>
          <div className="eh-sidebar-user-details" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 'clamp(12px, 1.6vw, 13px)',
                color: '#a3a3a3',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color var(--eh-transition)',
                minHeight: 28,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#a3a3a3'; }}
            >
              🚪 Logout
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 'clamp(12px, 1.6vw, 13px)',
                color: '#a3a3a3',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color var(--eh-transition)',
                minHeight: 28,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#a3a3a3'; }}
            >
              🗑 Delete Account
            </button>
          </div>
        </div>
      </div>
      <div className="eh-sidebar-crisis" style={{
        padding: 'clamp(6px, 1vw, 8px) clamp(16px, 3vw, 20px)',
        borderTop: '1px solid var(--border)',
        fontSize: 'clamp(10px, 1.3vw, 11px)',
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 1.4,
        flexShrink: 0,
      }}>
        If you&apos;re in crisis, call or text <strong style={{ color: '#f97316' }}>988</strong>
      </div>
    </>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════
          GLOBAL RESPONSIVE STYLES
          ══════════════════════════════════════════════ */}
      <style>{`
        /* ── DESIGN TOKENS ── */
        :root {
          --eh-layout-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── MAIN LAYOUT ── */
        .eh-layout {
          display: flex;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
        }

        /* ── SIDEBAR (DESKTOP) ── */
        .eh-sidebar {
          width: var(--eh-sidebar-width);
          height: 100vh;
          height: 100dvh;
          position: sticky;
          top: 0;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          padding: clamp(20px, 2.5vw, 24px) 0;
          flex-shrink: 0;
          overflow-y: auto;
          overflow-x: hidden;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
        }

        .eh-sidebar.eh-sidebar-collapsed {
          width: var(--eh-sidebar-collapsed-width);
        }
        .eh-sidebar.eh-sidebar-collapsed .eh-sidebar-logo {
          padding-left: 0 !important;
          padding-right: 0 !important;
          justify-content: center;
        }
        .eh-sidebar.eh-sidebar-collapsed .eh-sidebar-logo-text,
        .eh-sidebar.eh-sidebar-collapsed .eh-nav-label,
        .eh-sidebar.eh-sidebar-collapsed .eh-sidebar-user-details,
        .eh-sidebar.eh-sidebar-collapsed .eh-sidebar-crisis {
          display: none !important;
        }
        .eh-sidebar.eh-sidebar-collapsed .eh-nav-item {
          justify-content: center;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .eh-sidebar.eh-sidebar-collapsed .eh-nav-icon {
          min-width: 0 !important;
        }
        .eh-sidebar.eh-sidebar-collapsed .eh-sidebar-user-section {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .eh-sidebar.eh-sidebar-collapsed .eh-sidebar-user-section > div {
          justify-content: center;
        }

        /* ── SIDEBAR OVERLAY (MOBILE/TABLET) ── */
        .eh-sidebar-overlay-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 998;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .eh-sidebar-overlay-backdrop.eh-visible {
          opacity: 1;
          pointer-events: auto;
        }

        .eh-sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: min(280px, 85vw);
          height: 100vh;
          height: 100dvh;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          padding: clamp(20px, 2.5vw, 24px) 0;
          z-index: 999;
          box-shadow: 4px 0 30px rgba(0, 0, 0, 0.6);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          overflow-x: hidden;
        }
        .eh-sidebar-overlay.eh-visible {
          transform: translateX(0);
        }

        /* ── HEADER ── */
        .eh-header {
          height: var(--eh-header-height);
          min-height: var(--eh-header-height);
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          padding: 0 clamp(12px, 3vw, 24px);
          justify-content: space-between;
          flex-shrink: 0;
          z-index: 50;
        }
        .eh-header-left {
          display: flex;
          align-items: center;
          gap: 8;
        }
        .eh-header-title {
          font-size: clamp(16px, 2.2vw, 18px);
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── HAMBURGER / COLLAPSE BUTTONS ── */
        .eh-hamburger-btn {
          display: none;
          min-width: 44px;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #ffffff;
          font-size: 22px;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: var(--eh-radius-md);
          transition: background-color var(--eh-transition-fast), transform var(--eh-transition-fast);
          flex-shrink: 0;
        }
        .eh-hamburger-btn:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
        .eh-hamburger-btn:active {
          background-color: rgba(255, 255, 255, 0.12);
          transform: scale(0.95);
        }

        .eh-collapse-btn {
          display: none;
          min-width: 36px;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: var(--eh-radius-md);
          transition: all var(--eh-transition-fast);
          flex-shrink: 0;
        }
        .eh-collapse-btn:hover {
          background-color: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        /* ── HEADER AVATAR ── */
        .eh-header-avatar { display: none; }
        .eh-header-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--accent);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* ── HEALTH SCORE PILL ── */
        .eh-health-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          background: none;
          font-family: inherit;
          min-height: 30px;
        }
        .eh-health-pill:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }
        .eh-health-pill:active {
          transform: scale(0.97);
        }
        .eh-health-pill-icon {
          font-size: clamp(11px, 1.5vw, 13px);
          flex-shrink: 0;
        }
        .eh-health-pill-score {
          font-size: clamp(12px, 1.7vw, 14px);
        }
        .eh-health-pill-label {
          font-size: clamp(10px, 1.4vw, 12px);
        }

        /* Start Assessment variant */
        .eh-health-pill-start {
          background: rgba(99, 102, 241, 0.12) !important;
          color: #a5b4fc !important;
          border-color: rgba(99, 102, 241, 0.25) !important;
        }
        .eh-health-pill-start:hover {
          background: rgba(99, 102, 241, 0.2) !important;
          box-shadow: 0 2px 12px rgba(99, 102, 241, 0.15);
        }

        /* ── MAIN CONTENT AREA ── */
        .eh-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }
        .eh-main-content {
          flex: 1;
          padding: clamp(12px, 3vw, 24px);
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          animation: eh-fade-in 0.25s ease;
        }

        /* ── BOTTOM NAV (MOBILE) ── */
        .eh-bottom-nav {
          display: none;
          height: clamp(56px, 12vw, 64px);
          min-height: clamp(56px, 12vw, 64px);
          background-color: var(--bg-secondary);
          border-top: 1px solid var(--border-light);
          flex-shrink: 0;
          z-index: 50;
          padding: 0 clamp(4px, 2vw, 8px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .eh-bottom-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-around;
          height: 100%;
          max-width: 480px;
          margin: 0 auto;
        }
        .eh-bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          min-width: 48px;
          min-height: 48px;
          padding: 4px 6px;
          border-radius: var(--eh-radius-md);
          cursor: pointer;
          transition: all var(--eh-transition-fast);
          color: #64748b;
          text-decoration: none;
          flex: 1;
          max-width: 80px;
          position: relative;
        }
        .eh-bottom-nav-item.eh-active {
          color: #ffffff;
        }
        .eh-bottom-nav-item:active {
          transform: scale(0.92);
        }
        .eh-bottom-nav-item-icon {
          font-size: clamp(20px, 5vw, 22px);
          line-height: 1;
          flex-shrink: 0;
        }
        .eh-bottom-nav-item-label {
          font-size: clamp(9px, 2.2vw, 10px);
          font-weight: 500;
          line-height: 1;
        }
        .eh-bottom-nav-item.eh-active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #60a5fa;
        }
        .eh-bottom-nav-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          min-width: 48px;
          min-height: 48px;
          padding: 4px 6px;
          border-radius: var(--eh-radius-md);
          cursor: pointer;
          transition: all var(--eh-transition-fast);
          color: #64748b;
          background: none;
          border: none;
          flex: 1;
          max-width: 80px;
          font-family: inherit;
        }
        .eh-bottom-nav-more:active {
          transform: scale(0.92);
        }

        /* ── DELETE MODAL ── */
        .eh-delete-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 16px;
          animation: eh-fade-in 0.2s ease;
        }
        .eh-delete-modal-card {
          background-color: var(--bg-secondary);
          border-radius: var(--eh-radius-xl);
          padding: clamp(24px, 5vw, 36px);
          max-width: 440px;
          width: 100%;
          border: 1px solid var(--border-light);
          text-align: center;
          box-shadow: var(--eh-shadow-xl);
          animation: eh-scale-in 0.25s ease;
        }

        /* ── RESPONSIVE GRID HELPERS ── */
        .eh-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--eh-gap-lg); }
        .eh-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--eh-gap-lg); }
        .eh-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--eh-gap-lg); }
        .eh-grid-main { display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--eh-gap-xl); }
        .eh-grid-aside { display: grid; grid-template-columns: 1fr 2.5fr; gap: var(--eh-gap-xl); }

        /* ── CONTENT CONTAINERS ── */
        .eh-content { max-width: var(--eh-content-max); margin: 0 auto; width: 100%; }
        .eh-content-wide { max-width: 1100px; margin: 0 auto; width: 100%; }
        .eh-content-narrow { max-width: var(--eh-content-narrow); margin: 0 auto; width: 100%; }

        /* ── CARD ── */
        .eh-card {
          background: var(--bg-card);
          border-radius: var(--eh-radius-lg);
          padding: clamp(14px, 3vw, 24px);
          border: 1px solid var(--border-light);
          min-width: 0;
          overflow: hidden;
          transition: transform var(--eh-transition), box-shadow var(--eh-transition), border-color var(--eh-transition);
        }
        .eh-card:hover {
          border-color: rgba(255, 255, 255, 0.08);
        }
        .eh-card-compact {
          background: var(--bg-card);
          border-radius: clamp(10px, 2vw, 12px);
          padding: clamp(10px, 2vw, 16px);
          border: 1px solid var(--border-light);
          min-width: 0;
          overflow: hidden;
        }

        /* ── STATS TILE ── */
        .eh-stat-tile { background: var(--bg-card); border-radius: var(--eh-radius-md); padding: clamp(12px, 2vw, 16px); text-align: center; min-width: 0; }
        .eh-stat-value { display: block; font-size: clamp(18px, 3vw, 22px); font-weight: 700; color: var(--text-primary); }
        .eh-stat-label { display: block; font-size: var(--eh-text-xs); color: var(--text-muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── SCORE RING ── */
        .eh-score-ring-wrap { text-align: center; }
        .eh-score-ring-wrap svg {
          width: min(160px, 45vw) !important;
          height: min(160px, 45vw) !important;
          max-width: 200px;
          max-height: 200px;
        }

        /* ── SCORE BARS ── */
        .eh-score-bar { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: clamp(12px, 1.8vw, 13px); gap: 8px; }
        .eh-score-bar-track { height: 6px; background: rgba(255, 255, 255, 0.06); border-radius: 3px; overflow: hidden; margin-bottom: 12px; }

        /* ── METRIC ── */
        .eh-metric { background: var(--bg-card); border-radius: var(--eh-radius-md); padding: clamp(12px, 2vw, 16px); text-align: center; min-width: 0; }
        .eh-metric-value { font-size: clamp(20px, 3vw, 24px); font-weight: 700; }
        .eh-metric-label { font-size: var(--eh-text-xs); color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── BADGES ── */
        .eh-badge { display: inline-block; padding: 2px 10px; border-radius: var(--eh-radius-full); font-size: var(--eh-text-xs); font-weight: 600; text-transform: uppercase; color: #fff; }

        /* ── ALERTS ── */
        .eh-alert-error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; padding: 10px 14px; border-radius: var(--eh-radius-md); margin-bottom: 16px; font-size: var(--eh-text-base); border: 1px solid rgba(239, 68, 68, 0.2); }
        .eh-alert-success { background: rgba(34, 197, 94, 0.1); color: #86efac; padding: 10px 14px; border-radius: var(--eh-radius-md); margin-bottom: 16px; font-size: var(--eh-text-base); border: 1px solid rgba(34, 197, 94, 0.2); }

        /* ── BUTTONS ── */
        .eh-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px);
          border-radius: var(--eh-radius-md);
          border: none;
          font-size: clamp(13px, 2vw, 14px);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--eh-transition);
          min-height: 44px;
          white-space: nowrap;
          text-decoration: none;
          gap: 6px;
        }
        .eh-btn:hover { transform: translateY(-1px); }
        .eh-btn:active { transform: scale(0.98); }
        .eh-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .eh-btn-primary { background: var(--accent-light); color: #fff; }
        .eh-btn-primary:hover { background: #4f46e5; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
        .eh-btn-danger { background: #dc2626; color: #fff; }
        .eh-btn-danger:hover { background: #b91c1c; }
        .eh-btn-sm { padding: 4px 12px; font-size: 12px; border-radius: var(--eh-radius-sm); min-height: 32px; }
        .eh-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }

        /* ── INPUTS ── */
        .eh-input {
          width: 100%;
          padding: clamp(14px, 2.5vw, 16px) clamp(14px, 2.5vw, 18px);
          border-radius: var(--eh-radius-md);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: clamp(16px, 2.5vw, 17px);
          outline: none;
          min-height: 52px;
          box-sizing: border-box;
          transition: border-color var(--eh-transition), box-shadow var(--eh-transition);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .eh-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .eh-select {
          padding: clamp(14px, 2.5vw, 16px) clamp(14px, 2.5vw, 18px);
          border-radius: var(--eh-radius-md);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: clamp(16px, 2.5vw, 17px);
          outline: none;
          min-height: 52px;
          box-sizing: border-box;
          width: 100%;
        }

        /* ── SECTION TITLES ── */
        .eh-section-title { font-size: clamp(14px, 2vw, 16px); font-weight: 600; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── PAGE TITLE ── */
        .eh-page-title { font-size: clamp(20px, 4vw, 28px); font-weight: 700; margin-bottom: 4px; line-height: 1.2; }
        .eh-page-subtitle { color: var(--text-secondary); margin-bottom: clamp(16px, 3vw, 32px); font-size: clamp(13px, 2vw, 15px); }

        /* ── EMPTY STATE ── */
        .eh-empty { text-align: center; padding: clamp(24px, 5vw, 32px); color: var(--text-muted); font-size: var(--eh-text-base); }

        /* ── FLEX HELPERS ── */
        .eh-flex-center { display: flex; align-items: center; gap: 10px; }
        .eh-flex-between { display: flex; justify-content: space-between; align-items: center; }
        .eh-flex-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .eh-gap-8 { gap: 8px; }
        .eh-gap-12 { gap: 12px; }
        .eh-gap-16 { gap: 16px; }
        .eh-gap-20 { gap: 20px; }
        .eh-mb-8 { margin-bottom: 8px; }
        .eh-mb-12 { margin-bottom: 12px; }
        .eh-mb-16 { margin-bottom: 16px; }
        .eh-mb-20 { margin-bottom: 20px; }
        .eh-mb-24 { margin-bottom: 24px; }
        .eh-mt-auto { margin-top: auto; }

        /* ── RESPONSIVE TABLES ── */
        .eh-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }
        .eh-table-wrap::-webkit-scrollbar { height: 4px; }
        .eh-table-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── CHART ── */
        .eh-chart-responsive { max-width: 100%; overflow: hidden; }
        .eh-chart-responsive > div { max-width: 100% !important; }
        .eh-chart-responsive svg { max-width: 100%; height: auto !important; }

        /* ── ALERT BANNER ── */
        .eh-alert-banner { min-width: 0; overflow: hidden; }
        .eh-alert-banner button { min-height: 36px; white-space: nowrap; }

        /* ── TREND CARD ── */
        .eh-trend-card { min-width: 0; overflow: hidden; }

        /* ── PAGE TRANSITIONS ── */
        .eh-page-enter {
          animation: eh-fade-in-up 0.35s ease forwards;
        }

        /* ══════════════════════════════════════════════
           RESPONSIVE BREAKPOINTS
           ══════════════════════════════════════════════ */

        /* ── Tablet: 769px – 1024px ── */
        @media (max-width: 1024px) {
          .eh-sidebar:not(.eh-sidebar-collapsed) { width: var(--eh-sidebar-collapsed-width) !important; }
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-sidebar-logo { padding-left: 0 !important; padding-right: 0 !important; justify-content: center; }
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-sidebar-logo-text,
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-nav-label,
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-sidebar-user-details,
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-sidebar-crisis { display: none !important; }
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-nav-item { justify-content: center; padding-left: 0 !important; padding-right: 0 !important; }
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-nav-icon { min-width: 0 !important; }
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-sidebar-user-section { padding-left: 0 !important; padding-right: 0 !important; }
          .eh-sidebar:not(.eh-sidebar-collapsed) .eh-sidebar-user-section > div { justify-content: center; }
          .eh-collapse-btn { display: inline-flex !important; }
          .eh-grid-aside { grid-template-columns: 1fr; }
          .eh-grid-main { grid-template-columns: 1fr; }
          .eh-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .eh-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Tablet: 481px – 768px ── */
        @media (max-width: 768px) {
          .eh-sidebar { display: none !important; }
          .eh-collapse-btn { display: none !important; }
          .eh-hamburger-btn { display: inline-flex !important; }
          .eh-header-avatar { display: flex !important; }
          .eh-grid-2, .eh-grid-3, .eh-grid-4, .eh-grid-aside, .eh-grid-main {
            grid-template-columns: 1fr;
          }
          .eh-card {
            border-radius: clamp(14px, 3vw, 16px);
          }
          .eh-stat-tile { padding: clamp(10px, 2vw, 12px); }
          .eh-metric { padding: 12px; }
          .eh-main-content {
            padding: clamp(10px, 2.5vw, 16px);
          }
        }

        /* ── Mobile: ≤480px ── */
        @media (max-width: 480px) {
          .eh-sidebar { display: none !important; }
          .eh-bottom-nav { display: flex !important; }
          .eh-header { height: 52px; min-height: 52px; }
          .eh-header-title { font-size: 16px; }
          .eh-hamburger-btn { font-size: 20px; min-width: 40px; min-height: 40px; }
          .eh-health-pill {
            padding: 3px 8px;
            gap: 3px;
            min-height: 26px;
            border-radius: 16px;
          }
          .eh-health-pill-icon { font-size: 10px; }
          .eh-health-pill-score { font-size: 11px; }
          .eh-health-pill-label { font-size: 9px; }
          .eh-main-content {
            padding: clamp(8px, 2.5vw, 12px);
            padding-bottom: 12px;
          }
          .eh-card, .eh-card-compact {
            border-radius: 16px;
            padding: clamp(12px, 3vw, 16px);
          }
          .eh-btn {
            min-height: 48px;
          }
          .eh-score-ring-wrap svg {
            width: min(130px, 42vw) !important;
            height: min(130px, 42vw) !important;
            max-width: 150px;
            max-height: 150px;
          }
          .eh-page-title { font-size: clamp(18px, 5vw, 22px); }
          .eh-chat-send-btn {
            min-height: 48px;
          }
        }

        /* ── Small mobile: ≤380px ── */
        @media (max-width: 380px) {
          .eh-bottom-nav-item { min-width: 40px; padding: 2px 3px; }
          .eh-bottom-nav-item-icon { font-size: 18px; }
          .eh-bottom-nav-item-label { font-size: 9px; }
          .eh-bottom-nav-more { min-width: 40px; padding: 2px 3px; }
          .eh-header { padding: 0 8px; }
          .eh-main-content { padding: 8px; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════
          LAYOUT STRUCTURE
          ══════════════════════════════════════════════ */}
      <div className="eh-layout">
        {/* Desktop/Tablet sidebar */}
        <aside
          className={`eh-sidebar${sidebarCollapsed && isDesktop ? ' eh-sidebar-collapsed' : ''}`}
        >
          {sidebarContent}
        </aside>

        {/* Mobile sidebar overlay */}
        <div
          className={`eh-sidebar-overlay-backdrop${sidebarOpen && isTabletOrMobile ? ' eh-visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`eh-sidebar-overlay${sidebarOpen && isTabletOrMobile ? ' eh-visible' : ''}`}
        >
          {sidebarContent}
        </aside>

        {/* Main content area */}
        <div className="eh-main">
          <header className="eh-header">
            <div className="eh-header-left" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="eh-hamburger-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                ☰
              </button>
              <button
                className="eh-collapse-btn"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? '▸' : '◂'}
              </button>
              <span className="eh-header-title">{title}</span>
            </div>
            <div className="eh-header-right" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {/* Health Score Pill */}
              {healthScore !== undefined && (
                healthScore !== null ? (
                  <button
                    className="eh-health-pill"
                    onClick={() => handleNavClick('/dashboard')}
                    style={{
                      backgroundColor: getScoreColor(healthScore).bg,
                      color: getScoreColor(healthScore).text,
                      borderColor: getScoreColor(healthScore).border,
                    }}
                    title="View health dashboard"
                    aria-label={`Health score: ${healthScore}`}
                  >
                    <span className="eh-health-pill-icon" style={{ lineHeight: 1 }}>❤️</span>
                    <span className="eh-health-pill-score" style={{ lineHeight: 1 }}>{healthScore}</span>
                  </button>
                ) : (
                  <button
                    className="eh-health-pill eh-health-pill-start"
                    onClick={() => handleNavClick('/onboarding')}
                    aria-label="Start health assessment"
                  >
                    <span className="eh-health-pill-icon" style={{ lineHeight: 1 }}>⚡</span>
                    <span className="eh-health-pill-label" style={{ lineHeight: 1 }}>Start Assessment</span>
                  </button>
                )
              )}
              <div className="eh-header-avatar">
                <div className="eh-header-avatar-circle">{userInitial}</div>
              </div>
            </div>
          </header>
          <main className="eh-main-content">{children}</main>

          {/* Mobile bottom navigation */}
          <nav className="eh-bottom-nav">
            <div className="eh-bottom-nav-inner">
              {BOTTOM_NAV_ITEMS.slice(0, 4).map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <div
                    key={item.path}
                    className={`eh-bottom-nav-item${isActive ? ' eh-active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                  >
                    <span className="eh-bottom-nav-item-icon">{item.icon}</span>
                    <span className="eh-bottom-nav-item-label">{item.label}</span>
                  </div>
                );
              })}
              <button
                className="eh-bottom-nav-more"
                onClick={() => setSidebarOpen(true)}
                aria-label="More options"
              >
                <span className="eh-bottom-nav-item-icon">☰</span>
                <span className="eh-bottom-nav-item-label">More</span>
              </button>
            </div>
          </nav>
        </div>

        <SleepIdleDetector
          getToken={() => {
            if (typeof window !== 'undefined') return localStorage.getItem('token');
            return null;
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════
          DELETE ACCOUNT MODAL
          ══════════════════════════════════════════════ */}
      {deleteModalOpen && (
        <div
          className="eh-delete-modal-backdrop"
          onClick={() => { if (!deleteLoading) setDeleteModalOpen(false); }}
        >
          <div
            className="eh-delete-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 'clamp(36px, 6vw, 44px)', marginBottom: 16 }}>🚨</div>
            <h2 style={{
              fontSize: 'clamp(18px, 3vw, 22px)',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 12px',
            }}>
              Delete Account?
            </h2>
            <p style={{
              fontSize: 'clamp(13px, 2vw, 14px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}>
              Are you sure? Your health data and assessment records will remain stored in our
              database per our data retention policy. This action cannot be undone.
            </p>

            {deleteError && (
              <div className="eh-alert-error" style={{ marginBottom: 16, textAlign: 'left' }}>
                {deleteError}
              </div>
            )}

            {deleteSuccess && (
              <div className="eh-alert-success" style={{ marginBottom: 16, textAlign: 'left' }}>
                ✅ Account deletion requested. Redirecting…
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="eh-btn eh-btn-ghost"
                style={{
                  opacity: deleteLoading ? 0.5 : 1,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteSuccess}
                className="eh-btn eh-btn-danger"
                style={{
                  opacity: deleteLoading || deleteSuccess ? 0.6 : 1,
                  cursor: deleteLoading || deleteSuccess ? 'not-allowed' : 'pointer',
                }}
              >
                {deleteLoading ? 'Deleting…' : deleteSuccess ? 'Done ✓' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardLayout;
