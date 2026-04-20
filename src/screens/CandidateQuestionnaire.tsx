/**
 * CandidateQuestionnaire — pixel-perfect rebuild based on Stitch design.
 * Public, mobile-first. No auth required.
 * Saves to Firestore `candidates` collection + runs matching algorithm.
 */

import { useState } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Candidate, MilitaryType, MaritalStatus } from '../types/candidate';
import type { Scholarship } from '../types/scholarship';
import { runMatching } from '../utils/matching';

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;
const headerName="מרכז ייעוץ"
const SECTOR_OPTIONS = [
  'כללי', 'דתי-לאומי', 'חרדים', 'חברה ערבית', 'דרוזים',
  'אתיופיה', 'עולים', 'דור ראשון', 'נשים', 'מצוקה כלכלית', 'חיילים בודדים',
];

const AREA_OPTIONS = [
  'ירושלים', 'תל אביב', 'חיפה', 'באר שבע', 'נגב', 'גליל',
  'צפון', 'מרכז', 'שרון', 'עוטף עזה', 'ים המלח', 'גולן',
];

// ── Form state ────────────────────────────────────────────────────────────────

interface FormData {
  name: string; email: string; phone: string; maritalStatus: MaritalStatus;
  studyField: string; institution: string; studyYear: number; sectors: string[];
  militaryService: boolean; militaryType: MilitaryType; militaryYears: number; reserveDays: number;
  periphery: boolean; residenceArea: string;
  volunteering: boolean; volunteeringHours: number; volunteeringWeeklyH: number;
}

const INITIAL: FormData = {
  name: '', email: '', phone: '', maritalStatus: 'single',
  studyField: '', institution: '', studyYear: 1, sectors: [],
  militaryService: false, militaryType: 'none', militaryYears: 0, reserveDays: 0,
  periphery: false, residenceArea: '',
  volunteering: false, volunteeringHours: 0, volunteeringWeeklyH: 0,
};

// ── Validation ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// const PHONE_RE = /^(\+972|0)[2-9]\d{7,8}$|^(\+972|0)5\d{8}$/;

function normalizePhone(p: string) {
  return p.replace(/[\s\-().]/g, '');
}

function validate(step: number, f: FormData): string | null {
  if (step === 1) {
    if (!f.name.trim()) return 'נא למלא שם מלא';

    if (!f.email.trim()) return 'נא למלא כתובת אימייל';
    if (!EMAIL_RE.test(f.email.trim())) return 'כתובת האימייל אינה תקינה (למשל: name@mail.com)';

    if (!f.phone.trim()) return 'נא למלא מספר טלפון';
    const cleaned = normalizePhone(f.phone.trim());
    if (!/^\+?[\d]{9,13}$/.test(cleaned)) return 'מספר הטלפון אינו תקין (למשל: 050-0000000)';
  }
  if (step === 2) {
    if (!f.studyField.trim())  return 'נא למלא תחום לימוד';
    if (!f.institution.trim()) return 'נא למלא שם המוסד';
  }
  return null;
}

// ── Shared input style ────────────────────────────────────────────────────────

const INPUT = 'w-full bg-surface-container-lowest border-none rounded-lg p-3 text-on-surface text-right shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-on-surface-variant/50';
const SELECT_INPUT = `${INPUT} appearance-none cursor-pointer`;

// ── Field error ───────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-error text-xs mt-1 text-right flex items-center gap-1">
      <span className="material-symbols-outlined text-sm leading-none">error</span>
      {msg}
    </p>
  );
}

// ── Chip button ───────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 px-4 rounded-xl font-bold transition-all text-sm ${
        selected
          ? 'border-2 border-primary text-primary bg-primary/5'
          : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      {label}
    </button>
  );
}

// ── Radio card ────────────────────────────────────────────────────────────────

function RadioCard({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
        checked
          ? 'bg-primary/5 border-2 border-primary'
          : 'bg-surface-container-high border border-transparent hover:bg-surface-container-highest'
      }`}
      onClick={onChange}
    >
      <span className={`font-semibold text-sm ${checked ? 'text-primary' : 'text-on-surface'}`}>{label}</span>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        checked ? 'border-primary' : 'border-outline-variant'
      }`}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
    </label>
  );
}

