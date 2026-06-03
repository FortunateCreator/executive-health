import React, { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/intake', label: 'Health Intake', icon: '💊' },
  { path: '/assistant', label: 'AI Assistant', icon: '🤖' },
  { path: '/profile', label: 'Profile', icon: '👤' },
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
  const userInitial = userName.charAt(0).toUpperCase();

  const handleNavClick = (path: string) => {
    onNavigate?.(path);
    setSidebarOpen(false);
  };

  // ── Inline Styles ───────────────────────────────────────
  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0f0f23',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const sidebarBase: React.CSSProperties = {
    width: 240,
    backgroundColor: '#1a1a2e',
    borderRight: '1px solid #2a2a4e',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    flexShrink: 0,
  };

  const sidebarLogo: React.CSSProperties = {
    padding: '0 20px 24px',
    fontSize: 18,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: -0.5,
  };

  const navListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    flex: 1,
  };

  const getNavItemStyle = (path: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: 14,
    color: currentPath === path ? '#ffffff' : '#94a3b8',
    backgroundColor: currentPath === path ? '#0f3460' : 'transparent',
    borderLeft: currentPath === path ? '3px solid #60a5fa' : '3px solid transparent',
    transition: 'background-color 0.15s, color 0.15s',
    margin: '2px 0',
  });

  const userSectionStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderTop: '1px solid #2a2a4e',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 'auto',
  };

  const avatarStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#0f3460',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 600,
    flexShrink: 0,
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  };

  const headerStyle: React.CSSProperties = {
    height: 56,
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #2a2a4e',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    justifyContent: 'space-between',
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#ffffff',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: 24,
    overflowY: 'auto',
  };

  // ── Sidebar content ─────────────────────────────────────
  const sidebarContent = (
    <>
      <div style={sidebarLogo}>⚡ {title}</div>
      <ul style={navListStyle}>
        {NAV_ITEMS.map((item) => (
          <li
            key={item.path}
            style={getNavItemStyle(item.path)}
            onClick={() => handleNavClick(item.path)}
            onMouseEnter={(e) => {
              if (currentPath !== item.path) {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#16213e';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPath !== item.path) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <div style={userSectionStyle}>
        <div style={avatarStyle}>{userInitial}</div>
        <span style={{ fontSize: 14, color: '#cbd5e1' }}>{userName}</span>
      </div>
    </>
  );

  return (
    <div style={layoutStyle}>
      {/* Responsive styles: hide desktop sidebar on mobile, show hamburger */}
      <style>{`
        .eh-sidebar-desktop { display: flex; }
        .eh-hamburger-btn { display: none; }
        .eh-header-avatar { display: none; }
        @media (max-width: 767px) {
          .eh-sidebar-desktop { display: none !important; }
          .eh-hamburger-btn { display: inline-flex !important; }
          .eh-header-avatar { display: flex !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside style={sidebarBase} className="eh-sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            style={{
              ...sidebarBase,
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              zIndex: 1000,
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content area */}
      <div style={mainStyle}>
        <header style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="eh-hamburger-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: 24,
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'none',
              }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <span style={headerTitleStyle}>{title}</span>
          </div>
          <div className="eh-header-avatar" style={{ display: 'none' }}>
            <div style={avatarStyle}>{userInitial}</div>
          </div>
        </header>
        <main style={contentStyle}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
