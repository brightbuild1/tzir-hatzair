import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, getDocs, query, orderBy,
  addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Scholarship } from '../types/scholarship';
import ScholarshipFormModal, { type ScholarshipFormData } from '../components/ScholarshipFormModal';
import SmartFilter, { type FilterFieldConfig, type FilterValues } from '../components/SmartFilter';

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];

type ScholarshipDoc = Scholarship & { id: string };

async function loadAllDocs(): Promise<ScholarshipDoc[]> {
  const snap = await getDocs(query(collection(db, 'scholarships'), orderBy('name')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Scholarship) }));
}

// ── Icon helper ───────────────────────────────────────────────────────────────
function getFieldIcon(field: string): { icon: string; bg: string; color: string } {
  const f = field.toLowerCase();
  if (f.includes('הנדסה') || f.includes('stem') || f.includes('טכנולוגיה'))
    return { icon: 'engineering',          bg: 'bg-blue-50',    color: 'text-blue-600' };
  if (f.includes('מדע') || f.includes('ביו') || f.includes('פיזיק'))
    return { icon: 'science',              bg: 'bg-purple-50',  color: 'text-purple-600' };
  if (f.includes('רפואה') || f.includes('בריאות'))
    return { icon: 'medical_services',     bg: 'bg-rose-50',    color: 'text-rose-600' };
  if (f.includes('משפט'))
    return { icon: 'gavel',               bg: 'bg-amber-50',   color: 'text-amber-700' };
  if (f.includes('עסקים') || f.includes('כלכלה') || f.includes('מנהל'))
    return { icon: 'business_center',      bg: 'bg-emerald-50', color: 'text-emerald-700' };
  if (f.includes('חינוך') || f.includes('הוראה'))
    return { icon: 'school',              bg: 'bg-indigo-50',  color: 'text-indigo-600' };
  if (f.includes('אמנות') || f.includes('עיצוב'))
    return { icon: 'palette',             bg: 'bg-pink-50',    color: 'text-pink-600' };
  if (f.includes('חברה') || f.includes('רווחה'))
    return { icon: 'diversity_3',         bg: 'bg-teal-50',    color: 'text-teal-600' };
  return { icon: 'workspace_premium',     bg: 'bg-primary-fixed', color: 'text-primary' };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function CriteriaCell({ value }: { value: string }) {
  if (!value) return <span className="text-on-surface-variant/30 text-sm">—</span>;
  if (value === 'V') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>כן
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium max-w-[140px] truncate" title={value}>
      {value}
    </span>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-surface-container flex-shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-surface-container rounded" />
                <div className="h-3 w-28 bg-surface-container rounded" />
              </div>
            </div>
          </td>
          <td className="px-6 py-5"><div className="h-6 w-20 bg-surface-container rounded" /></td>
          <td className="px-6 py-5"><div className="h-4 w-24 bg-surface-container rounded" /></td>
          <td className="px-6 py-5"><div className="h-4 w-20 bg-surface-container rounded" /></td>
          <td className="px-6 py-5"><div className="h-7 w-24 bg-surface-container rounded-full mx-auto" /></td>
        </tr>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 animate-pulse space-y-3 border border-outline-variant/10">
          <div className="flex gap-2"><div className="h-5 w-16 bg-surface-container rounded-full" /><div className="h-5 w-20 bg-surface-container rounded-full" /></div>
          <div className="h-5 w-3/4 bg-surface-container rounded" />
          <div className="flex gap-4"><div className="h-4 w-20 bg-surface-container rounded" /><div className="h-4 w-16 bg-surface-container rounded" /></div>
        </div>
      ))}
    </div>
  );
}

