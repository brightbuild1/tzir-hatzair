import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection, getDocs, getCountFromServer, query, orderBy, limit, startAfter,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Scholarship } from '../types/scholarship';
import { migrateScholarships, SCHOLARSHIP_DATA } from '../utils/migration';

async function fetchTotalCount(): Promise<number> {
  const snap = await getCountFromServer(collection(db, 'scholarships'));
  return snap.data().count;
}
const PAGE_SIZE=20
const PAGE_SIZE_OPTIONS = [5,10, 20] as const;
type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────
type FirestoreDoc = QueryDocumentSnapshot<DocumentData>;
type ScholarshipDoc = Scholarship & { id: string };

function buildQuery(cursor: FirestoreDoc | null, pageSize: number) {
  const base = collection(db, 'scholarships');
  return cursor
    ? query(base, orderBy('name'), startAfter(cursor), limit(pageSize))
    : query(base, orderBy('name'), limit(pageSize));
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, accentClass, textClass }: {
  label: string; value: string | number; accentClass: string; textClass: string;
}) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl shadow-card text-right border-r-4 ${accentClass}`}>
      <p className="text-sm text-on-surface-variant mb-1">{label}</p>
      <h4 className={`text-2xl font-black font-headline ${textClass}`}>{value}</h4>
    </div>
  );
}

function CriteriaCell({ value }: { value: string }) {
  if (!value) return <span className="text-on-surface-variant/30 text-sm">—</span>;
  if (value === 'V') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
        כן
      </span>
    );
  }
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium max-w-[140px] truncate"
      title={value}
    >
      {value}
    </span>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-surface-container rounded" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ScholarshipsManager() {
  const [docs,        setDocs]        = useState<ScholarshipDoc[]>([]);
  const [totalCount,  setTotalCount]  = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [migrating,   setMigrating]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [searchText,  setSearchText]  = useState('');
  const [pageNumber,  setPageNumber]  = useState(1);
  const [hasNext,     setHasNext]     = useState(false);
  const [pageSize,    setPageSize]    = useState<PageSizeOption>(20);

  const totalPages = totalCount !== null ? Math.ceil(totalCount / pageSize) : null;

  /**
   * Cursor cache indexed by page number (1-based).
   * cursors[1] = null          → page 1 always starts from the top
   * cursors[2] = lastOfPage1   → page 2 starts after the last doc of page 1
   * cursors[N] = lastOfPage(N-1)
   */
  const [cursors, setCursors] = useState<Record<number, FirestoreDoc | null>>({ 1: null });

  // ── Core fetch ───────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (
    page: number,
    cursorMap: Record<number, FirestoreDoc | null>,
    size: number,
  ) => {
    if (cursorMap[page] === undefined) return; // cursor not yet known → can't fetch
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(buildQuery(cursorMap[page], size));
      setDocs(snap.docs.map(d => ({ id: d.id, ...(d.data() as Scholarship) })));

      const full = snap.docs.length === size;
      setHasNext(full);

      // Cache the cursor for the next page if not already stored
      if (full) {
        const lastDoc = snap.docs[snap.docs.length - 1];
        setCursors(prev => prev[page + 1] === undefined ? { ...prev, [page + 1]: lastDoc } : prev);
      }
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הנתונים מ-Firestore');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load — fetch first page + total count in parallel
  useEffect(() => {
    fetchPage(1, cursors, pageSize);
    fetchTotalCount().then(setTotalCount).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ───────────────────────────────────────────────────────────────
  function goNext() {
    const next = pageNumber + 1;
    setPageNumber(next);
    setSearchText('');
    fetchPage(next, cursors, pageSize);
  }

  function goPrev() {
    const prev = pageNumber - 1;
    if (prev < 1) return;
    setPageNumber(prev);
    setSearchText('');
    fetchPage(prev, cursors, pageSize);
  }

  function goFirst() {
    setPageNumber(1);
    setSearchText('');
    fetchPage(1, cursors, pageSize);
  }

  // ── Page-size change — reset cursor cache and go back to page 1 ───────────────
  function handlePageSizeChange(newSize: PageSizeOption) {
    const freshCursors = { 1: null as FirestoreDoc | null };
    setPageSize(newSize);
    setPageNumber(1);
    setSearchText('');
    setCursors(freshCursors);
    fetchPage(1, freshCursors, newSize);
  }

  // ── Migration ─────────────────────────────────────────────────────────────────
  async function handleMigrate() {
    if (!confirm(`מעלה ${SCHOLARSHIP_DATA.length} מלגות ל-Firestore. להמשיך?`)) return;
    setMigrating(true);
    try {
      await migrateScholarships(SCHOLARSHIP_DATA);
      // Reset pagination, reload page 1 and refresh total count
      const freshCursors = { 1: null as FirestoreDoc | null };
      setCursors(freshCursors);
      setPageNumber(1);
      setSearchText('');
      await Promise.all([
        fetchPage(1, freshCursors, pageSize),
        fetchTotalCount().then(setTotalCount),
      ]);
    } catch (err) {
      console.error(err);
      alert('שגיאה במהלך ההגירה – ראה console לפרטים.');
    } finally {
      setMigrating(false);
    }
  }

  // ── Client-side filter within current page ────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchText.trim();
    if (!q) return docs;
    return docs.filter(s =>
      s.name.includes(q) || s.sector.includes(q) || s.field.includes(q)
    );
  }, [docs, searchText]);

  // ── Stats (from current page) ────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:        docs.length,
    volunteering: docs.filter(s => s.volunteering !== '').length,
    military:     docs.filter(s => s.military     !== '').length,
    periphery:    docs.filter(s => s.periphery    !== '').length,
  }), [docs]);

  const rangeStart = (pageNumber - 1) * PAGE_SIZE + 1;
  const rangeEnd   = (pageNumber - 1) * PAGE_SIZE + docs.length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div className="text-right">
          <h3 className="text-3xl font-black text-primary mb-2 font-headline">רשימת המלגות</h3>
          <p className="text-on-surface-variant max-w-md text-sm">
            {!loading && docs.length > 0
              ? `עמוד ${pageNumber}${totalPages ? ` מתוך ${totalPages}` : ''} · מציג ${rangeStart}–${rangeEnd}${totalCount ? ` מתוך ${totalCount}` : ''}`
              : 'טוען נתונים מ-Firestore...'}
          </p>
        </div>
        <div className="flex gap-3">
          {/* <button
            onClick={handleMigrate}
            disabled={migrating}
            title={`העלה ${SCHOLARSHIP_DATA.length} מלגות (חד-פעמי)`}
            className="px-5 py-2.5 bg-amber-100 text-amber-800 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-200 transition-colors text-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">
              {migrating ? 'hourglass_empty' : 'upload'}
            </span>
            {migrating ? 'מגר...' : 'הגר נתונים'}
          </button> */}
          <button className="px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold flex items-center gap-2 shadow-float hover:opacity-90 transition-opacity text-sm">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            הוספת מלגה
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label='סה"כ מלגות'          value={totalCount ?? '…'}  accentClass="border-blue-600"    textClass="text-primary" />
        <StatCard label="דורשות התנדבות"     value={stats.volunteering} accentClass="border-emerald-500" textClass="text-emerald-700" />
        <StatCard label="לשירות צבאי"        value={stats.military}     accentClass="border-indigo-500"  textClass="text-indigo-700" />
        <StatCard label="לפריפריה"           value={stats.periphery}    accentClass="border-amber-500"   textClass="text-amber-700" />
      </div>

      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden border border-outline-variant/10">

        {/* Filter bar */}
        <div className="p-4 border-b border-surface-container flex justify-between items-center bg-surface/50">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="סינון בעמוד הנוכחי לפי שם, תחום, מגזר..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border-none bg-surface-container-lowest shadow-card ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary focus:outline-none text-sm text-right text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Page-size selector */}
          <div className="flex items-center gap-2 flex-shrink-0 mr-4">
            <span className="text-xs text-on-surface-variant whitespace-nowrap">שורות לעמוד</span>
            <div className="flex gap-1">
              {PAGE_SIZE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => handlePageSizeChange(opt)}
                  disabled={loading}
                  className={`w-10 h-8 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                    pageSize === opt
                      ? 'bg-primary text-white font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-white hover:text-primary'
                  }`}
                  style={pageSize === opt ? { boxShadow: '0 4px 8px rgba(0,63,135,0.20)' } : {}}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                {['שם המלגה', 'תחום', 'מגזר', 'סכום', 'תאריך פתיחה', 'התנדבות', 'צבאי', 'פריפריה', ''].map(h => (
                  <th key={h} className="px-4 py-4 text-sm font-bold text-primary border-b border-surface-container whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <TableSkeleton />
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-error">
                    <span className="material-symbols-outlined text-4xl block mb-2 mx-auto">error</span>
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2 mx-auto">search_off</span>
                    {docs.length === 0
                      ? 'אין מלגות ב-Firestore. לחץ "הגר נתונים" להעלאה ראשונית.'
                      : 'לא נמצאו תוצאות בעמוד הנוכחי'}
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-primary/[0.03] transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-bold text-on-surface text-sm">{s.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.field
                        ? <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">{s.field}</span>
                        : <span className="text-on-surface-variant/30 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-sm">{s.sector || <span className="text-on-surface-variant/30">—</span>}</td>
                    <td className="px-4 py-3 text-sm font-bold text-on-surface">{s.amount || <span className="text-on-surface-variant/30 font-normal">—</span>}</td>
                    <td className="px-4 py-3 text-on-surface-variant text-sm">{s.openingDate || <span className="text-on-surface-variant/30">—</span>}</td>
                    <td className="px-4 py-3"><CriteriaCell value={s.volunteering} /></td>
                    <td className="px-4 py-3"><CriteriaCell value={s.military} /></td>
                    <td className="px-4 py-3"><CriteriaCell value={s.periphery} /></td>
                    <td className="px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {s.link?.startsWith('http') && (
                        <a href={s.link} target="_blank" rel="noopener noreferrer"
                          className="p-2 hover:bg-surface-container-lowest rounded-lg inline-flex border border-outline-variant/10 transition-colors">
                          <span className="material-symbols-outlined text-primary text-lg">open_in_new</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination bar (Stitch design) ─────────────────────────────────── */}
        <div className="px-6 py-5 bg-surface-container-low/50 border-t border-surface-container flex justify-between items-center">

          {/* Left: range + total */}
          <div className="text-xs text-on-surface-variant font-medium">
            {loading
              ? 'טוען...'
              : docs.length === 0
                ? 'אין תוצאות'
                : totalCount !== null
                  ? `מציג ${rangeStart}–${rangeEnd} מתוך ${totalCount}`
                  : `מציג ${rangeStart}–${rangeEnd}`}
          </div>

          {/* Right: navigation */}
          <div className="flex items-center gap-1">

            {/* First page (RTL → last_page icon points right = "go to start") */}
            <button onClick={goFirst} disabled={pageNumber === 1 || loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:bg-white hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined">last_page</span>
            </button>

            {/* Prev */}
            <button onClick={goPrev} disabled={pageNumber === 1 || loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

            {/* Page number window: prev · current · next [ … last ] */}
            <div className="flex mx-2 gap-1">
              {pageNumber > 1 && (
                <button onClick={goPrev} disabled={loading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white transition-all font-medium text-sm disabled:opacity-30">
                  {pageNumber - 1}
                </button>
              )}

              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm"
                style={{ boxShadow: '0 4px 8px rgba(0,63,135,0.20)' }}>
                {pageNumber}
              </button>

              {hasNext && (
                <button onClick={goNext} disabled={loading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white transition-all font-medium text-sm disabled:opacity-30">
                  {pageNumber + 1}
                </button>
              )}

              {/* Ellipsis + last page number when totalPages is known and we're far from the end */}
              {totalPages !== null && pageNumber + 1 < totalPages && (
                <>
                  <span className="w-8 h-8 flex items-end justify-center text-on-surface-variant/40 pb-1">…</span>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white transition-all font-medium text-sm"
                    title={`עמוד ${totalPages}`}
                    disabled // navigating directly to last page would require jumping cursors — disabled for now
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Next */}
            <button onClick={goNext} disabled={!hasNext || loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

          </div>
        </div>

      </div>
    </>
  );
}