// ── Bento card ────────────────────────────────────────────────────────────────

function BentoCard({ icon, title, description, children }: {
  icon: string; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-low p-6 rounded-xl text-right">
      <span className="material-symbols-outlined text-primary mb-2 block"
        style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <h4 className="font-bold mb-1 text-on-surface">{title}</h4>
      {description && <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">{description}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

// ── Expanded panel ────────────────────────────────────────────────────────────

function ExpandedPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 p-5 bg-primary/5 rounded-xl border-r-4 border-primary">
      <h3 className="text-primary font-bold mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="bg-surface-container-low h-px my-2" />;
}

// ── STEP COMPONENTS ───────────────────────────────────────────────────────────

// Step 1: Personal info + marital status
function Step1({ f, set }: { f: FormData; set: (k: keyof FormData, v: string | number | boolean) => void }) {
  const [touched, setTouch] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouch(t => ({ ...t, [k]: true }));

  const emailErr = touched.email
    ? (!f.email.trim() ? 'נא למלא כתובת אימייל' : !EMAIL_RE.test(f.email.trim()) ? 'כתובת האימייל אינה תקינה (למשל: name@mail.com)' : null)
    : null;

  const phoneErr = touched.phone
    ? (!f.phone.trim() ? 'נא למלא מספר טלפון' : !/^\+?[\d]{9,13}$/.test(normalizePhone(f.phone.trim())) ? 'מספר הטלפון אינו תקין (למשל: 050-0000000)' : null)
    : null;

  return (
    <div className="space-y-8">
      <section className="text-right">
        <h1 className="text-3xl font-black text-primary font-headline mb-2">פרטים אישיים ורקע</h1>
        <p className="text-on-surface-variant">המידע שתזין יעזור לנו להתאים עבורך את המלגות המדויקות ביותר.</p>
      </section>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-6">
        {/* Name */}
        <div className="space-y-2 text-right">
          <label className="block text-on-surface font-bold text-base">שם מלא</label>
          <input type="text" value={f.name} onChange={e => set('name', e.target.value)}
            placeholder="ישראל ישראלי" className={INPUT} />
        </div>

        <Divider />

        {/* Email + Phone bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BentoCard icon="mail" title="כתובת אימייל"
            description="לצורך קבלת עדכונים על מלגות מתאימות">
            <input type="email" value={f.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => touch('email')}
              placeholder="name@mail.com"
              className={`${INPUT} ${emailErr ? 'ring-2 ring-error' : ''}`}
              dir="ltr" />
            {emailErr && <FieldError msg={emailErr} />}
          </BentoCard>
          <BentoCard icon="phone" title="מספר טלפון"
            description="ליצירת קשר במידת הצורך">
            <input type="tel" value={f.phone}
              onChange={e => set('phone', e.target.value)}
              onBlur={() => touch('phone')}
              placeholder="050-0000000"
              className={`${INPUT} ${phoneErr ? 'ring-2 ring-error' : ''}`}
              dir="ltr" />
            {phoneErr && <FieldError msg={phoneErr} />}
          </BentoCard>
        </div>

        <Divider />

        {/* Marital status */}
        <div className="space-y-3 text-right">
          <label className="block text-on-surface font-bold text-lg">מהו המצב המשפחתי שלך?</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['single','married','divorced','widowed'] as MaritalStatus[]).map((v, i) => (
              <Chip key={v}
                label={['רווק/ה','נשוי/ה','גרוש/ה','אלמן/ה'][i]}
                selected={f.maritalStatus === v}
                onClick={() => set('maritalStatus', v)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Academic info — bento style
function Step2({ f, set }: { f: FormData; set: (k: keyof FormData, v: string | number | boolean) => void }) {
  return (
    <div className="space-y-8">
      <section className="text-right">
        <h1 className="text-3xl font-black text-primary font-headline mb-2">פרטי לימודים</h1>
        <p className="text-on-surface-variant">פרטי המוסד האקדמי ותחום הלימוד שלך.</p>
      </section>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BentoCard icon="school" title="מוסד לימודים"
            description="אנא ציין את האוניברסיטה או המכללה בה תלמד.">
            <input type="text" value={f.institution} onChange={e => set('institution', e.target.value)}
              placeholder="שם המוסד האקדמי" className={INPUT} />
          </BentoCard>
          <BentoCard icon="menu_book" title="תחום לימוד"
            description="הנדסה, רפואה, מחשבים, חינוך ועוד.">
            <input type="text" value={f.studyField} onChange={e => set('studyField', e.target.value)}
              placeholder="למשל: הנדסת תוכנה" className={INPUT} />
          </BentoCard>
        </div>

        <Divider />

        <div className="space-y-3 text-right">
          <label className="block text-on-surface font-bold text-lg">שנת לימוד נוכחית</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[1,2,3,4,5,6].map(y => (
              <Chip key={y} label={`שנה ${y}`} selected={f.studyYear === y} onClick={() => set('studyYear', y)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/// Step 3: Sector — multi-select
function Step3({ f, setSectors }: {
  f: FormData;
  setSectors: (sectors: string[]) => void;
}) {
  function toggle(s: string) {
    if (f.sectors.includes(s)) {
      setSectors(f.sectors.filter(x => x !== s));
    } else {
      setSectors([...f.sectors, s]);
    }
  }

  return (
    <div className="space-y-8">
      <section className="text-right">
        <h1 className="text-3xl font-black text-primary font-headline mb-2">שייכות קהילתית</h1>
        <p className="text-on-surface-variant">בחר את כל המגזרים שאתה משתייך אליהם — ניתן לבחור יותר מאחד.</p>
      </section>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-on-surface font-bold text-lg text-right">לאיזה מגזר אתה משתייך?</label>
          {f.sectors.length > 0 && (
            <span className="text-xs font-bold bg-primary text-white px-2.5 py-1 rounded-full flex-shrink-0">
              {f.sectors.length} נבחרו
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SECTOR_OPTIONS.map(s => (
            <Chip key={s} label={s} selected={f.sectors.includes(s)} onClick={() => toggle(s)} />
          ))}
        </div>
        {f.sectors.length === 0 && (
          <p className="text-xs text-on-surface-variant/60 mt-4 text-right">
            לא נבחר מגזר — המערכת תתאים מלגות כלליות
          </p>
        )}
      </div>
    </div>
  );
}

// Step 4: Military + Geography
function Step4({ f, set }: { f: FormData; set: (k: keyof FormData, v: string | number | boolean) => void }) {
  return (
    <div className="space-y-8">
      <section className="text-right">
        <h1 className="text-3xl font-black text-primary font-headline mb-2">שירות צבאי ומגורים</h1>
        <p className="text-on-surface-variant">מידע על שירות צבאי ואזור מגורים מסייע לזהות מלגות ייחודיות.</p>
      </section>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-6">
        {/* Military service */}
        <div className="space-y-4 text-right">
          <label className="block text-on-surface font-bold text-lg">האם שירתת בשירות צבאי או לאומי?</label>
          <div className="flex gap-4">
            <RadioCard label="כן, שירתתי"
              checked={f.militaryService === true}
              onChange={() => set('militaryService', true)} />
            <RadioCard label="לא"
              checked={f.militaryService === false}
              onChange={() => { set('militaryService', false); set('militaryType', 'none'); }} />
          </div>

          {f.militaryService && (
            <ExpandedPanel title='פרטי שירות (לוחמים/תומכ"ל זכאים להטבות נוספות)'>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">סוג שירות</label>
                  <select value={f.militaryType}
                    onChange={e => set('militaryType', e.target.value)}
                    className={SELECT_INPUT}>
                    <option value="combat">לוחם/ת</option>
                    <option value="support">תומכ/ת לחימה</option>
                    <option value="national_service">שירות לאומי</option>
                    <option value="reserves">מילואים בלבד</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">שנות שירות</label>
                  <input type="number" min={0} max={10}
                    value={f.militaryYears || ''}
                    onChange={e => set('militaryYears', Number(e.target.value))}
                    placeholder="למשל: 3" className={INPUT} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">ימי מילואים (סה"כ)</label>
                  <input type="number" min={0}
                    value={f.reserveDays || ''}
                    onChange={e => set('reserveDays', Number(e.target.value))}
                    placeholder="0" className={INPUT} />
                </div>
              </div>
            </ExpandedPanel>
          )}
        </div>

        <Divider />

        {/* Geography bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BentoCard icon="location_on" title="אזור מגורים"
            description="מלגות רבות מבוססות על פריפריה חברתית או גיאוגרפית.">
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {AREA_OPTIONS.slice(0, 6).map(a => (
                <button key={a} type="button"
                  onClick={() => set('residenceArea', a)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    f.residenceArea === a
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                  }`}>
                  {a}
                </button>
              ))}
            </div>
            <input type="text" value={f.residenceArea}
              onChange={e => set('residenceArea', e.target.value)}
              placeholder="או הקלד עיר/יישוב..." className={INPUT} />
          </BentoCard>

          <BentoCard icon="map" title="אזור פריפריה"
            description="מלגות מסוימות מיועדות לתושבי פריפריה גיאוגרפית.">
            <div className="flex gap-3 mt-2">
              <RadioCard label="כן, אני מהפריפריה"
                checked={f.periphery === true}
                onChange={() => set('periphery', true)} />
              <RadioCard label="לא"
                checked={f.periphery === false}
                onChange={() => set('periphery', false)} />
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}

// Step 5: Volunteering
function Step5({ f, set }: { f: FormData; set: (k: keyof FormData, v: string | number | boolean) => void }) {
  return (
    <div className="space-y-8">
      <section className="text-right">
        <h1 className="text-3xl font-black text-primary font-headline mb-2">פעילות התנדבותית</h1>
        <p className="text-on-surface-variant">פעילות התנדבותית מגדילה משמעותית את הזכאות למלגות רבות.</p>
      </section>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-6">
        <div className="space-y-4 text-right">
          <label className="block text-on-surface font-bold text-lg">האם אתה/את פעיל/ה בהתנדבות?</label>
          <div className="flex gap-4">
            <RadioCard label="כן, אני מתנדב/ת"
              checked={f.volunteering === true}
              onChange={() => set('volunteering', true)} />
            <RadioCard label="לא"
              checked={f.volunteering === false}
              onChange={() => set('volunteering', false)} />
          </div>

          {f.volunteering && (
            <ExpandedPanel title="פרטי פעילות התנדבותית">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">שעות שבועיות</label>
                  <input type="number" min={0}
                    value={f.volunteeringWeeklyH || ''}
                    onChange={e => set('volunteeringWeeklyH', Number(e.target.value))}
                    placeholder="למשל: 6" className={INPUT} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">שעות שנתיות (סה"כ)</label>
                  <input type="number" min={0}
                    value={f.volunteeringHours || ''}
                    onChange={e => set('volunteeringHours', Number(e.target.value))}
                    placeholder="למשל: 140" className={INPUT} />
                </div>
              </div>
            </ExpandedPanel>
          )}
        </div>
      </div>
    </div>
  );
}



// ── Main component ────────────────────────────────────────────────────────────

export default function CandidateQuestionnaire() {
  // step 0 = intro, steps 1–5 = form, 'done' = success
  const [step,       setStep]       = useState<number | 'done'>(0);
  const [form,       setForm]       = useState<FormData>(INITIAL);
  const [error,      setError]      = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  function set(key: keyof FormData, value: string | number | boolean | string[]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError(null);
  }

  function setSectors(sectors: string[]) {
    setForm(prev => ({ ...prev, sectors }));
    setError(null);
  }

  function goNext() {
    if (step === 0) { setStep(1); return; }
    const err = validate(step as number, form);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => (s as number) + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setError(null);
    setStep(s => (s as number) - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    const err = validate(step as number, form);
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError(null);
    try {
      const schSnap = await getDocs(query(collection(db, 'scholarships'), orderBy('name')));
      const scholarships = schSnap.docs.map(d => ({ id: d.id, data: d.data() as Scholarship }));
      const candidate: Candidate = {
        ...form,
        sectors: form.sectors.length > 0 ? form.sectors : ['כללי'],
        matchedScholarships: [],
        status: 'new',
      };
      const matches = runMatching(candidate, scholarships);
      candidate.matchedScholarships = matches;
      await addDoc(collection(db, 'candidates'), {
        ...candidate, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setMatchCount(matches.length);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      setError('שגיאה בשמירת הטופס. אנא נסה שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === TOTAL_STEPS;
  const progressPct = step === 0 ? 0 : Math.round(((step as number) / TOTAL_STEPS) * 100);
  const stepLabel = step === 0 ? '' : `שלב ${step} מתוך ${TOTAL_STEPS}`;

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm">
          <div className="flex flex-row-reverse justify-between items-center px-6 py-3 max-w-3xl mx-auto w-full">
            <span className="text-xl font-bold text-primary font-headline">{headerName}</span>
          </div>
          <div className="bg-surface-container h-px w-full" />
        </header>

        <main className="flex-grow flex items-center justify-center px-6 pt-24 pb-28 md:pb-8">
          <div className="max-w-md w-full text-center">
            {/* Success icon */}
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
              <span className="material-symbols-outlined text-5xl text-emerald-600"
                style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>

            <h1 className="text-3xl font-black text-primary font-headline mb-3">
              הטופס נשלח בהצלחה!
            </h1>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              תודה {form.name.split(' ')[0]}! הפרטים שלך נקלטו במערכת ואנחנו כבר בודקים את ההתאמות הטובות ביותר עבורך.
            </p>

            {/* Match count card */}
            {matchCount > 0 ? (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
                <p className="text-5xl font-black text-primary mb-2">{matchCount}</p>
                <p className="font-bold text-primary text-lg">מלגות מתאימות נמצאו!</p>
                <p className="text-sm text-on-surface-variant mt-2">צוות ציר לצעיר יצור איתך קשר בהקדם</p>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-xl p-5 mb-8">
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  לא נמצאו מלגות מתאימות כרגע. נעדכן אותך ברגע שיתווספו מלגות חדשות המתאימות לפרופיל שלך.
                </p>
              </div>
            )}

            {/* Trust chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <span className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">security</span>
                פרטייך מוגנים
              </span>
              <span className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                נעדכן אותך
              </span>
            </div>

            <button
              onClick={() => { setForm(INITIAL); setStep(0); }}
              className="w-full border border-outline-variant text-on-surface-variant py-3 rounded-xl font-bold text-sm hover:bg-surface-container transition-colors"
            >
              מלא שאלון נוסף
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── INTRO SCREEN (step 0) ───────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col" dir="rtl">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm">
          <div className="flex flex-row-reverse justify-between items-center px-6 h-16 max-w-3xl mx-auto w-full">
            <span className="text-xl font-bold text-primary font-headline"> {headerName}</span>
            <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined text-primary">menu</span>
            </button>
          </div>
          <div className="bg-surface-container h-px w-full" />
        </header>

        <main className="flex-grow pt-16 flex flex-col items-center relative overflow-hidden">
          {/* Background blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary-container/10 rounded-full blur-3xl" />
          </div>

          <div className="container max-w-lg mx-auto px-6 py-12 relative z-10 flex flex-col items-center text-center">

            {/* Hero illustration */}
            <div className="w-full mb-10 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10"
              style={{ aspectRatio: '16/9' }}
              >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-qB6G6usCs1tvkGQu2WCjw-Uu_UjBx9ZyAe31CHR5VsYPZIKAlq1GMbJR54IRdtZtiGkCIHrdOAqAZ5RKPsQregZiAzRm0uZEHMkbThjcUs0_CxnqbGTWz16sxBgMebdTlxDAYk7Xf7WKuwDrkY5S4858KYdfsyfn8BGJDATIV7KdU9bWYuA4H5mUknl6xDtBEwJ1ophkuLwQyxyY0sPCky_bOsb2573jUfzmvsblH5THIm9P62k4UYydN2Ec3LQNoQfHUMlRIx_P"
                alt="מצא את המלגה המתאימה לך"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold text-primary font-headline tracking-tight leading-tight mb-4">
              מצא את המלגה המתאימה לך ביותר
            </h1>
            <p className="text-lg text-on-surface-variant font-light leading-relaxed mb-8 max-w-sm">
              השאלון הקצר שלנו ינתח את הנתונים שלך ויתאים לך אישית את המלגות הרלוונטיות ביותר.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {[
                { icon: 'timer', label: '3 דקות בלבד' },
                { icon: 'verified', label: 'התאמה אישית מדויקת' },
                { icon: 'auto_awesome', label: 'גישה למאות מלגות' },
              ].map(c => (
                <span key={c.label}
                  className="px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">{c.icon}</span>
                  {c.label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={goNext}
              className="bg-gradient-to-br from-primary to-primary-container text-white px-12 py-5 rounded-full text-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <span>התחל בשאלון</span>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <p className="mt-4 text-sm text-on-surface-variant/60 font-medium italic">
              * השירות ניתן ללא עלות לסטודנטים
            </p>

            {/* Trust indicators */}
            <div className="mt-16 grid grid-cols-3 gap-6 w-full border-t border-outline-variant/10 pt-10">
              {[
                { icon: 'security',  title: 'פרטיות מובטחת',  desc: 'המידע שלך מוגן ומאובטח' },
                { icon: 'groups',    title: 'קהילה תומכת',    desc: 'מעל 50,000 סטודנטים' },
                { icon: 'school',    title: 'ליווי אקדמי',    desc: 'לכל המוסדות בארץ' },
              ].map(t => (
                <div key={t.title} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-3 text-primary">
                    <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                  </div>
                  <h3 className="font-bold text-on-surface text-sm">{t.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

      </div>
    );
  }

  // ── FORM STEPS (1–5) ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-on-surface pb-28 md:pb-0 md:pt-16" dir="rtl">

      {/* ── TopAppBar ─────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-md shadow-sm">
        <div className="flex flex-row-reverse justify-between items-center px-6 py-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary font-headline">{headerName}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>
        <div className="bg-slate-200/50 h-px w-full" />
      </header>

      {/* ── Main content ──────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-6 py-8 md:py-12">

        {/* ── Progress bar ──────────────────────────────────── */}
        <div className="mb-10 text-right">
          <div className="flex justify-between items-end mb-3">
            <span className="text-on-surface-variant text-sm font-medium">
              {stepLabel}{step === 1 ? ': פרטים אישיים' : step === 2 ? ': פרטי לימודים' : step === 3 ? ': מגזר' : step === 4 ? ': שירות ומגורים' : ': התנדבות'}
            </span>
            <span className="text-primary font-bold text-lg">{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* ── Step content ──────────────────────────────────── */}
        <div className="space-y-8">
          {step === 1 && <Step1 f={form} set={set} />}
          {step === 2 && <Step2 f={form} set={set} />}
          {step === 3 && <Step3 f={form} setSectors={setSectors} />}
          {step === 4 && <Step4 f={form} set={set} />}
          {step === 5 && <Step5 f={form} set={set} />}

          {/* ── Error ─────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
              {error}
            </div>
          )}

          {/* ── Navigation ────────────────────────────────────── */}
          <div className="flex flex-row-reverse items-center justify-between pt-4">
            <button
              type="button"
              onClick={isLastStep ? submit : goNext}
              disabled={submitting}
              className="bg-gradient-to-br from-primary to-primary-container text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/20 active:scale-90 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>שולח...</span>
                </>
              ) : (
                <>
                  <span>{isLastStep ? 'שלח שאלון' : 'המשך לשלב הבא'}</span>
                  <span className="material-symbols-outlined">
                    {isLastStep ? 'send' : 'arrow_back'}
                  </span>
                </>
              )}
            </button>

            {(step as number) > 1 && (
              <button type="button" onClick={goBack}
                className="text-on-surface-variant font-semibold hover:text-primary transition-colors flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                <span>שלב הקודם</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── Desktop footer ─────────────────────────────────── */}
      <footer className="hidden md:flex w-full py-8 px-6 flex-row-reverse items-center justify-between gap-4 bg-slate-50 border-t border-slate-200 mt-12">
        <div className="text-sm font-headline text-right text-primary">
          © 2025 ציר לצעיר. כל הזכויות שמורות.
        </div>
        <div className="flex gap-6 text-sm">
          <a href="#" className="text-slate-500 hover:text-primary transition-colors">תנאי שימוש</a>
          <a href="#" className="text-slate-500 hover:text-primary transition-colors">פרטיות</a>
          <a href="#" className="text-slate-500 hover:text-primary transition-colors">צור קשר</a>
        </div>
      </footer>

   
    </div>
  );
}
