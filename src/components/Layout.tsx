import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scholarshipsOpen, setScholarshipsOpen] = useState(
    location.pathname === '/scholarship-list' || location.pathname === '/candidate-list'
  );

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
          <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">settings</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">person</span>
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
