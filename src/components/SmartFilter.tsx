/**
 * SmartFilter — generic, reusable filter panel.
 *
 * Usage:
 *   const fields: FilterFieldConfig[] = [
 *     { type: 'text',   key: 'name',   label: 'Search', placeholder: '...' },
 *     { type: 'select', key: 'status', label: 'Status', options: [...] },
 *     { type: 'range',  key: 'amount', label: 'Amount', min: 0, max: 50000, step: 500, prefix: '₪' },
 *   ];
 *   <SmartFilter fields={fields} onApply={vals => setFilters(vals)} />
 *
 * `FilterValues` is a plain Record<key, string | [number,number]>.
 * Empty string / [min,max] means "not active" — consumers can check `key in values`.
 */

import { useState } from 'react';

// ── Public Types ──────────────────────────────────────────────────────────────

export type SelectOption = { value: string; label: string };

export type FilterFieldConfig =
  | { type: 'text';   key: string; label: string; placeholder?: string }
  | { type: 'select'; key: string; label: string; options: SelectOption[]; allLabel?: string }
  | { type: 'range';  key: string; label: string; min: number; max: number; step?: number; prefix?: string }

/** Values emitted by onApply. Only active filters are present (empty / full-range keys are omitted). */
export type FilterValues = Record<string, string | [number, number]>

// ── Internal: Dual-handle Range Slider ───────────────────────────────────────

const RANGE_CSS = `
.sf-dual-range { position: relative; height: 22px; }
.sf-dual-range input[type="range"] {
  -webkit-appearance: none; appearance: none;
  pointer-events: none; background: transparent;
  position: absolute; width: 100%; height: 100%;
  left: 0; top: 0; margin: 0; padding: 0;
}
.sf-dual-range input[type="range"]:focus { outline: none; }
.sf-dual-range input[type="range"]::-webkit-slider-runnable-track { background: transparent; height: 6px; }
.sf-dual-range input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  pointer-events: all;
  width: 22px; height: 22px; border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #6b6b6b 0%, #2a2a2a 60%);
  cursor: pointer; border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.12);
  margin-top: -8px;
}
.sf-dual-range input[type="range"]::-moz-range-track { background: transparent; height: 6px; }
.sf-dual-range input[type="range"]::-moz-range-thumb {
  pointer-events: all; width: 22px; height: 22px; border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #6b6b6b 0%, #2a2a2a 60%);
  cursor: pointer; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.45);
}
`;

type RangeField = Extract<FilterFieldConfig, { type: 'range' }>;