function ScholarshipCard({ s, onClick }: { s: ScholarshipDoc; onClick: () => void }) {
  const { icon, bg, color } = getFieldIcon(s.field);
  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-all border border-outline-variant/10 hover:border-primary/30 hover:shadow-md"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
          <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-on-surface text-sm leading-snug">{s.name}</p>
          {s.sector && <p className="text-xs text-on-surface-variant mt-0.5">{s.sector}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {s.amount && <span className="text-base font-black text-primary">{s.amount.match(/^\d/) ? `₪${s.amount}` : s.amount}</span>}
          {s.openingDate && (
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span className="text-xs">{s.openingDate}</span>
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          className="bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full text-xs font-bold hover:opacity-80 transition-opacity"
        >
          צפייה
        </button>
      </div>
      {(s.volunteering || s.military || s.periphery) && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-container">
          {s.volunteering && <CriteriaCell value={s.volunteering} />}
          {s.military     && <CriteriaCell value={s.military} />}
          {s.periphery    && <CriteriaCell value={s.periphery} />}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ScholarshipsManager() {
  const navigate = useNavigate();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [allDocs,    setAllDocs]    = useState<ScholarshipDoc[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize,   setPageSize]   = useState<PageSizeOption>(PAGE_SIZE);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({});

  // ── Fetch all docs once ───────────────────────────────────────────────────
  async function fetchAll() {
    setLoading(true); setError(null);
    try {
      setAllDocs(await loadAllDocs());
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הנתונים מ-Firestore');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: filter across ALL docs ──────────────────────────────────────
  const filteredDocs = useMemo(() => {
    const name     = appliedFilters.name     as string | undefined;
    const field    = appliedFilters.field    as string | undefined;
    const sector   = appliedFilters.sector   as string | undefined;
    const criteria = appliedFilters.criteria as string | undefined;
    const amount   = appliedFilters.amount   as [number, number] | undefined;

    return allDocs.filter(s => {
      if (name   && !s.name?.toLowerCase().includes(name.toLowerCase())) return false;
      if (field  && s.field  !== field)  return false;
      if (sector && s.sector !== sector) return false;
      if (criteria === 'volunteering' && !s.volunteering) return false;
      if (criteria === 'military'     && !s.military)     return false;
      if (criteria === 'periphery'    && !s.periphery)    return false;
      if (amount) {
        const raw = s.amount ? parseFloat(s.amount.replace(/[^\d.]/g, '')) : NaN;
        if (isNaN(raw) || raw < amount[0] || raw > amount[1]) return false;
      }
      return true;
    });
  }, [allDocs, appliedFilters]);

  // ── Derived: paginate filtered results ───────────────────────────────────
  const totalCount = filteredDocs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeePage  = Math.min(pageNumber, totalPages);
  const rangeStart = totalCount === 0 ? 0 : (safeePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safeePage * pageSize, totalCount);
  const pagedDocs  = useMemo(
    () => filteredDocs.slice((safeePage - 1) * pageSize, safeePage * pageSize),
    [filteredDocs, safeePage, pageSize],
  );
  const hasPrev = safeePage > 1;
  const hasNext = safeePage < totalPages;

  // ── Navigation ────────────────────────────────────────────────────────────
  function goTo(n: number)  { setPageNumber(Math.max(1, Math.min(n, totalPages))); }
  function goNext()         { goTo(safeePage + 1); }
  function goPrev()         { goTo(safeePage - 1); }

  function handlePageSizeChange(newSize: PageSizeOption) {
    setPageSize(newSize);
    setPageNumber(1);
  }

  // Reset to page 1 whenever filters change
  function handleFilterApply(values: FilterValues) {
    setAppliedFilters(values);
    setPageNumber(1);
  }

  async function handleCreate(data: ScholarshipFormData) {
    await addDoc(collection(db, 'scholarships'), { ...data, createdAt: serverTimestamp() });
    setIsCreating(false);
    setPageNumber(1);
    await fetchAll();
  }

  // ── Unique select options derived from ALL docs ───────────────────────────
  const fieldOptions  = useMemo(() => [...new Set(allDocs.map(s => s.field).filter(Boolean))],  [allDocs]);
  const sectorOptions = useMemo(() => [...new Set(allDocs.map(s => s.sector).filter(Boolean))], [allDocs]);

  // ── Filter field config ───────────────────────────────────────────────────
  const filterFields = useMemo((): FilterFieldConfig[] => [
    { type: 'text',   key: 'name',     label: 'חיפוש לפי שם',   placeholder: 'הקלד שם מלגה...' },
    { type: 'select', key: 'field',    label: 'תחום לימוד',      allLabel: 'כל התחומים',
      options: fieldOptions.map(f => ({ value: f, label: f })) },
    { type: 'select', key: 'sector',   label: 'מגזר',            allLabel: 'כל המגזרים',
      options: sectorOptions.map(s => ({ value: s, label: s })) },
    { type: 'range',  key: 'amount',   label: 'טווח סכום מלגה',  min: 0, max: 50000, step: 500, prefix: '₪' },
    { type: 'select', key: 'criteria', label: 'קריטריון',        allLabel: 'ללא סינון',
      options: [
        { value: 'volunteering', label: 'התנדבות נדרשת' },
        { value: 'military',     label: 'שירות צבאי נדרש' },
        { value: 'periphery',    label: 'פריפריה' },
      ]},
  ], [fieldOptions, sectorOptions]);

  // ── Pagination Bar ────────────────────────────────────────────────────────
  function PaginationBar() {
    return (
      <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant/10">
        <div className="text-xs text-on-surface-variant font-medium">
          {loading
            ? 'טוען...'
            : totalCount === 0
              ? 'אין תוצאות'
              : `מציג ${rangeStart}–${rangeEnd} מתוך ${totalCount}`}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={goPrev} disabled={!hasPrev || loading}
            className="p-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant hover:bg-outline-variant/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <div className="flex gap-1">
            {hasPrev && (
              <button onClick={goPrev}
                className="px-3 py-1 rounded-lg hover:bg-surface-container-highest text-on-surface-variant text-xs font-medium transition-colors">
                {safeePage - 1}
              </button>
            )}
            <button className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold" style={{ boxShadow: '0 2px 6px rgba(0,63,135,0.25)' }}>
              {safeePage}
            </button>
            {hasNext && (
              <button onClick={goNext}
                className="px-3 py-1 rounded-lg hover:bg-surface-container-highest text-on-surface-variant text-xs font-medium transition-colors">
                {safeePage + 1}
              </button>
            )}
            {safeePage + 2 < totalPages && (
              <>
                <span className="px-1 flex items-end pb-1 text-on-surface-variant/40 text-xs">…</span>
                <button onClick={() => goTo(totalPages)}
                  className="px-3 py-1 rounded-lg hover:bg-surface-container-highest text-on-surface-variant text-xs font-medium transition-colors">
                  {totalPages}
                </button>
              </>
            )}
          </div>
          <button onClick={goNext} disabled={!hasNext || loading}
            className="p-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant hover:bg-outline-variant/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {/* Page-size */}
          <div className="flex items-center gap-1.5 mr-4 pr-4 border-r border-outline-variant/20">
            <span className="text-xs text-on-surface-variant">שורות</span>
            {PAGE_SIZE_OPTIONS.map(opt => (
              <button key={opt} onClick={() => handlePageSizeChange(opt)} disabled={loading}
                className={`w-8 h-7 rounded-md text-xs font-medium transition-all disabled:opacity-50 ${pageSize === opt ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-white hover:text-primary'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight font-headline">חיפוש מלגות</h2>
          <p className="text-on-surface-variant mt-1 text-sm">מצא את המלגה המתאימה ביותר עבורך מתוך מאות אפשרויות</p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">
              {totalCount} מלגות{Object.keys(appliedFilters).length > 0 ? ' תואמות' : ' פעילות'}
            </span>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span className="hidden sm:inline">הוספת מלגה</span>
          </button>
        </div>
      </div>

      {/* ── Filter Panel ─────────────────────────────────────────────────── */}
      <SmartFilter
        fields={filterFields}
        onApply={handleFilterApply}
        className="mb-6"
      />

      {/* ── Mobile: Card list ─────────────────────────────────────────────── */}
      <div className="lg:hidden bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden mb-8">
        <div className="p-3 space-y-3">
          {loading ? <CardSkeleton /> : error ? (
            <div className="py-12 text-center text-error">
              <span className="material-symbols-outlined text-4xl block mb-2">error</span>{error}
            </div>
          ) : pagedDocs.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
              {allDocs.length === 0 ? 'אין מלגות ב-Firestore' : 'לא נמצאו תוצאות'}
            </div>
          ) : pagedDocs.map(s => (
            <ScholarshipCard key={s.id} s={s} onClick={() => navigate(`/scholarship-list/${s.id}`)} />
          ))}
        </div>
        <PaginationBar />
      </div>

      {/* ── Desktop: Table ────────────────────────────────────────────────── */}
      <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                {[
                  { label: 'שם המלגה',    cls: '' },
                  { label: 'גובה המלגה',  cls: '' },
                  { label: 'תחום',        cls: '' },
                  { label: 'תאריך פתיחה', cls: '' },
                  { label: 'פעולות',      cls: 'text-center' },
                ].map(h => (
                  <th key={h.label} className={`px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-wide whitespace-nowrap ${h.cls}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <TableSkeleton rows={pageSize} />
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-error">
                    <span className="material-symbols-outlined text-4xl block mb-2 mx-auto">error</span>{error}
                  </td>
                </tr>
              ) : pagedDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2 mx-auto">search_off</span>
                    {allDocs.length === 0 ? 'אין מלגות ב-Firestore' : 'לא נמצאו תוצאות'}
                  </td>
                </tr>
              ) : pagedDocs.map(s => {
                const { icon, bg, color } = getFieldIcon(s.field);
                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/scholarship-list/${s.id}`)}
                    className="cursor-pointer group hover:bg-gray-100"
                  >
                    {/* Name + icon */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                          <span className={`material-symbols-outlined ${color}`}>{icon}</span>
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{s.name}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2">
                            {s.sector && <span>{s.sector}</span>}
                            {s.sector && (s.volunteering || s.military || s.periphery) && <span>·</span>}
                            {s.volunteering && <span className="text-emerald-600">התנדבות</span>}
                            {s.military     && <span className="text-indigo-600">שירות צבאי</span>}
                            {s.periphery    && <span className="text-amber-600">פריפריה</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-5">
                      <span className="font-black text-lg text-primary">
                        {s.amount ? (s.amount.match(/^\d/) ? `₪${s.amount}` : s.amount) : <span className="text-on-surface-variant/30 text-sm font-normal">—</span>}
                      </span>
                    </td>

                    {/* Field */}
                    <td className="px-6 py-5">
                      {s.field
                        ? <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">{s.field}</span>
                        : <span className="text-on-surface-variant/30 text-sm">—</span>}
                    </td>

                    {/* Opening date */}
                    <td className="px-6 py-5">
                      {s.openingDate ? (
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">event</span>
                          <span className="text-sm">{s.openingDate}</span>
                        </div>
                      ) : <span className="text-on-surface-variant/30 text-sm">—</span>}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                      </div>
                      {s.link?.startsWith('http') && (
                          <a
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="פתח קישור"
                          >
                              <button
                               className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-xs font-bold hover:opacity-80 transition-opacity "
                               >
                                 צפייה והגשה
                             </button>
                            {/* <span className="material-symbols-outlined text-primary text-base">open_in_new</span> */}
                          </a>
                    
                        )}

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar />
      </div>

      {/* ── Bottom Section ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Help card */}
        <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-bold text-lg mb-2">צריך עזרה?</h4>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">
              היועצים האקדמיים שלנו כאן כדי לסייע לך לבחור את המלגה המתאימה ביותר לפרופיל שלך.
            </p>
            <button className="bg-white text-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:opacity-90 transition-opacity">
              קביעת שיחת ייעוץ
            </button>
          </div>
          <span className="material-symbols-outlined absolute -bottom-6 -left-6 opacity-10" style={{ fontSize: '9rem' }}>help_center</span>
        </div>

        {/* Tip of the week */}
        <div className="md:col-span-2 bg-surface-container-low rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 border border-outline-variant/10">
          <div className="w-full sm:w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-primary/30">lightbulb</span>
          </div>
          <div className="text-right">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">טיפ השבוע</span>
            <h4 className="font-bold text-lg text-on-surface mt-1">איך לכתוב מכתב פנייה מנצח?</h4>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              ועדת המלגות מחפשת אותנטיות. הקפד לשלב דוגמאות אישיות על התמודדויות והצלחות,
              והסבר כיצד המלגה תקדם את השאיפות המקצועיות שלך.
            </p>
            <button className="inline-flex items-center gap-1 text-primary text-sm font-bold mt-3 hover:gap-2 transition-all">
              קרא את המדריך המלא
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <ScholarshipFormModal
          mode="create"
          onSave={handleCreate}
          onClose={() => setIsCreating(false)}
        />
      )}
    </>
  );
}
