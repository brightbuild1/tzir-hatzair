import { useState } from 'react';
import type { Scholarship } from '../types/scholarship';

// ── Field config ──────────────────────────────────────────────────────────────
export type ScholarshipFormData = Omit<Scholarship, 'createdAt'>;

const EMPTY: ScholarshipFormData = {
  name: '', volunteering: '', military: '', periphery: '',
  sector: '', field: '', amount: '', openingDate: '', link: '',
};

const FIELDS: {
  key: keyof ScholarshipFormData;
  label: string;
  placeholder: string;
  hint?: string;
}[] = [
  { key: 'name',         label: 'שם המלגה',   placeholder: 'לדוגמה: מלגת קרן המייסדים' },
  { key: 'amount',       label: 'סכום',        placeholder: 'לדוגמה: 10000 / משתנה / מלא' },
  { key: 'openingDate',  label: 'תאריך פתיחה', placeholder: 'לדוגמה: ספטמבר / כל השנה' },
  { key: 'field',        label: 'תחום לימוד',  placeholder: 'לדוגמה: הנדסה / כללי / STEM' },
  { key: 'sector',       label: 'מגזר',        placeholder: 'לדוגמה: דור ראשון / חרדים' },
  { key: 'volunteering', label: 'התנדבות',     placeholder: 'לדוגמה: V / 140 שעות', hint: 'V = נדרש, טקסט = פרטים, ריק = לא נדרש' },
  { key: 'military',     label: 'שירות צבאי',  placeholder: 'לדוגמה: V / V (לוחמים)',  hint: 'V = נדרש, טקסט = פרטים, ריק = לא נדרש' },
  { key: 'periphery',    label: 'פריפריה',     placeholder: 'לדוגמה: V / V (צפון)',    hint: 'V = נדרש, טקסט = פרטים, ריק = לא נדרש' },
  { key: 'link',         label: 'קישור לאתר',  placeholder: 'https://...' },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  mode:     'create' | 'edit';
  initial?: Partial<ScholarshipFormData>;
  onSave:   (data: ScholarshipFormData) => Promise<void>;
  onClose:  () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScholarshipFormModal({ mode, initial, onSave, onClose }: Props) {
  const [form,   setForm]   = useState<ScholarshipFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function set(key: keyof ScholarshipFormData, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('שם המלגה הוא שדה חובה'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch {
      setError('שגיאה בשמירה – נסה שוב');
      setSaving(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const isCreate    = mode === 'create';
  const headerIcon  = isCreate ? 'add_card' : 'edit';
  const headerTitle = isCreate ? 'הוספת מלגה חדשה' : 'עריכת מלגה';
  const submitLabel = isCreate ? 'צור מלגה' : 'שמור שינויים';
  const subtitle    = isCreate ? 'מלא את פרטי המלגה החדשה' : (initial?.name ?? '');

  const [nameField, ...restFields] = FIELDS;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-primary px-8 py-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-container opacity-20 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black mb-1">{headerTitle}</h2>
              <p className="text-on-primary-container text-sm truncate max-w-sm">{subtitle}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">{headerIcon}</span>
            </div>
          </div>
        </div>

        {/* Form — scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-8 space-y-5">

            {/* Name — full width */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-on-surface-variant pr-1">
                {nameField.label}
                <span className="text-error mr-1">*</span>
              </label>
              <input
                type="text"
                value={form[nameField.key]}
                onChange={e => set(nameField.key, e.target.value)}
                placeholder={nameField.placeholder}
                autoFocus
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-sm text-right"
              />
            </div>

            {/* Remaining fields — 2-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {restFields.map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-sm font-bold text-on-surface-variant pr-1">
                    {f.label}
                  </label>
                  <input
                    type={f.key === 'link' ? 'url' : 'text'}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    dir={f.key === 'link' ? 'ltr' : 'rtl'}
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-sm"
                  />
                  {f.hint && (
                    <p className="text-xs text-on-surface-variant/60 pr-1">{f.hint}</p>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-error text-sm font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="bg-surface-container-low px-8 py-5 flex items-center justify-between gap-4 flex-shrink-0 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 rounded-full text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving
                ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-lg">check</span>}
              {saving ? 'שומר...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