function RangeSlider({ field, value, onChange }: {
  field: RangeField;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const { min, max, step = 1, prefix = '' } = field;
  const [lo, hi] = value;
  const pctLo = ((lo - min) / (max - min)) * 100;
  const pctHi = ((hi - min) / (max - min)) * 100;

  return (
    <div dir="ltr" className="flex items-center gap-2">
      {/* Left value label */}
      <span className="text-xs font-bold text-primary whitespace-nowrap" style={{ minWidth: '38px' }}>
        {prefix}{lo.toLocaleString()}
      </span>

      {/* Track + thumbs — same height as thumb (22px) */}
      <div className="relative flex-1" style={{ height: '22px' }}>
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '11px', right: '11px', height: '4px' }}>
          <div className="absolute inset-0 rounded-full" style={{ background: '#dde3ed' }} />
          <div
            className="absolute top-0 bottom-0 rounded-full"
            style={{ left: `${pctLo}%`, right: `${100 - pctHi}%`, background: '#003f87' }}
          />
        </div>
        <div className="sf-dual-range">
          <input type="range" min={min} max={max} step={step} value={lo}
            onChange={e => onChange([Math.min(Number(e.target.value), hi - step), hi])}
            style={{ zIndex: lo > max - step * 2 ? 5 : 3 }}
          />
          <input type="range" min={min} max={max} step={step} value={hi}
            onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
            style={{ zIndex: 4 }}
          />
        </div>
      </div>

      {/* Right value label */}
      <span className="text-xs font-bold text-primary whitespace-nowrap text-right" style={{ minWidth: '52px' }}>
        {hi >= max ? `${prefix}${hi.toLocaleString()}+` : `${prefix}${hi.toLocaleString()}`}
      </span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initPending(fields: FilterFieldConfig[]): FilterValues {
  const v: FilterValues = {};
  for (const f of fields) {
    v[f.key] = f.type === 'range' ? [f.min, f.max] : '';
  }
  return v;
}

function buildActive(fields: FilterFieldConfig[], pending: FilterValues): FilterValues {
  const result: FilterValues = {};
  for (const f of fields) {
    const v = pending[f.key];
    if (f.type === 'range') {
      const [lo, hi] = v as [number, number];
      if (lo > f.min || hi < f.max) result[f.key] = [lo, hi];
    } else if (v !== '') {
      result[f.key] = v;
    }
  }
  return result;
}

function chipLabel(field: FilterFieldConfig, val: string | [number, number]): string {
  if (field.type === 'range') {
    const [lo, hi] = val as [number, number];
    const p = field.prefix ?? '';
    return `${p}${lo.toLocaleString()} – ${p}${hi.toLocaleString()}`;
  }
  if (field.type === 'select') {
    return field.options.find(o => o.value === val)?.label ?? String(val);
  }
  return String(val);
}

// ── SmartFilter ───────────────────────────────────────────────────────────────

interface SmartFilterProps {
  fields: FilterFieldConfig[];
  onApply: (values: FilterValues) => void;
  className?: string;
}

const INPUT_CLS = 'w-full bg-surface-container-lowest border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm text-right text-on-surface outline-none';

export default function SmartFilter({ fields, onApply, className = '' }: SmartFilterProps) {
  const [pending, setPending] = useState<FilterValues>(() => initPending(fields));
  const [applied, setApplied] = useState<FilterValues>({});

  function update(key: string, val: string | [number, number]) {
    setPending(prev => ({ ...prev, [key]: val }));
  }

  function apply() {
    const next = buildActive(fields, pending);
    setApplied(next);
    onApply(next);
  }

  function removeChip(key: string) {
    const field = fields.find(f => f.key === key)!;
    const reset: FilterValues[string] = field.type === 'range' ? [field.min, field.max] : '';
    setPending(prev => ({ ...prev, [key]: reset }));
    const next = { ...applied };
    delete next[key];
    setApplied(next);
    onApply(next);
  }

  function clearAll() {
    const fresh = initPending(fields);
    setPending(fresh);
    setApplied({});
    onApply({});
  }

  const chips = Object.entries(applied).map(([key, val]) => {
    const field = fields.find(f => f.key === key);
    return field ? { key, label: chipLabel(field, val) } : null;
  }).filter(Boolean) as { key: string; label: string }[];

  return (
    <div className={`bg-surface-container-low rounded-xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 ${className}`}>
      <style>{RANGE_CSS}</style>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map(field => (
          <div key={field.key} className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface-variant">{field.label}</label>

            {field.type === 'text' && (
              <div className="relative">
                <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 right-3 text-on-surface-variant/50 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={pending[field.key] as string}
                  onChange={e => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`${INPUT_CLS} pr-10 placeholder:text-on-surface-variant/40`}
                />
              </div>
            )}

            {field.type === 'select' && (
              <select
                value={pending[field.key] as string}
                onChange={e => update(field.key, e.target.value)}
                className={`${INPUT_CLS} appearance-none cursor-pointer`}
              >
                <option value="">{field.allLabel ?? 'הכל'}</option>
                {field.options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            {field.type === 'range' && (
              <div className="bg-surface-container-lowest rounded-lg py-3 px-4">
                <RangeSlider
                  field={field}
                  value={pending[field.key] as [number, number]}
                  onChange={v => update(field.key, v)}
                />
              </div>
            )}
          </div>
        ))}

        {/* Apply button always occupies the next grid cell */}
        <div className="flex items-end">
          <button
            onClick={apply}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            <span>החל מסננים</span>
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          {chips.map(c => (
            <div
              key={c.key}
              className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-xs flex items-center gap-1.5"
            >
              <span>{c.label}</span>
              <button onClick={() => removeChip(c.key)} className="hover:text-error transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
              </button>
            </div>
          ))}
          <button onClick={clearAll} className="text-xs text-primary font-bold hover:underline mr-1">
            נקה הכל
          </button>
        </div>
      )}
    </div>
  );
}
