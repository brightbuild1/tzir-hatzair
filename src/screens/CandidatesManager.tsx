import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Candidate, CandidateStatus } from '../types/candidate';
import SmartFilter, { type FilterFieldConfig, type FilterValues } from '../components/SmartFilter';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

type CandidateDoc = Candidate & { id: string };

async function loadAllCandidates(): Promise<CandidateDoc[]> {
  const snap = await getDocs(query(collection(db, 'candidates'), orderBy('name')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Candidate) }));
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CandidateStatus, string> = {
  new:       'ממתין לטיפול',
  reviewing: 'בטיפול',
  applied:   'הגיש בקשה',
  approved:  'אושר',
  rejected:  'נדחה',
};

const STATUS_STYLE: Record<CandidateStatus, string> = {
  new:       'bg-blue-100 text-blue-700',
  reviewing: 'bg-amber-100 text-amber-700',
  applied:   'bg-purple-100 text-purple-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────

function TopScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-700 bg-emerald-50' : score >= 50 ? 'text-blue-700 bg-blue-50' : 'text-amber-700 bg-amber-50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>stars</span>
      {score}%
    </span>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex-shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-surface-container rounded" />
                <div className="h-3 w-24 bg-surface-container rounded" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4"><div className="h-4 w-28 bg-surface-container rounded" /></td>
          <td className="px-6 py-4"><div className="h-4 w-20 bg-surface-container rounded" /></td>
          <td className="px-6 py-4"><div className="h-6 w-24 bg-surface-container rounded-full" /></td>
          <td className="px-6 py-4"><div className="h-6 w-16 bg-surface-container rounded-full" /></td>
          <td className="px-6 py-4"><div className="h-4 w-20 bg-surface-container rounded" /></td>
        </tr>
      ))}
    </>
  );
}

// ── CandidatesManager ─────────────────────────────────────────────────────────

