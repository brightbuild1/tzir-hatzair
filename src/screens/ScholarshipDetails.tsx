import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Scholarship } from '../types/scholarship';
import ScholarshipFormModal from '../components/ScholarshipFormModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
function criteriaLabel(value: string): React.ReactNode {
  if (!value) return <span className="text-on-surface-variant/40 text-sm">לא נדרש</span>;
  if (value === 'V') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
      נדרש
    </span>
  );
  return <span className="text-on-surface text-sm font-medium">{value}</span>;
}

function CriteriaCard({ icon, label, value, iconBg }: {
  icon: string; label: string; value: string; iconBg: string;
}) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="text-right min-w-0">
        <p className="text-xs text-on-surface-variant font-medium mb-1">{label}</p>
        <div>{criteriaLabel(value)}</div>
      </div>
    </div>
  );
}

function SkeletonBlock({ h = 'h-6', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} bg-surface-container rounded-lg animate-pulse`} />;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ScholarshipDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading,    setLoading]      = useState(true);
  const [notFound,   setNotFound]     = useState(false);
  const [isEditing,  setIsEditing]    = useState(false);

  async function handleSave(data: Omit<Scholarship, 'createdAt'>) {
    await updateDoc(doc(db, 'scholarships', id!), { ...data });
    setScholarship(prev => prev ? { ...prev, ...data } : prev);
    setIsEditing(false);
  }

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    getDoc(doc(db, 'scholarships', id))
      .then(snap => {
        if (!snap.exists()) { setNotFound(true); }
        else { setScholarship(snap.data() as Scholarship); }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // ── Criteria count for the ring card ─────────────────────────────────────
  const criteriaCount = scholarship
    ? [scholarship.volunteering, scholarship.military, scholarship.periphery, scholarship.sector, scholarship.field]
        .filter(Boolean).length
    : 0;

  const isOpenYear = scholarship?.openingDate?.includes('כל השנה');

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!loading && notFound) return (
    <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">search_off</span>
      <h2 className="text-2xl font-bold text-on-surface">המלגה לא נמצאה</h2>
      <Link to="/scholarship-list" className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
        חזרה לרשימה
      </Link>
    </div>
  );

  return (
    <>
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 left-0 -z-10 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
      <div className="pointer-events-none fixed bottom-0 right-0 -z-10 w-[300px] h-[300px] bg-blue-400/5 blur-[80px] rounded-full" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
        <Link to="/scholarship-list" className="hover:text-primary transition-colors">מלגות</Link>
        <span className="material-symbols-outlined text-base">chevron_left</span>
        <span className="text-on-surface font-medium truncate max-w-xs">
          {loading ? '...' : scholarship?.name}
        </span>
      </div>

      {/* ── Bento Header Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* Info card */}
        <div className="md:col-span-2 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-card border-r-4 border-primary">
          {loading ? (
            <div className="space-y-4">
              <SkeletonBlock h="h-8" w="w-3/4" />
              <SkeletonBlock h="h-4" w="w-1/2" />
              <SkeletonBlock h="h-4" w="w-1/3" />
            </div>
          ) : (
            <>
              {/* Field + sector badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {scholarship?.field && (
                  <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                    {scholarship.field}
                  </span>
                )}
                {scholarship?.sector && (
                  <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
                    {scholarship.sector}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface font-headline leading-tight mb-6">
                {scholarship?.name}
              </h1>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                {/* Amount */}
                {scholarship?.amount && (
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant font-medium mb-0.5">סכום המלגה</p>
                    <p className="text-2xl font-black text-primary font-headline">
                      {scholarship.amount.match(/^\d/) ? `₪${scholarship.amount}` : scholarship.amount}
                    </p>
                  </div>
                )}

                {scholarship?.amount && scholarship?.openingDate && (
                  <div className="h-10 w-px bg-outline-variant opacity-30 hidden sm:block" />
                )}

                {/* Opening date */}
                {scholarship?.openingDate && (
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant font-medium mb-0.5">תאריך פתיחה</p>
                    <p className="text-xl font-bold text-on-surface">{scholarship.openingDate}</p>
                  </div>
                )}

                {scholarship?.openingDate && (
                  <div className="h-10 w-px bg-outline-variant opacity-30 hidden sm:block" />
                )}

                {/* Status chip */}
                <span className={`px-3 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 ${
                  isOpenYear
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-secondary-container text-on-secondary-container'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOpenYear ? 'bg-emerald-500' : 'bg-secondary'}`} />
                  {isOpenYear ? 'פתוח כל השנה' : 'פתוח להרשמה'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions card */}
        <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-3">
          {loading ? (
            <>
              <SkeletonBlock h="h-12" />
              <SkeletonBlock h="h-12" />
              <SkeletonBlock h="h-12" />
            </>
          ) : (
            <>
              {scholarship?.link?.startsWith('http') && (
                <a
                  href={scholarship.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-sm"
                >
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                  פתח לאתר המלגה
                </a>
              )}
              <button
                onClick={() => navigate('/scholarship-list')}
                className="w-full py-3 px-4 bg-surface-container-lowest text-on-primary-fixed-variant rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                חזרה לרשימה
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-4 text-error border border-error/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error/5 transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                עריכת מלגה
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Criteria ── lg:col-span-2 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Criteria section */}
          <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl">
            <h2 className="text-lg font-bold text-on-surface font-headline mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">checklist</span>
              קריטריונים ודרישות
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} h="h-20" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CriteriaCard
                  icon="volunteer_activism"
                  label="התנדבות"
                  value={scholarship?.volunteering ?? ''}
                  iconBg="bg-emerald-100 text-emerald-600"
                />
                <CriteriaCard
                  icon="military_tech"
                  label="שירות צבאי"
                  value={scholarship?.military ?? ''}
                  iconBg="bg-indigo-100 text-indigo-600"
                />
                <CriteriaCard
                  icon="location_on"
                  label="פריפריה"
                  value={scholarship?.periphery ?? ''}
                  iconBg="bg-amber-100 text-amber-600"
                />
                <CriteriaCard
                  icon="diversity_3"
                  label="מגזר"
                  value={scholarship?.sector ?? ''}
                  iconBg="bg-purple-100 text-purple-600"
                />
                <CriteriaCard
                  icon="school"
                  label="תחום לימוד"
                  value={scholarship?.field ?? ''}
                  iconBg="bg-blue-100 text-blue-600"
                />
              </div>
            )}
          </div>

          {/* External link card (if link is not a URL, show it as text) */}
          {!loading && scholarship?.link && !scholarship.link.startsWith('http') && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-secondary-container">info</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant mb-1">לינק / הנחיות</p>
                <p className="text-sm font-medium text-on-surface">{scholarship.link}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Amount card — primary bg */}
          <div className="bg-primary text-white p-6 rounded-2xl relative overflow-hidden">
            {/* Decorative glows */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-300/20 rounded-full blur-xl" />

            <p className="text-white/70 text-sm mb-2 relative z-10">סכום המלגה</p>
            {loading ? (
              <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <p className="text-3xl md:text-4xl font-black font-headline relative z-10">
                {scholarship?.amount
                  ? (scholarship.amount.match(/^\d/) ? `₪${scholarship.amount}` : scholarship.amount)
                  : '—'}
              </p>
            )}

            {/* Criteria filled bar */}
            {!loading && (
              <div className="mt-6 relative z-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-xs">{criteriaCount} מתוך 5 קריטריונים</span>
                  <span className="text-white font-bold text-sm">{Math.round((criteriaCount / 5) * 100)}%</span>
                </div>
                <div className="bg-white/20 h-2 rounded-full">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(criteriaCount / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Opening date card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-card">
            <h3 className="text-sm font-bold text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
              מועדים
            </h3>
            {loading ? (
              <div className="space-y-3">
                <SkeletonBlock h="h-5" w="w-3/4" />
                <SkeletonBlock h="h-4" w="w-1/2" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isOpenYear ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary-container text-on-secondary-container'
                  }`}>
                    {isOpenYear ? 'כל השנה' : 'עונתי'}
                  </span>
                  <span className="text-on-surface font-bold text-sm">{scholarship?.openingDate || '—'}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  בדוק את אתר המלגה לתאריכי הרשמה מדויקים ועדכניים.
                </p>
              </div>
            )}
          </div>

          {/* Quick info card */}
          {!loading && scholarship && (
            <div className="bg-surface-container-high p-6 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-on-surface-variant mb-2">סיכום מהיר</h3>
              {[
                { icon: 'school',           label: 'תחום',   val: scholarship.field   },
                { icon: 'diversity_3',      label: 'מגזר',   val: scholarship.sector  },
                { icon: 'volunteer_activism', label: 'התנדבות', val: scholarship.volunteering },
                { icon: 'military_tech',    label: 'צבאי',   val: scholarship.military },
              ].filter(r => r.val).map(row => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-on-surface-variant">{row.label}</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>{row.icon}</span>
                    <span className="text-xs font-medium text-on-surface truncate max-w-[120px]">{row.val}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile FAB ────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 flex gap-3 z-40">
        {scholarship?.link?.startsWith('http') && (
          <a
            href={scholarship.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 text-sm"
          >
            <span className="material-symbols-outlined">open_in_new</span>
            לאתר המלגה
          </a>
        )}
        <button
          onClick={() => navigate('/scholarship-list')}
          className="py-3.5 px-5 bg-white text-primary rounded-2xl font-bold border border-primary/10 shadow-lg flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
          רשימה
        </button>
      </div>

      {/* Bottom padding for mobile FAB */}
      <div className="lg:hidden h-24" />

      {/* Edit Modal */}
      {isEditing && scholarship && (
        <ScholarshipFormModal
          mode="edit"
          initial={scholarship}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}
