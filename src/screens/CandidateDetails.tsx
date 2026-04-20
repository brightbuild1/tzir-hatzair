import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Candidate, CandidateStatus, MatchResult, MatchBreakdown } from '../types/candidate';
import type { Scholarship } from '../types/scholarship';
import { runMatching } from '../utils/matching';

// ── Types ─────────────────────────────────────────────────────────────────────

type CandidateDoc = Candidate & { id: string };
type ScholarshipDoc = Scholarship & { id: string };

interface Meeting {
  date:      string; // 'YYYY-MM-DD'
  subject:   string;
  summary:   string;
  outcome:   string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
type MeetingDoc = Meeting & { id: string };

const MEETING_EMPTY: Omit<Meeting, 'createdAt' | 'updatedAt'> = {
  date: new Date().toISOString().slice(0, 10),
  subject: '',
  summary: '',
  outcome: '',
};

// ── Status helpers ────────────────────────────────────────────────────────────

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

// ── Match subtitle generator ──────────────────────────────────────────────────

function matchSubtitle(res: MatchResult, sch?: ScholarshipDoc): string {
  const b = res.breakdown;
  const dims: [keyof MatchBreakdown, number][] = [
    ['field', b.field], ['sector', b.sector], ['military', b.military],
    ['periphery', b.periphery], ['volunteering', b.volunteering],
  ];
  const active = dims.filter(([, v]) => v > 0).sort((a, c) => c[1] - a[1]);

  if (active.length === 0) return 'התאמה כללית';

  const top = active[0][0];
  const topVal = active[0][1];

  if (top === 'field')        return topVal >= 0.9 ? 'התאמה אקדמית מלאה לתחום הלימוד'  : 'התאמה חלקית לתחום הלימוד';
  if (top === 'sector')       return topVal >= 0.9 ? 'התאמה מגזרית מצוינת'              : 'התאמה חלקית על בסיס מגזר';
  if (top === 'military')     return topVal >= 0.9 ? 'התאמה על בסיס שירות צבאי'         : 'זכאות חלקית לשירות צבאי';
  if (top === 'periphery')    return topVal >= 0.9 ? 'התאמה על בסיס מגורים בפריפריה'    : 'התאמה גאוגרפית חלקית';
  if (top === 'volunteering') return topVal >= 0.9 ? 'נדרשת פעילות התנדבותית'           : 'נדרשת רמת שעות התנדבות';

  if (sch?.amount) return `מלגה בסך ${sch.amount}`;
  return 'התאמה חלקית לקריטריונים';
}

// ── Match card ────────────────────────────────────────────────────────────────

function MatchCard({ res, sch, rank }: { res: MatchResult; sch?: ScholarshipDoc; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  const score = res.score;
  const scoreColor  = score >= 80 ? '#059669' : score >= 60 ? '#003f87' : score >= 40 ? '#d97706' : '#dc2626';
  const scoreBorder = score >= 80 ? 'border-emerald-200' : score >= 60 ? 'border-blue-200' : score >= 40 ? 'border-amber-200' : 'border-red-200';
  const scoreBg     = score >= 80 ? 'bg-emerald-50'      : score >= 60 ? 'bg-blue-50'      : score >= 40 ? 'bg-amber-50'      : 'bg-red-50';

  return (
    <div
      className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-all cursor-pointer select-none"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-center gap-0 p-5">
        {/* Score block — left side (end in RTL) */}
        <div className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 ${scoreBorder} ${scoreBg} flex flex-col items-center justify-center ml-4`} dir="ltr">
          <span className="text-3xl font-black leading-none" style={{ color: scoreColor }}>{score}</span>
          <span className="text-sm font-bold" style={{ color: scoreColor }}>%</span>
        </div>

        {/* Text — right side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-xs text-on-surface-variant/40 font-medium flex-shrink-0">#{rank}</span>
          </div>
          <h3 className="font-extrabold text-on-surface text-sm leading-snug">{res.scholarshipName}</h3>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{matchSubtitle(res, sch)}</p>
          {sch?.amount && (
            <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">payments</span>
              {sch.amount}
            </p>
          )}
        </div>
      </div>

      {/* Expand: breakdown bars */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-outline-variant/10 mt-0">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider my-3">פירוט ציון</p>
          <BreakdownBars breakdown={res.breakdown} />
          {sch?.link && (
            <a href={sch.link} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-primary font-bold mt-3 hover:underline">
              <span className="material-symbols-outlined text-base">open_in_new</span>
              לאתר המלגה
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Breakdown bars ────────────────────────────────────────────────────────────

const BREAKDOWN_LABELS: Record<keyof MatchBreakdown, string> = {
  field: 'תחום לימוד', sector: 'מגזר', military: 'שירות צבאי',
  periphery: 'פריפריה', volunteering: 'התנדבות',
};

function BreakdownBars({ breakdown }: { breakdown: MatchBreakdown }) {
  return (
    <div className="space-y-1.5 mt-3">
      {(Object.entries(breakdown) as [keyof MatchBreakdown, number][]).map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant w-20 text-right flex-shrink-0">{BREAKDOWN_LABELS[key]}</span>
          <div className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${val * 100}%`, background: val >= 0.7 ? '#059669' : val >= 0.4 ? '#003f87' : '#d97706' }} />
          </div>
          <span className="text-xs text-on-surface-variant w-7 text-left flex-shrink-0">{Math.round(val * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string | number | boolean | undefined }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'כן' : 'לא') : String(value);
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-outline-variant/10 last:border-0">
      <span className="material-symbols-outlined text-primary/60 text-[18px] mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-medium text-on-surface">{display}</p>
      </div>
    </div>
  );
}