export default function CandidatesManager() {
  const navigate = useNavigate();

  const [allDocs,   setAllDocs]   = useState<CandidateDoc[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize,  setPageSize]  = useState<typeof PAGE_SIZE_OPTIONS[number]>(PAGE_SIZE_DEFAULT);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({});
  const [viewMode,  setViewMode]  = useState<'table' | 'cards'>('table');

  useEffect(() => {
    setLoading(true);
    loadAllCandidates()
      .then(setAllDocs)
      .catch(() => setError('שגיאה בטעינת המועמדים'))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived options from data ─────────────────────────────────────────────

  const sectorOptions = useMemo(() => {
    const unique = [...new Set(allDocs.flatMap(d => d.sectors ?? []).filter(Boolean))].sort();
    return unique.map(s => ({ value: s, label: s }));
  }, [allDocs]);

  const fieldOptions = useMemo(() => {
    const unique = [...new Set(allDocs.map(d => d.studyField).filter(Boolean))].sort();
    return unique.map(f => ({ value: f, label: f }));
  }, [allDocs]);

  // ── Filter fields config ──────────────────────────────────────────────────

  const filterFields = useMemo<FilterFieldConfig[]>(() => [
    { type: 'text',   key: 'name',   label: 'חיפוש לפי שם',     placeholder: 'שם מועמד...' },
    {
      type: 'select', key: 'status', label: 'סטטוס',
      options: [
        { value: 'new',       label: STATUS_LABELS.new },
        { value: 'reviewing', label: STATUS_LABELS.reviewing },
        { value: 'applied',   label: STATUS_LABELS.applied },
        { value: 'approved',  label: STATUS_LABELS.approved },
        { value: 'rejected',  label: STATUS_LABELS.rejected },
      ],
    },
    { type: 'select', key: 'sector',     label: 'מגזר',         options: sectorOptions },
    { type: 'select', key: 'studyField', label: 'תחום לימוד',   options: fieldOptions },
  ], [sectorOptions, fieldOptions]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filteredDocs = useMemo(() => {
    let docs = allDocs;
    const { name, status, sector, studyField } = appliedFilters as Record<string, string>;

    if (name)       docs = docs.filter(d => d.name.toLowerCase().includes(name.toLowerCase()));
    if (status)     docs = docs.filter(d => d.status === status);
    if (sector)     docs = docs.filter(d => (d.sectors ?? []).includes(sector));
    if (studyField) docs = docs.filter(d => d.studyField === studyField);

    return docs;
  }, [allDocs, appliedFilters]);

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalCount  = filteredDocs.length;
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage    = Math.min(pageNumber, totalPages);
  const rangeStart  = (safePage - 1) * pageSize;
  const rangeEnd    = Math.min(rangeStart + pageSize, totalCount);
  const pagedDocs   = filteredDocs.slice(rangeStart, rangeEnd);
  const hasPrev     = safePage > 1;
  const hasNext     = safePage < totalPages;

  function goTo(n: number)  { setPageNumber(Math.max(1, Math.min(n, totalPages))); }
  function goNext()         { goTo(safePage + 1); }
  function goPrev()         { goTo(safePage - 1); }

  function handleFilterApply(values: FilterValues) {
    setAppliedFilters(values);
    setPageNumber(1);
  }

  const hasFilters = Object.keys(appliedFilters).length > 0;

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-headline">רשימת מועמדים</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {loading ? 'טוען...' : (
              <span>
                {hasFilters
                  ? <><span className="font-bold text-primary">{totalCount}</span> מועמדים תואמים</>
                  : <><span className="font-bold text-primary">{totalCount}</span> מועמדים רשומים</>
                }
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-surface-container rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-xl">table_rows</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-xl">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter panel ─────────────────────────────────────── */}
      <SmartFilter fields={filterFields} onApply={handleFilterApply} />

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* ── TABLE VIEW ────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase tracking-wide">מועמד</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase tracking-wide">תחום לימוד</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase tracking-wide">מגזר</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase tracking-wide">סטטוס</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase tracking-wide text-center">התאמה</th>
                  <th className="px-6 py-4 font-bold text-on-surface-variant text-xs uppercase tracking-wide">תאריך הרשמה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {loading ? (
                  <TableSkeleton rows={8} />
                ) : pagedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 block mb-2">person_search</span>
                      <p className="text-on-surface-variant text-sm">לא נמצאו מועמדים</p>
                    </td>
                  </tr>
                ) : (
                  pagedDocs.map(doc => (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/candidate-list/${doc.id}`)}
                      className="cursor-pointer transition-colors hover:bg-surface-container-low/40"
                    >
                      {/* Name + email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 text-primary font-bold text-base">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{doc.name}</p>
                            <p className="text-xs text-on-surface-variant">{doc.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Study field */}
                      <td className="px-6 py-4 text-on-surface-variant">
                        {doc.studyField || <span className="text-on-surface-variant/30">—</span>}
                      </td>

                      {/* Sector */}
                      <td className="px-6 py-4">
                        {(doc.sectors ?? []).length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {doc.sectors[0]}
                            </span>
                            {doc.sectors.length > 1 && (
                              <span className="text-xs text-on-surface-variant">+{doc.sectors.length - 1}</span>
                            )}
                          </div>
                        ) : <span className="text-on-surface-variant/30">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={doc.status} />
                      </td>

                      {/* Match count + top score */}
                      <td className="px-6 py-4 text-center">
                        {doc.matchedScholarships?.length > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold text-on-surface">{doc.matchedScholarships.length}</span>
                            <TopScoreBadge score={doc.matchedScholarships[0].score} />
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/30 text-sm">—</span>
                        )}
                      </td>

                      {/* Created date */}
                      <td className="px-6 py-4 text-on-surface-variant text-xs">
                        {doc.createdAt
                          ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString('he-IL')
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/30">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span>הצג</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value) as typeof PAGE_SIZE_OPTIONS[number]); setPageNumber(1); }}
                  className="bg-surface-container border-none rounded-lg px-2 py-1 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>| {rangeStart + 1}–{rangeEnd} מתוך {totalCount}</span>
              </div>
              <div className="flex items-center gap-1" dir="ltr">
                <button onClick={goPrev} disabled={!hasPrev} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                  const page = start + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => goTo(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === safePage ? 'bg-primary text-white shadow-sm' : 'hover:bg-surface-container text-on-surface-variant'}`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button onClick={goNext} disabled={!hasNext} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CARDS VIEW ─────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 animate-pulse border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-28 bg-surface-container rounded" />
                      <div className="h-3 w-20 bg-surface-container rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-surface-container rounded" />
                    <div className="h-3 w-3/4 bg-surface-container rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : pagedDocs.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-3">person_search</span>
              <p className="text-on-surface-variant">לא נמצאו מועמדים</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/candidate-list/${doc.id}`)}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 text-primary font-bold text-base">
                        {doc.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">{doc.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{doc.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>

                  <div className="space-y-2 text-sm">
                    {doc.studyField && (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-base">school</span>
                        <span>{doc.studyField}</span>
                        {doc.studyYear && <span className="text-xs">· שנה {doc.studyYear}</span>}
                      </div>
                    )}
                    {(doc.sectors ?? []).length > 0 && (
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-base">group</span>
                        <span>{doc.sectors[0]}{doc.sectors.length > 1 ? ` +${doc.sectors.length - 1}` : ''}</span>
                      </div>
                    )}
                  </div>

                  {doc.matchedScholarships?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">{doc.matchedScholarships.length} מלגות תואמות</span>
                      <TopScoreBadge score={doc.matchedScholarships[0].score} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination for cards */}
          {!loading && totalCount > pageSize && (
            <div className="flex justify-center gap-1 mt-4" dir="ltr">
              <button onClick={goPrev} disabled={!hasPrev} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                const page = start + i;
                if (page > totalPages) return null;
                return (
                  <button key={page} onClick={() => goTo(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === safePage ? 'bg-primary text-white' : 'hover:bg-surface-container text-on-surface-variant'}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={goNext} disabled={!hasNext} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
