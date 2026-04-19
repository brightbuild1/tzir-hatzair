import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

// Academic library image from Stitch design
const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCq03Z2ejVJon4CHTo63XGQ5Fe4LIeo_536gfAGRlIxEEi8mblTd9YcGNo9GMIxatW3Rdm_0flMHL9fmJrCg70XArWm3J6bsvU2TY5WDYBoQRscTq4-zPmWZQYBTy55T0Fc7-vVQMWFn5wLpq_QFwnUMk8g7_su5PTP6sB7_dj_lNeBiUSNhQ_wkGF_TRQ4rGi5PvofCOjwP_1IQpMaiE7TWf32tZ3rOix7c9jEhOObkiTjRzC0N_K1CZWjEtN3VyM_jUuko2uRPDt';

interface LoginScreenProps {
  onRegisterClick?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginScreen({ onRegisterClick, onForgotPassword }: LoginScreenProps) {
  const { loginWithEmail, loginWithGoogle, loading, error, clearError } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await loginWithEmail(email, password);
  }

  async function handleGoogle() {
    clearError();
    await loginWithGoogle();
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col overflow-x-hidden" dir="rtl">

      {/* ── Header ─────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex flex-row-reverse justify-between items-center px-6 py-4 font-headline">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent">
            ציר לצעיר
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center" aria-label="שפה">
            <span className="material-symbols-outlined text-primary">language</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center" aria-label="עזרה">
            <span className="material-symbols-outlined text-primary">help_outline</span>
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────── */}
      <main className="flex-grow flex items-stretch pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full">

          {/* Left: Hero Image Panel */}
          <div className="hidden lg:block relative overflow-hidden">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/80 to-transparent" />
            <img
              src={HERO_IMG}
              alt="סביבה אקדמית"
              className="absolute inset-0 object-cover w-full h-full"
            />
            <div className="absolute bottom-12 right-12 z-20 max-w-lg text-white">
              <h2 className="text-4xl font-extrabold mb-4 leading-tight font-headline">
                בונים את העתיד שלך באקדמיה
              </h2>
              <p className="text-xl opacity-90 font-light">
                ציר לצעיר: הפלטפורמה המתקדמת לניהול מלגות, הכוונה לימודית וצמיחה אישית לסטודנטים המצטיינים של מחר.
              </p>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="flex items-center justify-center p-6 md:p-12 lg:p-24 bg-surface">
            <div className="w-full max-w-md">

              {/* Title */}
              <div className="text-center lg:text-right mb-10">
                <h1 className="text-3xl font-extrabold text-primary mb-2 font-headline">
                  ברוכים השבים
                </h1>
                <p className="text-on-surface-variant">
                  היכנסו לחשבון שלכם כדי להמשיך בתהליך המלגה
                </p>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/30 py-4 px-6 rounded-xl shadow-sm hover:bg-surface-container-low transition-all active:scale-95 duration-200 mb-8 disabled:opacity-50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-semibold text-on-surface">כניסה באמצעות Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-4 mb-8">
                <div className="flex-grow h-px bg-outline-variant/30" />
                <span className="text-xs text-on-surface-variant px-2">או באמצעות דוא"ל</span>
                <div className="flex-grow h-px bg-outline-variant/30" />
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-semibold text-on-surface-variant pr-1">
                    כתובת אימייל
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@university.ac.il"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-4 focus:bg-white focus:outline-none focus:ring-0 focus:border-b-2 focus:border-primary transition-all text-right text-on-surface placeholder:text-on-surface-variant/50"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="password" className="block text-sm font-semibold text-on-surface-variant">
                      סיסמה
                    </label>
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      שכחת סיסמה?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-4 focus:bg-white focus:outline-none focus:ring-0 focus:border-b-2 focus:border-primary transition-all text-right text-on-surface placeholder:text-on-surface-variant/50"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      מתחבר...
                    </span>
                  ) : 'התחברות למערכת'}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-12 text-center">
                <p className="text-on-surface-variant">
                  עדיין אין לך חשבון?{' '}
                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="text-primary font-bold hover:underline mr-1"
                  >
                    הרשמה עכשיו
                  </button>
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="bg-surface-container-low w-full py-8 mt-auto">
        <div className="flex flex-col md:flex-row-reverse items-center justify-between px-8 max-w-7xl mx-auto gap-4 text-sm">
          <div className="text-lg font-semibold text-primary font-headline">ציר לצעיר</div>
          <div className="flex flex-row-reverse gap-6">
            <a href="#" className="text-on-surface-variant hover:text-primary hover:underline transition-all">תנאי שימוש</a>
            <a href="#" className="text-on-surface-variant hover:text-primary hover:underline transition-all">מדיניות פרטיות</a>
            <a href="#" className="text-on-surface-variant hover:text-primary hover:underline transition-all">צור קשר</a>
          </div>
          <div className="text-on-surface-variant opacity-80">© כל הזכויות שמורות לציר לצעיר</div>
        </div>
      </footer>

    </div>
  );
}
