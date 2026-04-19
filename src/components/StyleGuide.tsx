const colors = [
  { label: 'brand-primary',           value: '#003f87' },
  { label: 'brand-primary-container', value: '#0056b3' },
  { label: 'brand-secondary',         value: '#4c5e84' },
  { label: 'brand-secondary-cnt',     value: '#bfd2fd' },
  { label: 'brand-tertiary',          value: '#722b00' },
  { label: 'brand-tertiary-cnt',      value: '#983c00' },
  { label: 'surface',                 value: '#f8f9fa' },
  { label: 'surface-lowest',          value: '#ffffff' },
  { label: 'surface-low',             value: '#f3f4f5' },
  { label: 'surface-container',       value: '#edeeef' },
  { label: 'surface-high',            value: '#e7e8e9' },
  { label: 'surface-highest',         value: '#e1e3e4' },
  { label: 'surface-dim',             value: '#d9dadb' },
  { label: 'on-surface',              value: '#191c1d' },
  { label: 'on-surface-variant',      value: '#424752' },
  { label: 'outline',                 value: '#727784' },
  { label: 'outline-variant',         value: '#c2c6d4' },
  { label: 'inverse-surface',         value: '#2e3132' },
  { label: 'error',                   value: '#ba1a1a' },
  { label: 'error-container',         value: '#ffdad6' },
];

const typeScale = [
  { label: 'display-lg',   size: '3.5625rem', weight: '700' },
  { label: 'display-md',   size: '2.8125rem', weight: '700' },
  { label: 'display-sm',   size: '2.25rem',   weight: '700' },
  { label: 'headline-lg',  size: '2rem',      weight: '600' },
  { label: 'headline-md',  size: '1.75rem',   weight: '600' },
  { label: 'headline-sm',  size: '1.5rem',    weight: '600' },
  { label: 'title-lg',     size: '1.375rem',  weight: '500' },
  { label: 'title-md',     size: '1rem',      weight: '500' },
  { label: 'title-sm',     size: '0.875rem',  weight: '500' },
  { label: 'body-lg',      size: '1rem',      weight: '400' },
  { label: 'body-md',      size: '0.875rem',  weight: '400' },
  { label: 'body-sm',      size: '0.75rem',   weight: '400' },
  { label: 'label-lg',     size: '0.875rem',  weight: '500' },
  { label: 'label-md',     size: '0.75rem',   weight: '500' },
  { label: 'label-sm',     size: '0.6875rem', weight: '500' },
];

export default function StyleGuide() {
  return (
    <div style={{ padding: '2rem', fontFamily: "'Assistant', sans-serif", direction: 'rtl' }}>
      <h1 style={{ fontFamily: "'Heebo', sans-serif", fontSize: '2rem', marginBottom: '2rem', color: '#003f87' }}>
        StyleGuide — מערכת מלגות חכמה
      </h1>

      {/* Colors */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: "'Heebo', sans-serif", fontSize: '1.25rem', marginBottom: '1rem', color: '#191c1d' }}>
          צבעים
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {colors.map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', width: '120px' }}>
              <div style={{
                width: '100%',
                height: '56px',
                borderRadius: '0.5rem',
                background: value,
                border: '1px solid rgba(0,0,0,0.08)',
                marginBottom: '0.25rem',
              }} />
              <div style={{ fontSize: '0.65rem', color: '#424752', lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: '0.65rem', color: '#727784', fontFamily: 'monospace' }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: "'Heebo', sans-serif", fontSize: '1.25rem', marginBottom: '1rem', color: '#191c1d' }}>
          טיפוגרפיה
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {typeScale.map(({ label, size, weight }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#727784', width: '90px', flexShrink: 0, fontFamily: 'monospace' }}>
                {label}
              </span>
              <span style={{ fontSize: size, fontWeight: weight, color: '#191c1d', lineHeight: 1.2 }}>
                שלום עולם
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: "'Heebo', sans-serif", fontSize: '1.25rem', marginBottom: '1rem', color: '#191c1d' }}>
          כפתורים
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            background: 'linear-gradient(135deg, #003f87, #0056b3)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'Assistant', sans-serif",
          }}>
            ראשי
          </button>
          <button style={{
            background: '#e7e8e9',
            color: '#004491',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'Assistant', sans-serif",
          }}>
            משני
          </button>
          <button style={{
            background: 'transparent',
            color: '#003f87',
            border: '1px solid rgba(114,119,132,0.25)',
            borderRadius: '0.75rem',
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'Assistant', sans-serif",
          }}>
            מתאר
          </button>
          <span style={{
            background: '#bfd2fd',
            color: '#475a7f',
            borderRadius: '9999px',
            padding: '0.25rem 0.875rem',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}>
            סטטוס
          </span>
          <span style={{
            background: '#ffdad6',
            color: '#93000a',
            borderRadius: '9999px',
            padding: '0.25rem 0.875rem',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}>
            שגיאה
          </span>
        </div>
      </section>

      {/* Shadows */}
      <section>
        <h2 style={{ fontFamily: "'Heebo', sans-serif", fontSize: '1.25rem', marginBottom: '1rem', color: '#191c1d' }}>
          צללים
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'shadow-card',    shadow: '0 2px 8px 0 rgba(25,28,29,0.04)' },
            { label: 'shadow-ambient', shadow: '0 0 32px 0 rgba(25,28,29,0.04)' },
            { label: 'shadow-float',   shadow: '0 8px 24px 0 rgba(25,28,29,0.08)' },
          ].map(({ label, shadow }) => (
            <div key={label} style={{
              background: '#ffffff',
              borderRadius: '0.75rem',
              padding: '1.5rem 2rem',
              boxShadow: shadow,
            }}>
              <span style={{ fontSize: '0.75rem', color: '#424752', fontFamily: 'monospace' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