// ── Meeting form ──────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-2.5 px-3.5 text-sm text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-on-surface-variant/40';

interface MeetingFormProps {
  initial: Omit<Meeting, 'createdAt' | 'updatedAt'>;
  onSave:  (data: Omit<Meeting, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  saving:  boolean;
  isEdit?: boolean;
}

function MeetingForm({ initial, onSave, onCancel, saving, isEdit }: MeetingFormProps) {
  const [form, setForm] = useState(initial);
  const [err,  setErr]  = useState('');

  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); setErr(''); }

  async function submit() {
    if (!form.subject.trim()) { setErr('נא להזין נושא הפגישה'); return; }
    if (!form.date)            { setErr('נא לבחור תאריך');        return; }
    await onSave(form);
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-primary">{isEdit ? 'עריכת פגישה' : 'פגישה חדשה'}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">תאריך פגישה *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className={`${INPUT_CLS} cursor-pointer`} dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">נושא הפגישה *</label>
          <input type="text" value={form.subject} onChange={e => set('subject', e.target.value)}
            placeholder="למשל: שיחת היכרות, בדיקת מסמכים..." className={INPUT_CLS} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-1">תמצית הפגישה</label>
        <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
          rows={3} placeholder="מה דיברתם? נקודות עיקריות מהשיחה..."
          className={`${INPUT_CLS} resize-none`} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-on-surface-variant mb-1">החלטות / צעדים הבאים</label>
        <textarea value={form.outcome} onChange={e => set('outcome', e.target.value)}
          rows={2} placeholder="מה הוחלט? מה הצעד הבא?"
          className={`${INPUT_CLS} resize-none`} />
      </div>

      {err && (
        <p className="text-xs text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-base">error</span>{err}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container transition-colors disabled:opacity-50">
          ביטול
        </button>
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : <span className="material-symbols-outlined text-base">save</span>}
          {isEdit ? 'עדכן' : 'שמור פגישה'}
        </button>
      </div>
    </div>
  );
}

// ── Meeting card ──────────────────────────────────────────────────────────────

interface MeetingCardProps {
  meeting:       MeetingDoc;
  onEdit:        () => void;
  onDelete:      () => void;
  deleting:      boolean;
  confirmDelete: string | null;
  onConfirmDelete: (id: string | null) => void;
}

