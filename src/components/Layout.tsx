import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [scholarshipsOpen, setScholarshipsOpen] = useState(
    location.pathname === '/scholarship-list' || location.pathname === '/candidate-list'
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const isActive = (path: string) => location.pathname === path;
  const isScholarshipsActive =
    location.pathname === '/scholarship-list' || location.pathname === '/candidate-list';

  return (
    <div className="bg-surface text-on-surface min-h-screen" dir="rtl">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className="fixed right-0 top-0 h-screen w-72 flex flex-col z-50 py-8 px-4 font-headline text-right leading-relaxed"
        style={{ background: '#f8f9fa', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-4 px-4 mb-10">
          <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-primary leading-tight">ציר לצעיר</h1>
            <span className="text-xs text-on-surface-variant font-medium tracking-wide">Academic Precision</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-grow space-y-2">

          {/* Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-lg transition-all duration-150 ${
              isActive('/dashboard')
                ? 'bg-white text-primary font-bold'
                : 'text-on-surface-variant hover:bg-white/50'
            }`}
            style={isActive('/dashboard') ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-base">לוח בקרה</span>
          </button>

          {/* Scholarships dropdown */}
          <div>
            <button
              onClick={() => setScholarshipsOpen(o => !o)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-150 ${
                isScholarshipsActive
                  ? 'bg-white text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-white/50'
              }`}
              style={isScholarshipsActive ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">school</span>
                <span className="text-base">מלגות</span>
              </div>
              <span
                className="material-symbols-outlined text-sm transition-transform duration-200"
                style={{ transform: scholarshipsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            </button>

            {scholarshipsOpen && (
              <div className="mt-1 space-y-1 pr-11">
                <button
                  onClick={() => navigate('/candidate-list')}
                  className={`w-full text-right text-sm py-3 px-4 rounded-lg transition-all duration-150 ${
                    isActive('/candidate-list')
                      ? 'bg-white text-primary font-bold'
                      : 'text-on-surface-variant hover:bg-white/50'
                  }`}
                  style={isActive('/candidate-list') ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}}
                >
                  רשימת מועמדים
                </button>
                <button
                  onClick={() => navigate('/scholarship-list')}
                  className={`w-full text-right text-sm py-3 px-4 rounded-lg transition-all duration-150 ${
                    isActive('/scholarship-list')
                      ? 'bg-white text-primary font-bold'
                      : 'text-on-surface-variant hover:bg-white/50'
                  }`}
                  style={isActive('/scholarship-list') ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}}
                >
                  רשימת מלגות
                </button>
              </div>
            )}
          </div>

          {/* Soldiers */}
          <button
            onClick={() => navigate('/soldiers')}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-lg transition-all duration-150 ${
              isActive('/soldiers')
                ? 'bg-white text-primary font-bold'
                : 'text-on-surface-variant hover:bg-white/50'
            }`}
            style={isActive('/soldiers') ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}}
          >
            <span className="material-symbols-outlined">military_tech</span>
            <span className="text-base">חיילים</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-lg transition-all duration-150 ${
              isActive('/settings')
                ? 'bg-white text-primary font-bold'
                : 'text-on-surface-variant hover:bg-white/50'
            }`}
            style={isActive('/settings') ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-base">הגדרות</span>
          </button>

        </nav>

        {/* Bottom CTA */}
        <div className="px-2 mt-auto">
          <button className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container transition-all duration-300 active:scale-95"
            style={{ boxShadow: '0 4px 16px rgba(0,63,135,0.20)' }}>
            <span className="material-symbols-outlined">add</span>
            <span className="text-lg">מלגה חדשה</span>
          </button>
        </div>
      </aside>

      {/* ── Top AppBar ────────────────────────────────────── */}
      <header className="fixed top-0 right-72 left-0 h-16 bg-surface-container-lowest/80 backdrop-blur-md shadow-card flex justify-between items-center px-6 z-40">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-primary font-headline">מערכת מלגות</h2>
          <div className="hidden md:flex gap-4">
            <span className="text-primary font-bold border-b-2 border-primary px-2 py-1 cursor-pointer text-sm">ניהול</span>
            <span className="text-on-surface-variant hover:bg-surface-container px-2 py-1 rounded cursor-pointer text-sm transition-colors">דוחות</span>
            <span className="text-on-surface-variant hover:bg-surface-container px-2 py-1 rounded cursor-pointer text-sm transition-colors">תקציבים</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          </button>

          {/* User avatar + popup */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all focus:outline-none focus:ring-primary/50"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName ?? 'משתמש'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container">person</span>
                </div>
              )}
            </button>

            {/* Popup */}
            {userMenuOpen && (
              <div
                className="absolute left-0 top-[calc(100%+12px)] w-72 bg-surface-container-lowest rounded-2xl overflow-hidden z-50"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {/* Header — user info */}
                <div className="bg-primary px-5 py-5 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-primary-container/30 rounded-full" />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/30 flex-shrink-0">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-2xl">person</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-white font-bold text-sm truncate">{user?.displayName ?? 'משתמש'}</p>
                      <p className="text-white/60 text-xs truncate">{user?.email ?? ''}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/dashboard'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-right text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">dashboard</span>
                    <span>לוח בקרה</span>
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/scholarship-list'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-right text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">school</span>
                    <span>רשימת מלגות</span>
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-right text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">manage_accounts</span>
                    <span>הגדרות חשבון</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="mx-4 h-px bg-outline-variant/20" />

                {/* Logout */}
                <div className="py-2">
                  <button
                    onClick={async () => { setUserMenuOpen(false); await logout(); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-right text-sm text-error hover:bg-error/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="font-medium">התנתקות</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────────── */}
      <main className="mr-72 pt-24 pb-12 px-8 min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