function MeetingCard({ meeting, onEdit, onDelete, deleting, confirmDelete, onConfirmDelete }: MeetingCardProps) {
  const dateLabel = new Date(meeting.date + 'T12:00:00').toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-surface-container-low/40 border-b border-outline-variant/10">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[18px]">event</span>
          <span className="text-sm font-bold text-on-surface">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
            title="ערוך">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          {confirmDelete === meeting.id ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-error font-medium">למחוק?</span>
              <button onClick={onDelete} disabled={deleting}
                className="p-1.5 rounded-lg bg-error text-white hover:opacity-80 transition-opacity disabled:opacity-50">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
              <button onClick={() => onConfirmDelete(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ) : (
            <button onClick={() => onConfirmDelete(meeting.id)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
              title="מחק">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">נושא</p>
          <p className="text-sm font-semibold text-on-surface">{meeting.subject}</p>
        </div>

        {meeting.summary && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">תמצית הפגישה</p>
            <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{meeting.summary}</p>
          </div>
        )}

        {meeting.outcome && (
          <div className="bg-emerald-50 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">task_alt</span>
              החלטות / צעדים הבאים
            </p>
            <p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">{meeting.outcome}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CandidateDetails ──────────────────────────────────────────────────────────

type TabId = 'matches' | 'info' | 'meetings';

export default function CandidateDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Candidate + scholarships + matching
  const [candidate,    setCandidate]   = useState<CandidateDoc | null>(null);
  const [scholarships, setScholarships] = useState<ScholarshipDoc[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState<string | null>(null);

  // Save (status / notes / match results)
  const [saving,   setSaving]  = useState(false);
  const [saveMsg,  setSaveMsg] = useState('');

  // Editable candidate fields
  const [editStatus, setEditStatus] = useState<CandidateStatus>('new');
  const [editNotes,  setEditNotes]  = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<TabId>('matches');

  // Meetings
  const [meetings,         setMeetings]        = useState<MeetingDoc[]>([]);
  const [meetingsLoading,  setMeetingsLoading] = useState(false);
  const [showNewForm,      setShowNewForm]     = useState(false);
  const [editingId,        setEditingId]       = useState<string | null>(null);
  const [meetingSaving,    setMeetingSaving]   = useState(false);
  const [confirmDeleteId,  setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId,       setDeletingId]      = useState<string | null>(null);

  // ── Load candidate + scholarships ──────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'candidates', id));
        if (!snap.exists()) { setError('מועמד לא נמצא'); return; }

        const cand: CandidateDoc = { id: snap.id, ...(snap.data() as Candidate) };
        setCandidate(cand);
        setEditStatus(cand.status);
        setEditNotes(cand.notes ?? '');

        const schSnap = await getDocs(query(collection(db, 'scholarships'), orderBy('name')));
        const schList: ScholarshipDoc[] = schSnap.docs.map(d => ({ id: d.id, ...(d.data() as Scholarship) }));
        setScholarships(schList);
        setMatchResults(runMatching(cand, schList.map(s => ({ id: s.id, data: s }))));
      } catch {
        setError('שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Load meetings ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    setMeetingsLoading(true);
    getDocs(query(collection(db, 'candidates', id, 'meetings'), orderBy('date', 'desc')))
      .then(snap => setMeetings(snap.docs.map(d => ({ id: d.id, ...(d.data() as Meeting) }))))
      .catch(() => {/* silent */})
      .finally(() => setMeetingsLoading(false));
  }, [id]);

  // ── Save candidate (status + notes) ───────────────────────────────────────

  async function saveChanges() {
    if (!id || !candidate) return;
    setSaving(true); setSaveMsg('');
    try {
      await updateDoc(doc(db, 'candidates', id), { status: editStatus, notes: editNotes, updatedAt: serverTimestamp() });
      setCandidate(p => p ? { ...p, status: editStatus, notes: editNotes } : p);
      setSaveMsg('נשמר בהצלחה');
    } catch { setSaveMsg('שגיאה בשמירה'); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
  }

  async function saveMatchResults() {
    if (!id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'candidates', id), { matchedScholarships: matchResults, updatedAt: serverTimestamp() });
      setSaveMsg('תוצאות ההתאמה נשמרו');
    } catch { setSaveMsg('שגיאה בשמירה'); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
  }

  // ── Meetings CRUD ──────────────────────────────────────────────────────────

  async function createMeeting(data: Omit<Meeting, 'createdAt' | 'updatedAt'>) {
    if (!id) return;
    setMeetingSaving(true);
    try {
      const ref = await addDoc(collection(db, 'candidates', id, 'meetings'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const newMeeting: MeetingDoc = { id: ref.id, ...data };
      setMeetings(prev => [newMeeting, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setShowNewForm(false);
    } catch { /* ignore */ }
    finally { setMeetingSaving(false); }
  }

  async function updateMeeting(meetingId: string, data: Omit<Meeting, 'createdAt' | 'updatedAt'>) {
    if (!id) return;
    setMeetingSaving(true);
    try {
      await updateDoc(doc(db, 'candidates', id, 'meetings', meetingId), {
        ...data, updatedAt: serverTimestamp(),
      });
      setMeetings(prev =>
        prev.map(m => m.id === meetingId ? { ...m, ...data } : m)
            .sort((a, b) => b.date.localeCompare(a.date))
      );
      setEditingId(null);
    } catch { /* ignore */ }
    finally { setMeetingSaving(false); }
  }

  async function deleteMeeting(meetingId: string) {
    if (!id) return;
    setDeletingId(meetingId);
    try {
      await deleteDoc(doc(db, 'candidates', id, 'meetings', meetingId));
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      setConfirmDeleteId(null);
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  // ── Labels ─────────────────────────────────────────────────────────────────

  const militaryTypeLabel: Record<string, string> = {
    combat: 'לוחם', support: 'תומכ"ל', national_service: 'שירות לאומי',
    reserves: 'מילואים', none: 'לא שירת',
  };
  const maritalLabel: Record<string, string> = {
    single: 'רווק/ה', married: 'נשוי/נשואה', divorced: 'גרוש/גרושה', widowed: 'אלמן/אלמנה',
  };

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64" dir="rtl">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
    </div>
  );

  if (error || !candidate) return (
    <div className="text-center py-20" dir="rtl">
      <span className="material-symbols-outlined text-5xl text-error/60 block mb-3">error</span>
      <p className="text-on-surface-variant">{error ?? 'מועמד לא נמצא'}</p>
      <button onClick={() => navigate('/candidate-list')} className="mt-4 text-primary font-bold hover:underline">
        חזרה לרשימה
      </button>
    </div>
  );

  const topScore = matchResults[0]?.score ?? 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Back + page header ──────────────────────────────── */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/candidate-list')}
          className="flex items-center gap-1 text-primary hover:underline text-sm font-medium mt-1 flex-shrink-0">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>חזרה
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-primary font-headline">{candidate.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[candidate.status]}`}>
              {STATUS_LABELS[candidate.status]}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-0.5">{candidate.email} · {candidate.phone}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg.includes('שגיאה') ? 'text-error' : 'text-emerald-600'}`}>
              {saveMsg}
            </span>
          )}
          <button onClick={saveChanges} disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">save</span>שמור
          </button>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Quick stats + Status + Notes ───────────── */}
        <div className="space-y-4">

          {/* Quick stats */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
            <h2 className="text-sm font-bold text-on-surface-variant mb-4">סיכום מהיר</h2>
            <div className="grid grid-cols-3 divide-x divide-x-reverse divide-outline-variant/20">
              <div className="text-center px-2">
                <p className="text-2xl font-extrabold text-primary">{matchResults.length}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">מלגות</p>
              </div>
              <div className="text-center px-2">
                <p className="text-2xl font-extrabold"
                  style={{ color: topScore >= 70 ? '#059669' : topScore >= 50 ? '#003f87' : '#d97706' }}>
                  {topScore}%
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">ציון מקס׳</p>
              </div>
              <div className="text-center px-2">
                <p className="text-2xl font-extrabold text-on-surface">{meetings.length}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">פגישות</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
            <h2 className="text-sm font-bold text-on-surface-variant mb-3">סטטוס מועמד</h2>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value as CandidateStatus)}
              className="w-full bg-surface-container border-none rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-right appearance-none cursor-pointer">
              {(Object.entries(STATUS_LABELS) as [CandidateStatus, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
            <h2 className="text-sm font-bold text-on-surface-variant mb-3">הערות מנהל</h2>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
              rows={5} placeholder="הוסף הערות על המועמד..."
              className="w-full bg-surface-container border-none rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none text-right placeholder:text-on-surface-variant/40" />
          </div>
        </div>

        {/* ── RIGHT: Tabs ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tab bar */}
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 flex-wrap">
              {/* Info tab */}
            <button onClick={() => setActiveTab('info')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-base">person</span>
              פרטי מועמד
            </button>
            {/* Meetings tab */}
            <button onClick={() => setActiveTab('meetings')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'meetings' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-base">event_note</span>
              פגישות
              {meetings.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'meetings' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {meetings.length}
                </span>
              )}
            </button>

            {/* Matches tab */}
            <button onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'matches' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-base">workspace_premium</span>
              מלגות ({matchResults.length})
            </button>

          
          </div>

          {/* ── TAB: Meetings ────────────────────────────────── */}
          {activeTab === 'meetings' && (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-on-surface">
                  תיעוד פגישות
                  {meetings.length > 0 && <span className="text-on-surface-variant font-normal text-sm mr-1">({meetings.length})</span>}
                </h2>
                {!showNewForm && (
                  <button onClick={() => { setShowNewForm(true); setEditingId(null); }}
                    className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-base">add</span>
                    פגישה חדשה
                  </button>
                )}
              </div>

              {/* New meeting form */}
              {showNewForm && (
                <MeetingForm
                  initial={MEETING_EMPTY}
                  onSave={createMeeting}
                  onCancel={() => setShowNewForm(false)}
                  saving={meetingSaving}
                />
              )}

              {/* Loading */}
              {meetingsLoading && (
                <div className="flex justify-center py-8">
                  <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                </div>
              )}

              {/* Empty state */}
              {!meetingsLoading && meetings.length === 0 && !showNewForm && (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 text-center py-14">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/25 block mb-3">event_note</span>
                  <p className="text-on-surface-variant font-medium">אין פגישות מתועדות עדיין</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1 mb-5">לחץ על "פגישה חדשה" כדי להוסיף את הפגישה הראשונה</p>
                  <button onClick={() => setShowNewForm(true)}
                    className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-base">add</span>
                    הוסף פגישה ראשונה
                  </button>
                </div>
              )}

              {/* Meeting cards */}
              {!meetingsLoading && meetings.map(meeting => (
                editingId === meeting.id ? (
                  <MeetingForm
                    key={meeting.id}
                    initial={{ date: meeting.date, subject: meeting.subject, summary: meeting.summary, outcome: meeting.outcome }}
                    onSave={data => updateMeeting(meeting.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={meetingSaving}
                    isEdit
                  />
                ) : (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={() => { setEditingId(meeting.id); setShowNewForm(false); }}
                    onDelete={() => deleteMeeting(meeting.id)}
                    deleting={deletingId === meeting.id}
                    confirmDelete={confirmDeleteId}
                    onConfirmDelete={setConfirmDeleteId}
                  />
                )
              ))}
            </div>
          )}

          {/* ── TAB: Matches ─────────────────────────────────── */}
          {activeTab === 'matches' && (
            <div className="space-y-4">

              {/* Section header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-on-surface font-headline">ציוני התאמה למלגות</h2>
                  {matchResults.length > 0 && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {matchResults.length} מלגות מתאימות · לחץ על כרטיסייה לפירוט
                    </p>
                  )}
                </div>
                <button onClick={saveMatchResults} disabled={saving || matchResults.length === 0}
                  className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined text-base">cloud_upload</span>
                  שמור תוצאות
                </button>
              </div>

              {/* Empty state */}
              {matchResults.length === 0 && (
                <div className="bg-white rounded-2xl border border-outline-variant/15 text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/25 block mb-3">search_off</span>
                  <p className="text-on-surface-variant font-medium">לא נמצאו מלגות מתאימות</p>
                  <p className="text-xs text-on-surface-variant/50 mt-1">
                    {scholarships.length === 0 ? 'לא נטענו מלגות' : 'המועמד אינו עומד בקריטריונים של אף מלגה'}
                  </p>
                </div>
              )}

              {/* Card grid */}
              {matchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchResults.map((res, idx) => (
                    <MatchCard
                      key={res.scholarshipId}
                      res={res}
                      sch={scholarships.find(s => s.id === res.scholarshipId)}
                      rank={idx + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Candidate info ──────────────────────────── */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">פרטים אישיים</h3>
                <InfoRow icon="person"   label="שם מלא"     value={candidate.name} />
                <InfoRow icon="mail"     label="אימייל"      value={candidate.email} />
                <InfoRow icon="phone"    label="טלפון"       value={candidate.phone} />
                <InfoRow icon="favorite" label="מצב משפחתי" value={maritalLabel[candidate.maritalStatus]} />
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">לימודים</h3>
                <InfoRow icon="school"    label="תחום לימוד" value={candidate.studyField} />
                <InfoRow icon="apartment" label="מוסד"        value={candidate.institution} />
                <InfoRow icon="counter_1" label="שנת לימוד"  value={candidate.studyYear} />
                <InfoRow icon="group"     label="מגזר"        value={(candidate.sectors ?? []).join(', ')} />
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">שירות צבאי</h3>
                <InfoRow icon="military_tech"  label="שירת בצבא"   value={candidate.militaryService} />
                <InfoRow icon="badge"          label="סוג שירות"    value={militaryTypeLabel[candidate.militaryType]} />
                <InfoRow icon="calendar_month" label="שנות שירות"  value={candidate.militaryYears ? `${candidate.militaryYears} שנים` : undefined} />
                <InfoRow icon="event_repeat"   label="ימי מילואים" value={candidate.reserveDays ? `${candidate.reserveDays} ימים` : undefined} />
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">גאוגרפיה והתנדבות</h3>
                <InfoRow icon="location_on"        label="אזור מגורים"  value={candidate.residenceArea} />
                <InfoRow icon="map"                label="פריפריה"       value={candidate.periphery} />
                <InfoRow icon="volunteer_activism" label="מתנדב"         value={candidate.volunteering} />
                <InfoRow icon="schedule"           label="שע׳ שבועיות"  value={candidate.volunteeringWeeklyH ? `${candidate.volunteeringWeeklyH} שע'/שבוע` : undefined} />
                <InfoRow icon="timer"              label="שע׳ שנתיות"   value={candidate.volunteeringHours ? `${candidate.volunteeringHours} שעות/שנה` : undefined} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
